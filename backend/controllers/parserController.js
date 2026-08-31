const ParserService = require("../services/parserService");
const ParserRun = require("../models/ParserRun");
const ApiError = require("../utils/ApiError");
const { getParserQueue } = require("../services/parserQueue");

const CANCELLABLE_QUEUE_STATES = new Set(["waiting", "delayed", "paused", "prioritized"]);

const appendRunLog = (run, level, message) => {
	run.logs = [
		...(Array.isArray(run.logs) ? run.logs : []),
		{
			level,
			message,
		},
	].slice(-50);
};

exports.createParserRun = async (req, res, next) => {
    try {
        const run = await ParserService.createParserRun({
            ...req.body,
            userId: req.userId
        });

        res.status(202).json({
            message: "Parser run queued",
            run,
        });
    } catch (error) {
        next(error);
    }
};

exports.listParserRuns = async (req, res, next) => {
    try {
        const { source, limit } = req.query;
        const runs = await ParserService.getParserRuns({ source, limit });

        res.status(200).json({ runs });
    } catch (error) {
        next(error);
    }
};

exports.getParserRunById = async (req, res, next) => {
    try {
        const run = await ParserService.getParserRunById(req.params.runId);
        res.status(200).json({ run });
    } catch (error) {
        next(error);
    }
};

exports.cancelParserRun = async (req, res, next) => {
	try {
		const run = await ParserRun.findById(req.params.runId);
		if (!run) return res.status(404).json({ message: "Parser run not found" });

		if (!["queued", "running"].includes(run.status))
			return res.status(400).json({ message: "Only queued or running runs can be cancelled" });

		const queue = getParserQueue();
		const job = await queue.getJob(run._id.toString());
		const queueState = job ? await job.getState().catch(() => null) : null;
		const canRemoveQueuedJob = queueState && CANCELLABLE_QUEUE_STATES.has(queueState);

		if (job && canRemoveQueuedJob) {
			await job.remove();
			run.status = "cancelled";
			run.cancelRequested = false;
			run.finishedAt = run.finishedAt || new Date();
			appendRunLog(run, "warn", `Run cancelled before start (queue state: ${queueState})`);
		} else {
			run.cancelRequested = true;

			if (queueState === "active") {
				appendRunLog(run, "warn", "Cancellation requested by moderator while worker is active");
			} else if (job) {
				appendRunLog(run, "warn", `Cancellation requested by moderator (queue state: ${queueState})`);
			} else {
				appendRunLog(run, "warn", "Cancellation requested by moderator (queue job not found)");
			}
		}

		await run.save();

		res.status(200).json({
			message: run.status === "cancelled" ? "Parser run cancelled" : "Cancellation requested",
			run,
		});
	} catch (error) {
		next(ApiError.Internal("Error cancelling parser run", error));
	}
};
