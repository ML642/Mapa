// services/aggregateFilter.js
const mongoose = require("mongoose");
const Event = require("../models/Event");
const { buildEventDateAddFieldsStage, buildEventDateQuery } = require("./eventScheduleService");

exports.aggregateFilter = async ({
	model = Event,
	id,
	dateField = model === Event ? "event_dates" : null,
	dateFrom,
	dateTo,
	sort = null,
	page,
	size,
	category,
	status = model === Event ? "active" : null,
	query,
	select = Event.visibleFields,
	populate = [], // [{ from: "collection", localField: "field", as: "alias", select: ["field1", "field2"] }]
}) => {
	const filter = {};
	page = Math.max(1, Number(page) || 1);
	size = typeof size === "string" ? Math.min(100, Math.max(1, Number(size) || 20)) : Math.max(1, Number(size) || 20);

	if (id) {
		if (!mongoose.Types.ObjectId.isValid(id)) return { data: [], total: 0, page: Number(page), totalPages: 0 };
		filter._id = new mongoose.Types.ObjectId(id);
	}

	if (query) {
		const regex = query.join("|");
		filter.$or = [
			{ title: { $regex: regex, $options: "i" } },
			{ description: { $regex: regex, $options: "i" } },
			{ address: { $regex: regex, $options: "i" } },
		];
	}

	if (category) {
		const resolved = Event.resolveCategory(category);
		if (resolved) filter.category = resolved;
	}

	if (status) filter.status = status;

	const pipeline = [];

	pipeline.push({ $match: filter });

	if (dateField) {
		pipeline.push(buildEventDateAddFieldsStage());
		pipeline.push({ $match: buildEventDateQuery({ dateFrom, dateTo }) });
	}

	for (const p of populate) {
		const lookupPipeline = [];

		if (p.select && p.select.includes("event_date")) {
			lookupPipeline.push(buildEventDateAddFieldsStage());
		}

		if (p.select) {
			const projection = p.select.reduce((acc, f) => {
				acc[f] = 1;
				return acc;
			}, {});

			lookupPipeline.push({
				$project: projection,
			});
		}

		pipeline.push({
			$lookup: {
				from: p.from,
				localField: p.localField,
				foreignField: "_id",
				as: p.as,
				pipeline: lookupPipeline,
			},
		});

		if (model.schema.paths[p.localField].instance !== "Array") {
			pipeline.push({
				$unwind: {
					path: `$${p.as}`,
					preserveNullAndEmptyArrays: true,
				},
			});
		}
	}

	let total = 0;
	if (!id) {
		if (sort) pipeline.push({ $sort: sort });

		const countPipeline = [...pipeline, { $count: "total" }];
		const countResult = await model.aggregate(countPipeline);
		total = countResult[0]?.total || 0;

		const skip = (page - 1) * size;

		pipeline.push({ $skip: skip });
		pipeline.push({ $limit: size });
	}

	if (select) {
		const projection = {};

		const selectFields = typeof select === "string" ? select.split(" ") : select;
		selectFields.forEach((f) => {
			projection[f] = 1;
		});

		pipeline.push({ $project: projection });
	}

	const data = await model.aggregate(pipeline);

	return {
		data: id ? data[0] || null : data,
		total: id ? (data[0] ? 1 : 0) : total,
		page: Number(page),
		totalPages: Math.ceil(total / size),
	};
};
