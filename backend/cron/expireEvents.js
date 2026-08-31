// cron/expireEvents.js
const cron = require("node-cron");
const Event = require("../models/Event");
const path = require("path");
const fs = require("fs").promises;
const { UPLOADS_DIR } = require("../config/paths");
const DEBUG = process.env.DEBUG === "true";

const EVENTS_DIR = path.join(UPLOADS_DIR, "events");

const getEventFoldersForCleanup = (event) => {
	const eventId = event._id.toString();
	const eventFolders = [path.resolve(EVENTS_DIR, eventId)];

	if (event.createdBy) {
		eventFolders.push(path.resolve(UPLOADS_DIR, "users", event.createdBy.toString(), "events", eventId));
	}

	return eventFolders;
};

cron.schedule("0 */6 * * *", async () => {
	const now = new Date();
	const twelvehoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

	try {
		const events = await Event.find({ status: { $ne: "deleted" } });

		let updatedCount = 0;
		for (const event of events) {
			if (event.isPermanent || event.dateDisplayMode === "permanent") continue;

			if (event.dateRange?.from) {
				if (!event.dateRange.to || event.dateRange.to > twelvehoursAgo) continue;
				event.status = "deleted";
				await event.save();
				updatedCount++;
				continue;
			}

			const futureDates = event.event_dates.filter((d) => d > twelvehoursAgo);
			if (!futureDates.length) {
				event.status = "deleted";
				await event.save();
				updatedCount++;
			}
		}

		if (DEBUG) console.log(`[CRON] Обновлено событий: ${updatedCount}`);
	} catch (err) {
		console.error("[CRON] Ошибка при обновлении событий:", err);
	}
});

cron.schedule("0 0 * * *", async () => {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	try {
		const events = await Event.find({
			updatedAt: { $lt: thirtyDaysAgo },
			status: "deleted",
		});

		if (events.length === 0) {
			if (DEBUG) console.log("[CRON] Нет старых событий для удаления");
			return;
		}

		for (const event of events) {
			const eventFolders = getEventFoldersForCleanup(event);

			try {
				for (const eventFolder of eventFolders) {
					await fs.rm(eventFolder, { recursive: true, force: true });
				}
				await event.deleteOne();
			} catch (err) {
				console.error("[CRON] Ошибка при удалении старого события:", event._id, err);
			}
		}

		if (DEBUG) console.log(`[CRON] Удалено старых событий: ${events.length}`);
	} catch (err) {
		console.error("[CRON] Ошибка при удалении старых событий:", err);
	}
});

cron.schedule("0 0 * * *", async () => {
	try {
		const events = await Event.find({}, "_id").lean();
		const eventIds = new Set(events.map((e) => e._id.toString()));
		const dirs = await fs.readdir(EVENTS_DIR, { withFileTypes: true });
		let removedCount = 0;

		for (const dir of dirs) {
			if (!dir.isDirectory()) continue;

			if (!eventIds.has(dir.name)) {
				await fs.rm(path.join(EVENTS_DIR, dir.name), { recursive: true, force: true });
				removedCount++;
			}
		}

		if (DEBUG) console.log(`[CRON] Удалено неправильно удалённых событий: ${removedCount}`);
	} catch (err) {
		console.error("[CRON] Ошибка при удалении старых событий:", err);
	}
});
