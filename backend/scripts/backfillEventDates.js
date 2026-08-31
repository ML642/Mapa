const mongoose = require("mongoose");
const { normalizeEventDocumentDates } = require("../services/eventScheduleService");

const DEFAULT_BATCH_SIZE = 100;
const DATE_STATE_FIELDS = Object.freeze([
	"event_dates",
	"schedule",
	"dateRange",
	"dateDisplayMode",
	"isPermanent",
	"date_display",
	"date_summary",
]);

const parsePositiveInteger = (value, fallback) => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseArgs = (args = process.argv.slice(2)) => {
	const options = {
		batchSize: DEFAULT_BATCH_SIZE,
		dryRun: false,
		limit: null,
	};

	for (const arg of args) {
		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}

		if (arg.startsWith("--batch-size=")) {
			options.batchSize = parsePositiveInteger(arg.split("=")[1], DEFAULT_BATCH_SIZE);
			continue;
		}

		if (arg.startsWith("--limit=")) {
			options.limit = parsePositiveInteger(arg.split("=")[1], null);
		}
	}

	return options;
};

const getDocumentDateState = (document) => {
	const plain = typeof document.toObject === "function"
		? document.toObject({ depopulate: true, versionKey: false })
		: document;

	return DATE_STATE_FIELDS.reduce((state, field) => {
		state[field] = plain[field] ?? null;
		return state;
	}, {});
};

const serializeDateState = (document) => JSON.stringify(getDocumentDateState(document));

const normalizeEventForDateBackfill = (event) => {
	const before = serializeDateState(event);
	normalizeEventDocumentDates(event);
	const after = serializeDateState(event);

	return {
		changed: before !== after,
		before,
		after,
	};
};

const backfillEventDates = async ({ EventModel, batchSize = DEFAULT_BATCH_SIZE, dryRun = false, limit = null, logger = console } = {}) => {
	if (!EventModel) throw new Error("EventModel is required");

	const stats = {
		scanned: 0,
		changed: 0,
		saved: 0,
		dryRun,
	};

	const query = EventModel.find({}).sort({ _id: 1 });
	if (limit) query.limit(limit);

	const cursor = query.cursor({ batchSize });

	for await (const event of cursor) {
		stats.scanned += 1;

		const result = normalizeEventForDateBackfill(event);
		if (!result.changed) continue;

		stats.changed += 1;
		if (!dryRun) {
			await event.save({ timestamps: false });
			stats.saved += 1;
		}

		if (stats.changed % 500 === 0) {
			logger.log(`Backfilled event date fields: ${stats.changed} changed / ${stats.scanned} scanned`);
		}
	}

	return stats;
};

const runCli = async () => {
	const connectDB = require("../config/db");
	const Event = require("../models/Event");
	const options = parseArgs();

	await connectDB();

	try {
		const stats = await backfillEventDates({ EventModel: Event, ...options });
		console.log(
			`Event date backfill completed: ${stats.changed} changed, ${stats.saved} saved, ${stats.scanned} scanned${stats.dryRun ? " (dry run)" : ""}`
		);
	} finally {
		await mongoose.disconnect();
	}
};

if (require.main === module) {
	runCli().catch((error) => {
		console.error("Failed to backfill event dates:", error);
		process.exit(1);
	});
}

module.exports = {
	backfillEventDates,
	normalizeEventForDateBackfill,
	parseArgs,
};
