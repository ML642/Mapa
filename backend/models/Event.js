// models/Event.js
const mongoose = require("mongoose");
const { DATE_DISPLAY_MODES, normalizeEventDocumentDates } = require("../services/eventScheduleService");

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6658f2c8c9c6f3b71e9a1234
 *         title:
 *           type: string
 *           example: Rock concert
 *         description:
 *           type: string
 *           example: Live music concert
 *         event_date:
 *           type: string
 *           format: date-time
 *         date_display:
 *           type: string
 *           example: 02.07.2026 – 15.08.2026
 *         dateDisplayMode:
 *           type: string
 *           enum: [sessions, range, permanent]
 *         isPermanent:
 *           type: boolean
 *         dateRange:
 *           type: object
 *           nullable: true
 *           properties:
 *             from:
 *               type: string
 *               format: date-time
 *             to:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         schedule:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               times:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["10:00", "14:30", "19:00"]
 *         address:
 *           type: string
 *           example: Minsk, Independence ave 10
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *           example: [53.9, 27.5667]
 *         category:
 *           type: string
 *         event_image:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *           nullable: true
 *           example: 20
 *         price_description:
 *           type: string
 *           example: Free entrance
 *         is_premium:
 *           type: boolean
 *           example: false
 *         phone:
 *           type: string
 *           example: +375291234567
 *
 *     EventAdmin:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Event'
 *         - type: object
 *           properties:
 *             event_dates:
 *               type: array
 *               items:
 *                 type: string
 *                 format: date-time
 *             source:
 *               type: string
 *             status:
 *               type: string
 *               enum: [active, parsed, inactive, ignored, deleted]
 *             createdBy:
 *               type: string
 *             updatedBy:
 *               type: string
 */

const allowedToUpdateFields = [
	"title",
	"description",
	"event_dates",
	"schedule",
	"event_schedule",
	"dateRange",
	"date_range",
	"dateDisplayMode",
	"date_display_mode",
	"dateMode",
	"dateFrom",
	"dateTo",
	"date_from",
	"date_to",
	"dateRangeFrom",
	"dateRangeTo",
	"isPermanent",
	"is_permanent",
	"date",
	"day",
	"times",
	"startTimes",
	"sessionTimes",
	"slots",
	"sessions",
	"sessionList",
	"sessionItems",
	"address",
	"coordinates",
	"category",
	"weights",
	"is_premium",
	"price",
	"price_description",
	"phone",
	"source",
	"status",
]; //weights?

const visibleFields = [
	"_id",
	"title",
	"description",
	"event_date",
	"date_display",
	"date_summary",
	"dateDisplayMode",
	"isPermanent",
	"dateRange",
	"schedule",
	"address",
	"coordinates",
	"category",
	"event_image",
	"price",
	"price_description",
	"is_premium",
	"phone",
	"source",
];

const visibleFieldsAdmin = [
	"_id",
	"title",
	"description",
	"event_date",
	"event_dates",
	"date_display",
	"date_summary",
	"dateDisplayMode",
	"isPermanent",
	"dateRange",
	"schedule",
	"address",
	"coordinates",
	"category",
	"event_image",
	"price",
	"price_description",
	"is_premium",
	"phone",
	"source",
	"status",
	"createdBy",
	"updatedBy",
	"moderation",
	"parseInfo",
	"parserMeta",
];

const categoryMap = {
	Выставка: ["Выставки"],
	Концерт: ["Концерты"],
	Спектакль: ["Спектакли, Театр"],
	Фестиваль: ["Фестивали"],
	Музей: ["Музеи"],
	Кино: [],
	Спорт: [],
	Образование: [],
	Вечеринка: ["Вечеринки"],
	Экскурсия: ["Экскурсии"],
	Знакомства: [],
	Квест: ["Квесты"],
	"Для детей": [],
	Шоу: [],
	Квиз: ["Квизы"],
	Другое: [],
};

const expandCategoryTerms = (terms) =>
	terms.flatMap((term) =>
		Array.from(
			new Set(
				term
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean)
					.concat(term)
			)
		)
	);

const eventSessionSchema = new mongoose.Schema(
	{
		startsAt: { type: Date, required: true },
		time: { type: String, required: true },
	},
	{ _id: false }
);

const eventScheduleDaySchema = new mongoose.Schema(
	{
		date: { type: Date, required: true },
		times: { type: [String], default: [] },
		sessions: { type: [eventSessionSchema], default: [] },
	},
	{ _id: false }
);

const eventDateRangeSchema = new mongoose.Schema(
	{
		from: { type: Date, default: null },
		to: { type: Date, default: null },
	},
	{ _id: false }
);

