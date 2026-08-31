const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const {
	USER_DELETION_GRACE_MS,
	resolveProtectedUserRole,
} = require("../services/userDeletionService");

const migrateDeletedUsers = async () => {
	await connectDB();

	try {
		const users = await User.find({ role: "deleted" });
		let updatedCount = 0;

		for (const user of users) {
			const deletedAt = user.deletedAt || user.updatedAt || user.createdAt || new Date();
			const deleteAfter = user.deleteAfter || new Date(new Date(deletedAt).getTime() + USER_DELETION_GRACE_MS);
			const previousRole = user.previousRole || resolveProtectedUserRole(user);

			let hasChanges = false;

			if (!user.deletedAt) {
				user.deletedAt = deletedAt;
				hasChanges = true;
			}

			if (!user.deleteAfter) {
				user.deleteAfter = deleteAfter;
				hasChanges = true;
			}

			if (!user.previousRole) {
				user.previousRole = previousRole;
				hasChanges = true;
			}

			if (hasChanges) {
				await user.save();
				updatedCount += 1;
			}
		}

		console.log(`Migrated deleted users: ${updatedCount}`);
	} finally {
		await mongoose.disconnect();
	}
};

migrateDeletedUsers().catch((error) => {
	console.error("Failed to migrate deleted users:", error);
	process.exit(1);
});
