const isEqual = require("lodash/isEqual");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const { downloadImageToMemory, uploadImages } = require("./imageService");
const { normalizeEventDateUpdate } = require("./eventScheduleService");

const DEFAULT_PARSER_USER_ID = "690f589839384e57f1ce32cf";
const DEFAULT_PARSE_POLICY = Object.freeze({
	auto: ["event_dates", "schedule", "dateRange", "dateDisplayMode", "isPermanent", "phone"],
	review: ["title", "description", "address", "coordinates", "category", "price", "price_description", "is_premium"],
});

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const normalizeText = (value) => {
	if (value === undefined || value === null) return undefined;

	const normalized = String(value).trim();
	return normalized ? normalized : undefined;
};

const normalizeNumber = (value) => {
	if (value === undefined) return undefined;
	if (value === null || value === "") return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeBoolean = (value) => {
	if (value === undefined) return undefined;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(normalized)) return true;
		if (["false", "0", "no", "off"].includes(normalized)) return false;
	}

	return undefined;
};

const normalizeCoordinates = (value) => {
	if (value === undefined || value === null || value === "") return undefined;
	if (!Array.isArray(value) || value.length !== 2) return undefined;

	const coordinates = value.map((item) => Number(item));
	return coordinates.every(Number.isFinite) ? coordinates : undefined;
};

const normalizeDateArray = (value) => {
	if (value === undefined) return undefined;

	const values = Array.isArray(value) ? value : [value];
	const parsed = values
		.map((item) => new Date(item))
		.filter((date) => !Number.isNaN(date.getTime()))
		.sort((left, right) => left.getTime() - right.getTime());

	if (!parsed.length) return Array.isArray(value) && value.length === 0 ? [] : undefined;

	return parsed.filter((date, index) => index === 0 || date.getTime() !== parsed[index - 1].getTime());
};

const normalizePhone = (value) => {
	if (value === undefined) return undefined;
	if (Array.isArray(value)) {
		const phones = value.map((item) => normalizeText(item)).filter(Boolean);
		return phones.length ? phones.join(", ") : undefined;
	}

	return normalizeText(value);
};

const clearParserModeration = (event, userId) => {
	event.updatedBy = userId;
	event.moderation = {
		required: false,
		queue: null,
		state: null,
		reason: null,
		source: null,
		runId: null,
		diff: {},
		lastReviewedAt: new Date(),
	};
};

const resolveParserUserId = (run) => {
	const configuredId = process.env.PARSER_SYSTEM_USER_ID;
	if (configuredId && mongoose.Types.ObjectId.isValid(configuredId)) return configuredId;

	if (run?.requestedBy && mongoose.Types.ObjectId.isValid(run.requestedBy)) return run.requestedBy.toString();

	return DEFAULT_PARSER_USER_ID;
};

const getParsePolicy = (event) => {
	const auto = Array.isArray(event?.parseFields?.auto) && event.parseFields.auto.length ? event.parseFields.auto : DEFAULT_PARSE_POLICY.auto;
	const review =
		Array.isArray(event?.parseFields?.review) && event.parseFields.review.length
			? event.parseFields.review
			: DEFAULT_PARSE_POLICY.review;

	return {
		auto: [...new Set(auto)],
		review: [...new Set(review.filter((field) => !auto.includes(field)))],
	};
};

