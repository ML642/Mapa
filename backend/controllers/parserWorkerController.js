const ParserRun = require("../models/ParserRun");
const ApiError = require("../utils/ApiError");
const { ingestParsedEvents } = require("../services/parserEventIngestionService");
const {
	appendRunLogs,
	assertRunIsMutable,
	finalizeRun,
	isRunFinal,
	markRunStarted,
	mergeRunProgress,
	mergeRunStats,
} = require("../services/parserRunService");

const serializeWorkerRun = (run) => ({
	_id: run._id,
	source: run.source,
	mode: run.mode,
	category: run.category,
	categories: run.categories,
	limit: run.limit,
	skipExisting: run.skipExisting,
	status: run.status,
	cancelRequested: run.cancelRequested,
	startedAt: run.startedAt,
	finishedAt: run.finishedAt,
	progress: run.progress,
	stats: run.stats,
	error: run.error,
	updatedAt: run.updatedAt,
});

const loadRun = async (runId) => {
	const run = await ParserRun.findById(runId);
	if (!run) throw ApiError.NotFound("Parser run not found");
	return run;
};

const buildStatsSummaryLog = (statsDelta) => {
	const parts = Object.entries(statsDelta)
		.filter(([, value]) => Number(value) > 0)
		.map(([key, value]) => `${key}=${value}`);

	return parts.length ? `Parsed batch persisted: ${parts.join(", ")}` : "Parsed batch persisted with no changes";
};

exports.getWorkerRun = async (req, res, next) => {
	try {
		const run = await loadRun(req.params.runId);
		res.status(200).json({ run: serializeWorkerRun(run) });
	} catch (error) {
		next(ApiError.Internal("Error getting parser worker run", error));
	}
};

exports.heartbeat = async (req, res, next) => {
	try {
		const run = await loadRun(req.params.runId);

		if (!isRunFinal(run)) {
			markRunStarted(run, { phase: req.body?.progress?.phase || "processing" });
			appendRunLogs(run, req.body?.logs ?? req.body?.log);
			mergeRunProgress(run, req.body?.progress || {});
			await run.save();
		}

		res.status(200).json({
			message: isRunFinal(run) ? `Parser run already ${run.status}` : "Parser run updated",
			run: serializeWorkerRun(run),
		});
	} catch (error) {
		next(ApiError.Internal("Error updating parser worker heartbeat", error));
	}
};

exports.ingestEvents = async (req, res, next) => {
	try {
		const { events, progress, log, logs } = req.body ?? {};
		if (!Array.isArray(events) || !events.length) return res.status(400).json({ message: "events array is required" });

		const run = await loadRun(req.params.runId);
		assertRunIsMutable(run);
		markRunStarted(run, { phase: progress?.phase || "persisting" });

		const { results, statsDelta } = await ingestParsedEvents({ run, events });

		appendRunLogs(run, logs ?? log);
		appendRunLogs(run, { level: "info", message: buildStatsSummaryLog(statsDelta) });

		const failedResults = results.filter((item) => item.result === "failed");
		if (failedResults.length) {
			appendRunLogs(
				run,
				failedResults.slice(0, 5).map((item) => ({
					level: "warn",
					message: `Failed to persist parsed event ${item.key}: ${item.error}`,
				}))
			);
		}

		mergeRunStats(run, statsDelta);
		mergeRunProgress(run, progress || {}, {
			completedIncrement: results.length,
			skippedExistingIncrement: statsDelta.skipped_existing,
		});

		await run.save();

		res.status(200).json({
			message: "Parsed events ingested",
			results,
			run: serializeWorkerRun(run),
		});
	} catch (error) {
		next(ApiError.Internal("Error ingesting parsed events", error));
	}
};

exports.completeRun = async (req, res, next) => {
	try {
		const { status, error, progress, log, logs } = req.body ?? {};
		const run = await loadRun(req.params.runId);

		if (!isRunFinal(run)) {
			markRunStarted(run, { phase: progress?.phase || run.progress?.phase || "finalizing" });
			appendRunLogs(run, logs ?? log);
			mergeRunProgress(run, progress || {});
			finalizeRun(run, { status: status || (error ? "failed" : "success"), error });
			await run.save();
		}

		res.status(200).json({
			message: `Parser run ${run.status}`,
			run: serializeWorkerRun(run),
		});
	} catch (error) {
		next(ApiError.Internal("Error finalizing parser run", error));
	}
};
