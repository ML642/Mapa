const ParserRun = require("../models/ParserRun");
const { enqueueParserRun } = require("./parserQueue");
const { RELAX_CATEGORIES } = require("./parserSources");

/**
 */
const normalizeLimit = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(1, Math.min(10_000, Math.floor(parsed)));
};

const normalizeBoolean = (value, fallback = true) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["false", "0", "no", "off"].includes(normalized)) return false;
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
    }
    return fallback;
};

const normalizeCategories = (value, fallbackCategory) => {
    const raw = Array.isArray(value)
        ? value
        : fallbackCategory
            ? [fallbackCategory]
            : [];
    return [...new Set(raw.map((item) => String(item || "").trim()).filter(Boolean))];
};
/**
 */
const createParserRun = async ({ source = "relax", category, categories, limit, skipExisting, userId }) => {
    if (source !== "relax") throw new Error("UNSUPPORTED_SOURCE");

    const normalizedLimit = normalizeLimit(limit);
    const normalizedSkipExisting = normalizeBoolean(skipExisting, true);
    const normalizedCategories = normalizeCategories(categories, category);
    
    const invalidCategories = normalizedCategories.filter((item) => !RELAX_CATEGORIES.includes(item));
    if (invalidCategories.length) {
        const err = new Error("INVALID_CATEGORIES");
        err.details = invalidCategories.join(", ");
        throw err;
    }

    const resolvedMode = normalizedCategories.length ? "category" : "full";
    const primaryCategory = (resolvedMode === "category" && normalizedCategories.length === 1) 
        ? normalizedCategories[0] 
        : null;

    const activeRun = await ParserRun.findOne({
        source,
        status: { $in: ["queued", "running"] },
    }).sort({ createdAt: -1 });

    if (activeRun) {
        const err = new Error("RUN_ALREADY_IN_PROGRESS");
        err.activeRun = activeRun;
        throw err;
    }

    const run = await ParserRun.create({
        source,
        mode: resolvedMode,
        category: primaryCategory,
        categories: normalizedCategories,
        limit: normalizedLimit,
        skipExisting: normalizedSkipExisting,
        requestedBy: userId,
        logs: [
            {
                level: "info",
                message: resolvedMode === "category"
                    ? `Run queued for ${source}/${normalizedCategories.join(", ")} (skipExisting=${normalizedSkipExisting})`
                    : `Run queued for ${source}/all (skipExisting=${normalizedSkipExisting})`,
            },
        ],
    });

    await enqueueParserRun(run);

    return run;
};

/**
 */
const getParserRuns = async ({ source, limit = 12 }) => {
    const normalizedLimit = Math.max(1, Math.min(50, Number(limit) || 12));
    const filter = {};
    if (source) filter.source = source;

    return ParserRun.find(filter)
        .sort({ createdAt: -1 })
        .limit(normalizedLimit);
};

/**
 */
const getParserRunById = async (runId) => {
    const run = await ParserRun.findById(runId);
    if (!run) throw new Error("RUN_NOT_FOUND");
    return run;
};

/**
 */
const cancelParserRun = async (runId) => {
    const run = await ParserRun.findById(runId);
    if (!run) throw new Error("RUN_NOT_FOUND");

    if (!["queued", "running"].includes(run.status)) {
        throw new Error("CANNOT_CANCEL_FINISHED_RUN");
    }

    run.cancelRequested = true;
    run.logs.push({
        level: "warn",
        message: "Cancellation requested by moderator",
    });
    
    if (run.logs.length > 50) {
        run.logs = run.logs.slice(-50);
    }

    return run.save();
};

module.exports = {
    createParserRun,
    getParserRuns,
    getParserRunById,
    cancelParserRun
};