const normalizeParsedEventPayload = (payload = {}, fallbackSource = null) => {
	const parserSource = normalizeText(payload.parserSource || payload.sourceKey || payload.sourceName || fallbackSource);
	const sourceUrl = normalizeText(payload.sourceUrl || payload.link || payload.url || payload.source);
	const externalId = normalizeText(payload.externalId || payload.parserEventId || payload.id);
	const title = normalizeText(payload.title);
	const description = normalizeText(payload.description);
	const address = normalizeText(payload.address);
	const coordinates = normalizeCoordinates(payload.coordinates);
	const price = normalizeNumber(payload.price);
	const price_description = normalizeText(payload.price_description || payload.priceDescription);
	const is_premium = normalizeBoolean(payload.is_premium ?? payload.isPremium);
	const phone = normalizePhone(payload.phone);
	const dateInput = {};
	if (payload.event_dates !== undefined || payload.eventDates !== undefined) dateInput.event_dates = payload.event_dates ?? payload.eventDates;
	if (payload.schedule !== undefined || payload.event_schedule !== undefined || payload.eventSchedule !== undefined)
		dateInput.schedule = payload.schedule ?? payload.event_schedule ?? payload.eventSchedule;
	if (payload.dateRange !== undefined || payload.date_range !== undefined) dateInput.dateRange = payload.dateRange ?? payload.date_range;
	if (payload.dateDisplayMode !== undefined || payload.date_display_mode !== undefined)
		dateInput.dateDisplayMode = payload.dateDisplayMode ?? payload.date_display_mode;
	if (payload.isPermanent !== undefined || payload.is_permanent !== undefined)
		dateInput.isPermanent = payload.isPermanent ?? payload.is_permanent;

	const dateFields = normalizeEventDateUpdate(dateInput);
	const event_dates = dateFields.event_dates || normalizeDateArray(payload.event_dates ?? payload.eventDates);
	const event_image_url = normalizeText(payload.event_image_url || payload.eventImageUrl || payload.imageUrl);
	const categoryInput = normalizeText(payload.category);

	return {
		parserSource,
		sourceUrl,
		externalId,
		title,
		description,
		address,
		coordinates,
		price,
		price_description,
		is_premium,
		phone,
		event_dates,
		...dateFields,
		event_image_url,
		category: categoryInput ? Event.resolveCategory(categoryInput, { returnDefault: true }) : undefined,
		version: normalizeText(payload.version),
	};
};

const buildMutableFields = (parsed) => {
	const result = {};

	for (const field of [...DEFAULT_PARSE_POLICY.auto, ...DEFAULT_PARSE_POLICY.review]) {
		if (hasOwn(parsed, field) && parsed[field] !== undefined) result[field] = parsed[field];
	}

	return result;
};

const buildEventKey = (parsed) => parsed.externalId || parsed.sourceUrl || parsed.title || "unknown";

const findExistingEvent = async (parsed) => {
	if (parsed.externalId && parsed.parserSource) {
		const byExternalId = await Event.findOne({
			"parserMeta.source": parsed.parserSource,
			"parserMeta.externalId": parsed.externalId,
		});
		if (byExternalId) return byExternalId;
	}

	if (parsed.sourceUrl) {
		const bySourceUrl = await Event.findOne({ source: parsed.sourceUrl });
		if (bySourceUrl) return bySourceUrl;
	}

	if (parsed.title) {
		const byTitle = await Event.findOne({ title: parsed.title, status: { $ne: "deleted" } });
		if (byTitle) return byTitle;
	}

	return null;
};

const updateParseTracking = (event, parsed, { runId, auto = {}, review = {} } = {}) => {
	const now = new Date();
	const parserSource = parsed.parserSource || event.parserMeta?.source || "parser";

	if (parsed.sourceUrl) event.source = parsed.sourceUrl;

	event.parseFields = event.parseFields || {};
	if (!Array.isArray(event.parseFields.auto) || !event.parseFields.auto.length) event.parseFields.auto = [...DEFAULT_PARSE_POLICY.auto];
	if (!Array.isArray(event.parseFields.review) || !event.parseFields.review.length)
		event.parseFields.review = [...DEFAULT_PARSE_POLICY.review];

	event.parserMeta = {
		...(event.parserMeta?.toObject ? event.parserMeta.toObject() : event.parserMeta || {}),
		source: parserSource,
		externalId: parsed.externalId ?? event.parserMeta?.externalId ?? null,
		version: parsed.version ?? event.parserMeta?.version ?? null,
		lastParsedAt: now,
		lastRunId: runId || null,
	};

	event.parseInfo = {
		...(event.parseInfo || {}),
		[parserSource]: {
			...((event.parseInfo || {})[parserSource] || {}),
			parsedAt: now,
			sourceUrl: parsed.sourceUrl ?? event.source ?? null,
			externalId: parsed.externalId ?? null,
			version: parsed.version ?? null,
			auto,
			review,
			runId: runId || null,
		},
	};
};

