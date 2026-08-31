// cron/deleteUser.js
const cron = require("node-cron");
const User = require("../models/User");
const { finalizeDeletedUser, USER_DELETION_GRACE_MS } = require("../services/userDeletionService");
const DEBUG = process.env.DEBUG === "true";

cron.schedule("0 0 * * *", async () => {
	const now = new Date();
	const legacyDeleteBefore = new Date(now.getTime() - USER_DELETION_GRACE_MS);

	try {
		const users = await User.find({
			role: "deleted",
			$or: [
				{ deleteAfter: { $lte: now } },
				{ deleteAfter: null, updatedAt: { $lte: legacyDeleteBefore } },
			],
		});

		if (users.length === 0) {
			if (DEBUG) console.log("[CRON] Not old users to delete");
			return;
		}

		for (const user of users) {
			try {
				await finalizeDeletedUser(user);
			} catch (err) {
				console.error("[CRON] Error deleting user:", user._id, err);
			}
		}

		if (DEBUG) console.log(`[CRON] Deleted ${users.length} users`);
	} catch (err) {
		console.error("[CRON] Error deleting users:", err);
	}
});
