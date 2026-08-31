const ApiError = require("../utils/ApiError");

const FINAL_RUN_STATUSES = new Set(["success", "failed", "cancelled"]);
const ALLOWED_LOG_LEVELS = new Set(["info", "warn", "error"]);
const RUN_LOG_LIMIT = 50;
const PROGRESS_NUMBER_FIELDS = ["total", "completed", "percentage", "discovered", "skippedExisting"];
const PROGRESS_TEXT_FIELDS = ["current", "currentCategory", "phase"];
const STATS_FIELDS = ["created", "updated_review", "updated_auto", "unchanged", "ignored", "skipped_existing", "failed"];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toFiniteNumber = (value) => {
	if (value === undefined || value === null || value === "") return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLogEntries = (input, fallbackLevel = "info") => {
	const values = Array.isArray(input) ? input : input === undefined || input === null ? [] : [input];

	return values.flatMap((entry) => {
		if (typeof entry === "string") {
			const message = entry.trim();
			return message ? [{ level: fallbackLevel, message }] : [];
		}

		if (!entry || typeof entry !== "object") return [];

		const message = String(entry.message || "").trim();
		if (!message) return [];

		const level = ALLOWED_LOG_LEVELS.has(entry.level) ? entry.level : fallbackLevel;
		const at = entry.at ? new Date(entry.at) : new Date();

		return [
			{
				level,
				message,
				at: Number.isNaN(at.getTime()) ? new Date() : at,
			},
		];
	});
};

const appendRunLogs = (run, input, fallbackLevel = "info") => {
	const entries = normalizeLogEntries(input, fallbackLevel);
	if (!entries.length) return run.logs;

	run.logs = [...(Array.isArray(run.logs) ? run.logs : []), ...entries].slice(-RUN_LOG_LIMIT);
	return run.logs;
};

const isRunFinal = (run) => FINAL_RUN_STATUSES.has(run?.status);

const assertRunIsMutable = (run) => {
	if (!run) throw ApiError.NotFound("Parser run not found");
	if (isRunFinal(run)) throw ApiError.BadRequest(`Parser run is already ${run.status}`);
};

const markRunStarted = (run, { phase = null } = {}) => {
	assertRunIsMutable(run);
	run.progress = run.progress || {};

	if (run.status === "queued") {
		run.status = "running";
		run.startedAt = run.startedAt || new Date();
	}

	if (typeof phase === "string" && phase.trim()) run.progress.phase = phase.trim();
};

const mergeRunProgress = (
	run,
	progressPatch = {},
	{ completedIncrement = 0, discoveredIncrement = 0, skippedExistingIncrement = 0 } = {}
) => {
	run.progress = run.progress || {};

	for (const field of PROGRESS_NUMBER_FIELDS) {
		if (!hasOwn(progressPatch, field)) continue;

		const value = toFiniteNumber(progressPatch[field]);
		if (value !== null) run.progress[field] = value;
	}

	for (const field of PROGRESS_TEXT_FIELDS) {
		if (!hasOwn(progressPatch, field) || typeof progressPatch[field] !== "string") continue;

		run.progress[field] = progressPatch[field].trim();
	}

	if (!hasOwn(progressPatch, "completed")) {
		const increment = toFiniteNumber(completedIncrement);
		if (increment) run.progress.completed = (Number(run.progress.completed) || 0) + increment;
	}

	if (!hasOwn(progressPatch, "discovered")) {
		const increment = toFiniteNumber(discoveredIncrement);
		if (increment) run.progress.discovered = (Number(run.progress.discovered) || 0) + increment;
	}

	if (!hasOwn(progressPatch, "skippedExisting")) {
		const increment = toFiniteNumber(skippedExistingIncrement);
		if (increment) run.progress.skippedExisting = (Number(run.progress.skippedExisting) || 0) + increment;
	}

	const total = Number(run.progress.total) || 0;
	const completed = Number(run.progress.completed) || 0;

	if (!hasOwn(progressPatch, "percentage") && total > 0) {
		run.progress.percentage = Math.max(0, Math.min(100, Number(((completed / total) * 100).toFixed(2))));
	}
};

const mergeRunStats = (run, statsDelta = {}) => {
	run.stats = run.stats || {};

	for (const field of STATS_FIELDS) {
		if (!hasOwn(statsDelta, field)) continue;

		const increment = toFiniteNumber(statsDelta[field]);
		if (increment === null) continue;

		run.stats[field] = (Number(run.stats[field]) || 0) + increment;
	}
};

const finalizeRun = (run, { status, error } = {}) => {
	const resolvedStatus = ["success", "failed", "cancelled"].includes(status) ? status : "success";

	run.status = resolvedStatus;
	run.finishedAt = new Date();
	run.cancelRequested = false;

	if (resolvedStatus === "failed") {
		const errorMessage = typeof error === "string" ? error : error?.message;
		const errorStack = typeof error === "object" ? error?.stack : "";

		run.error = {
			message: errorMessage || "Parser worker reported a failure",
			stack: errorStack || "",
		};

		return;
	}

	run.error = {
		message: "",
		stack: "",
	};
};

module.exports = {
	appendRunLogs,
	assertRunIsMutable,
	finalizeRun,
	isRunFinal,
	markRunStarted,
	mergeRunProgress,
	mergeRunStats,
};
