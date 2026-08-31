const mongoose = require("mongoose");

const parserStatsSchema = new mongoose.Schema(
	{
		created: { type: Number, default: 0 },
		updated_review: { type: Number, default: 0 },
		updated_auto: { type: Number, default: 0 },
		unchanged: { type: Number, default: 0 },
		ignored: { type: Number, default: 0 },
		skipped_existing: { type: Number, default: 0 },
		failed: { type: Number, default: 0 },
	},
	{ _id: false }
);

const parserProgressSchema = new mongoose.Schema(
	{
		total: { type: Number, default: 0 },
		completed: { type: Number, default: 0 },
		current: { type: String, default: "" },
		currentCategory: { type: String, default: "" },
		percentage: { type: Number, default: 0 },
		phase: { type: String, default: "" },
		discovered: { type: Number, default: 0 },
		skippedExisting: { type: Number, default: 0 },
	},
	{ _id: false }
);

const parserLogSchema = new mongoose.Schema(
	{
		at: { type: Date, default: Date.now },
		level: { type: String, enum: ["info", "warn", "error"], default: "info" },
		message: { type: String, required: true },
	},
	{ _id: false }
);

const parserRunSchema = new mongoose.Schema(
	{
		source: {
			type: String,
			enum: ["relax"],
			required: true,
		},
		mode: {
			type: String,
			enum: ["full", "category"],
			required: true,
		},
		category: { type: String, default: null },
		categories: { type: [String], default: [] },
		limit: { type: Number, default: null },
		skipExisting: { type: Boolean, default: true },
		status: {
			type: String,
			enum: ["queued", "running", "success", "failed", "cancelled"],
			default: "queued",
			index: true,
		},
		requestedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		cancelRequested: { type: Boolean, default: false },
		startedAt: { type: Date, default: null },
		finishedAt: { type: Date, default: null },
		progress: {
			type: parserProgressSchema,
			default: () => ({}),
		},
		stats: {
			type: parserStatsSchema,
			default: () => ({}),
		},
		error: {
			message: { type: String, default: "" },
			stack: { type: String, default: "" },
		},
		logs: {
			type: [parserLogSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

parserRunSchema.index({ createdAt: -1 });
parserRunSchema.index({ source: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ParserRun", parserRunSchema);