const createParsedEvent = async ({ parsed, run }) => {
	if (!parsed.title || !parsed.address) throw new Error("Parsed event requires title and address");

	const parserUserId = resolveParserUserId(run);
	const runId = run?._id || null;

	const event = await Event.create({
		title: parsed.title,
		description: parsed.description,
		event_dates: parsed.event_dates || [],
		schedule: parsed.schedule,
		dateRange: parsed.dateRange,
		dateDisplayMode: parsed.dateDisplayMode,
		isPermanent: parsed.isPermanent,
		address: parsed.address,
		coordinates: parsed.coordinates,
		category: parsed.category || "Другое",
		price: parsed.price,
		price_description: parsed.price_description,
		is_premium: parsed.is_premium ?? false,
		phone: parsed.phone,
		source: parsed.sourceUrl,
		status: "parsed",
		createdBy: parserUserId,
		updatedBy: parserUserId,
		parseFields: {
			auto: [...DEFAULT_PARSE_POLICY.auto],
			review: [...DEFAULT_PARSE_POLICY.review],
		},
		moderation: {
			required: true,
			queue: "parser",
			state: "pending",
			reason: "parser_new_event",
			source: parsed.parserSource,
			runId,
			diff: {},
			lastReviewedAt: null,
		},
	});

	updateParseTracking(event, parsed, { runId, auto: {}, review: {} });
	await event.save();

	const warnings = [];

	if (parsed.event_image_url) {
		try {
			const file = await downloadImageToMemory(parsed.event_image_url);
			await uploadImages(event, [file], parserUserId);
		} catch (error) {
			warnings.push(`Image upload skipped: ${error.message}`);
		}
	}

	return {
		result: "created",
		event,
		key: buildEventKey(parsed),
		warnings,
	};
};

const updateExistingEvent = async ({ event, parsed, run }) => {
	if (event.status === "ignored" || event.status === "deleted") {
		return {
			result: "ignored",
			event,
			key: buildEventKey(parsed),
			warnings: [],
		};
	}

	if (run?.skipExisting) {
		return {
			result: "skipped_existing",
			event,
			key: buildEventKey(parsed),
			warnings: [],
		};
	}

	const parserUserId = resolveParserUserId(run);
	const runId = run?._id || null;
	const policy = getParsePolicy(event);
	const parsedFields = buildMutableFields(parsed);
	const auto = {};
	const review = {};

	for (const field of policy.auto) {
		if (!hasOwn(parsedFields, field) || isEqual(event[field], parsedFields[field])) continue;
		auto[field] = parsedFields[field];
	}

	for (const field of policy.review) {
		if (!hasOwn(parsedFields, field) || isEqual(event[field], parsedFields[field])) continue;

		review[field] = {
			current: event[field],
			parsed: parsedFields[field],
		};
	}

	if (Object.keys(auto).length) Object.assign(event, auto);

	event.updatedBy = parserUserId;
	updateParseTracking(event, parsed, { runId, auto, review });

	if (Object.keys(review).length) {
		event.moderation = {
			required: true,
			queue: "parser",
			state: "pending",
			reason: "parser_diff",
			source: parsed.parserSource,
			runId,
			diff: review,
			lastReviewedAt: null,
		};
	} else if (event.status !== "parsed" && event.moderation?.queue === "parser") {
		clearParserModeration(event, parserUserId);
	}

	await event.save();

	return {
		result: Object.keys(review).length ? "updated_review" : Object.keys(auto).length ? "updated_auto" : "unchanged",
		event,
		key: buildEventKey(parsed),
		warnings: [],
	};
};

const upsertParsedEvent = async ({ payload, run = null } = {}) => {
	const parsed = normalizeParsedEventPayload(payload, run?.source);

	if (!parsed.parserSource) throw new Error("Parser source is required");
	if (!parsed.title && !parsed.externalId && !parsed.sourceUrl) throw new Error("Parsed event identity is required");

	const existingEvent = await findExistingEvent(parsed);
	if (!existingEvent) return createParsedEvent({ parsed, run });

	return updateExistingEvent({ event: existingEvent, parsed, run });
};

const ingestParsedEvents = async ({ run, events }) => {
	const results = [];
	const statsDelta = {
		created: 0,
		updated_review: 0,
		updated_auto: 0,
		unchanged: 0,
		ignored: 0,
		skipped_existing: 0,
		failed: 0,
	};

	for (const payload of events) {
		try {
			const outcome = await upsertParsedEvent({ payload, run });
			statsDelta[outcome.result] = (statsDelta[outcome.result] || 0) + 1;
			results.push({
				key: outcome.key,
				result: outcome.result,
				eventId: outcome.event?._id || null,
				warnings: outcome.warnings,
			});
		} catch (error) {
			statsDelta.failed += 1;
			results.push({
				key: buildEventKey(normalizeParsedEventPayload(payload, run?.source)),
				result: "failed",
				error: error.message,
			});
		}
	}

	return {
		results,
		statsDelta,
	};
};

module.exports = {
	ingestParsedEvents,
	upsertParsedEvent,
};
