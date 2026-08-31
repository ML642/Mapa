const Event = require("../models/Event");
const { parseSearchQuery } = require("./parseSearchQuery");
const { buildEventDateAddFieldsStage, buildEventDateQuery } = require("./eventScheduleService");

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBasePipeline = ({ category, dateFrom, dateTo, status }) => {
	const pipeline = [{ $match: { status, ...(category ? { category } : {}) } }];

	pipeline.push(buildEventDateAddFieldsStage());
	pipeline.push({ $match: buildEventDateQuery({ dateFrom, dateTo }) });
	pipeline.push({
		$addFields: {
			_searchTitle: { $ifNull: ["$title", ""] },
			_searchDescription: { $ifNull: ["$description", ""] },
			_searchAddress: { $ifNull: ["$address", ""] },
			_searchCategory: { $ifNull: ["$category", ""] },
		},
	});

	return pipeline;
};

const createScorePipeline = ({ normalizedText, tokens, useTextIndex, baselineScore = 0 }) => {
	const pipeline = [];
	const scoreParts = [];
	const normalizedPattern = normalizedText ? escapeRegex(normalizedText) : null;

	if (useTextIndex) {
		pipeline.push({
			$addFields: {
				_textScore: { $meta: "textScore" },
			},
		});
		scoreParts.push({ $multiply: ["$_textScore", 20] });
	}

	if (normalizedPattern) {
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchTitle", regex: `^${normalizedPattern}$`, options: "i" } }, 140, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchTitle", regex: `^${normalizedPattern}`, options: "i" } }, 70, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchTitle", regex: normalizedPattern, options: "i" } }, 35, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchAddress", regex: normalizedPattern, options: "i" } }, 16, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchCategory", regex: normalizedPattern, options: "i" } }, 18, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchDescription", regex: normalizedPattern, options: "i" } }, 8, 0],
		});
	}

	for (const token of tokens) {
		const tokenPattern = escapeRegex(token);
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchTitle", regex: tokenPattern, options: "i" } }, 14, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchCategory", regex: tokenPattern, options: "i" } }, 12, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchAddress", regex: tokenPattern, options: "i" } }, 8, 0],
		});
		scoreParts.push({
			$cond: [{ $regexMatch: { input: "$_searchDescription", regex: tokenPattern, options: "i" } }, 4, 0],
		});
	}

	if (baselineScore > 0) {
		scoreParts.push(baselineScore);
	}

	return [
		...pipeline,
		{
			$addFields: {
				searchScore: {
					$add: scoreParts.length ? scoreParts : [0],
				},
			},
		},
		{
			$match: {
				searchScore: { $gt: 0 },
			},
		},
	];
};

const finalizeSearch = async (pipeline, { page, size }) => {
	const countResult = await Event.aggregate([...pipeline, { $count: "total" }]);
	const total = countResult[0]?.total || 0;
	const totalPages = total ? Math.ceil(total / size) : 0;

	if (!total) {
		return {
			events: [],
			total: 0,
			page,
			totalPages: 0,
		};
	}

	const events = await Event.aggregate([
		...pipeline,
		{ $sort: { searchScore: -1, is_premium: -1, event_date: 1, createdAt: -1 } },
		{ $skip: (page - 1) * size },
		{ $limit: size },
		{
			$project: Event.visibleFields.reduce((projection, field) => {
				projection[field] = 1;
				return projection;
			}, {}),
		},
	]);

	return {
		events,
		total,
		page,
		totalPages,
	};
};

const runTextSearch = async ({ category, dateFrom, dateTo, page, size, normalizedText, tokens, searchText }) => {
	const pipeline = buildBasePipeline({ category, dateFrom, dateTo, status: "active" });

	pipeline[0].$match.$text = { $search: searchText };

	pipeline.push(
		...createScorePipeline({
			normalizedText,
			tokens,
			useTextIndex: true,
		})
	);

	return finalizeSearch(pipeline, { page, size });
};

const runRegexFallbackSearch = async ({ category, dateFrom, dateTo, page, size, normalizedText, tokens }) => {
	const pipeline = buildBasePipeline({ category, dateFrom, dateTo, status: "active" });
	const patterns = [...new Set((tokens.length ? tokens : [normalizedText]).filter(Boolean).map((token) => escapeRegex(token)))];

	pipeline.push({
		$match: {
			$or: [
				{ title: { $regex: patterns.join("|"), $options: "i" } },
				{ description: { $regex: patterns.join("|"), $options: "i" } },
				{ address: { $regex: patterns.join("|"), $options: "i" } },
				{ category: { $regex: patterns.join("|"), $options: "i" } },
			],
		},
	});

	pipeline.push(
		...createScorePipeline({
			normalizedText,
			tokens,
			useTextIndex: false,
		})
	);

	return finalizeSearch(pipeline, { page, size });
};

exports.searchEvents = async ({ text, page, size, category, dateFrom, dateTo }) => {
	const parsedQuery = parseSearchQuery(text, category, dateFrom, dateTo);
	const normalizedCategory = Event.resolveCategory(parsedQuery.category);
	const normalizedText = parsedQuery.normalizedQuery;
	const tokens = parsedQuery.query;
	const searchText = parsedQuery.searchText;
	const pageNumber = Math.max(1, Number(page) || 1);
	const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(size) || PAGE_SIZE_DEFAULT));
	const filterOnlyQuery = Boolean(normalizedCategory || parsedQuery.dateFrom || parsedQuery.dateTo) && !searchText;

	if (!searchText && !filterOnlyQuery) {
		return {
			events: [],
			total: 0,
			page: pageNumber,
			totalPages: 0,
		};
	}

	if (filterOnlyQuery) {
		const pipeline = buildBasePipeline({
			category: normalizedCategory,
			dateFrom: parsedQuery.dateFrom,
			dateTo: parsedQuery.dateTo,
			status: "active",
		});

		pipeline.push(
			...createScorePipeline({
				normalizedText,
				tokens,
				useTextIndex: false,
				baselineScore: 1,
			})
		);

		return finalizeSearch(pipeline, { page: pageNumber, size: pageSize });
	}

	const primaryResult = await runTextSearch({
		category: normalizedCategory,
		dateFrom: parsedQuery.dateFrom,
		dateTo: parsedQuery.dateTo,
		page: pageNumber,
		size: pageSize,
		normalizedText,
		tokens,
		searchText,
	});

	if (primaryResult.total || normalizedText.length < 3) {
		return primaryResult;
	}

	return runRegexFallbackSearch({
		category: normalizedCategory,
		dateFrom: parsedQuery.dateFrom,
		dateTo: parsedQuery.dateTo,
		page: pageNumber,
		size: pageSize,
		normalizedText,
		tokens,
	});
};