const eventDateSummarySchema = new mongoose.Schema(
	{
		mode: { type: String, enum: DATE_DISPLAY_MODES, default: "sessions" },
		startsAt: { type: Date, default: null },
		endsAt: { type: Date, default: null },
		isPermanent: { type: Boolean, default: false },
		sessionsCount: { type: Number, default: 0 },
	},
	{ _id: false }
);

const eventSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, set: (v) => v.trim() },
		description: { type: String },
		event_dates: { type: [Date], default: [] },
		schedule: { type: [eventScheduleDaySchema], default: [] },
		dateRange: { type: eventDateRangeSchema, default: () => ({ from: null, to: null }) },
		dateDisplayMode: { type: String, enum: DATE_DISPLAY_MODES, default: "sessions" },
		isPermanent: { type: Boolean, default: false },
		date_display: { type: String, default: "" },
		date_summary: { type: eventDateSummarySchema, default: () => ({}) },
		address: { type: String, required: true },

		coordinates: {
			type: [Number],
			index: "2dsphere",
			default: [0, 0],
			validate: {
				validator: function (v) {
					return v.length === 2;
				},
				message: (props) => `${props.value} is not a valid [latitude, longitude] coordinate pair!`,
			},
		},

		category: {
			type: String,
			enum: Object.keys(categoryMap),
			default: "Другое",
		},

		weights: { type: Object, default: { Другое: 1.0 } },
		weights_version: { type: Number, default: 1 },

		event_image: { type: [String], default: [] },
		price: { type: Number, default: null },
		price_description: { type: String },
		is_premium: { type: Boolean, default: false },

		phone: { type: String },
		source: { type: String },

		parseFields: { type: Object, default: {} },
		parseInfo: { type: Object, default: {} },
		parserMeta: {
			source: { type: String, default: null },
			externalId: { type: String, default: null },
			version: { type: String, default: null },
			lastParsedAt: { type: Date, default: null },
			lastRunId: { type: mongoose.Schema.Types.ObjectId, ref: "ParserRun", default: null },
		},

		moderation: {
			required: { type: Boolean, default: false },
			queue: { type: String, default: null },
			state: { type: String, default: null },
			reason: { type: String, default: null },
			source: { type: String, default: null },
			runId: { type: mongoose.Schema.Types.ObjectId, ref: "ParserRun", default: null },
			diff: { type: Object, default: {} },
			lastReviewedAt: { type: Date, default: null },
		},

		status: {
			type: String,
			enum: ["active", "parsed", "inactive", "ignored", "deleted"],
			default: "inactive",
		},

		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
	},
	{
		timestamps: true,
		id: false,
		toJSON: { virtuals: true },
		toObject: {
			virtuals: true,
		},
	}
);

const resolveCategory = (input, { strict = false, returnDefault = false } = {}) => {
	if (typeof input !== "string") return returnDefault ? "Другое" : null;

	const normalized = input.trim().toLowerCase();

	for (const [category, synonyms] of Object.entries(categoryMap)) {
		if (
			category.toLowerCase() === normalized ||
			(!strict && expandCategoryTerms(synonyms).map((term) => term.toLowerCase()).includes(normalized))
		)
			return category;
	}

	return returnDefault ? "Другое" : null;
};

const categorySearchTerms = Object.entries(categoryMap)
	.flatMap(([category, synonyms]) => [{ category, term: category }, ...expandCategoryTerms(synonyms).map((term) => ({ category, term }))])
	.sort((left, right) => right.term.length - left.term.length);

eventSchema.pre("validate", function (next) {
	try {
		normalizeEventDocumentDates(this);
		next();
	} catch (error) {
		next(error);
	}
});

eventSchema.index({ status: 1, event_dates: 1 });
eventSchema.index({ status: 1, category: 1, event_dates: 1 });
eventSchema.index({ status: 1, "date_summary.startsAt": 1 });
eventSchema.index({ status: 1, "dateRange.from": 1, "dateRange.to": 1 });
eventSchema.index({ "parserMeta.source": 1, "parserMeta.externalId": 1 });
eventSchema.index({ source: 1 });
eventSchema.index(
	{ title: "text", description: "text", address: "text", category: "text" },
	{
		name: "event_search_text_idx",
		default_language: "russian",
		weights: {
			title: 10,
			category: 6,
			address: 4,
			description: 2,
		},
	}
);

eventSchema.statics.allowedToUpdateFields = allowedToUpdateFields;
eventSchema.statics.visibleFields = visibleFields;
eventSchema.statics.visibleFieldsAdmin = visibleFieldsAdmin;
eventSchema.statics.resolveCategory = resolveCategory;
eventSchema.statics.categorySearchTerms = categorySearchTerms;

module.exports = mongoose.model("Event", eventSchema);
