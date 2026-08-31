const fs = require("fs").promises;
const path = require("path");
const Event = require("../models/Event");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const { addEmailToBlacklist, isBlacklisted } = require("./blacklistService");
const { revokeUserRefreshTokens } = require("./tokenService");
const { UPLOADS_DIR } = require("../config/paths");

const USER_DELETION_GRACE_DAYS = Math.max(1, Number.parseInt(process.env.USER_DELETION_GRACE_DAYS || "7", 10) || 7);
const USER_DELETION_GRACE_MS = USER_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;
const DEFAULT_RESTORED_ROLE = "user";

const toDate = (value) => {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeDeletionReason = (value) => {
	const reason = String(value ?? "").trim();
	if (!reason) return "";
	return reason.slice(0, 240);
};

const isUserDeleted = (user) => user?.role === "deleted";

const resolveProtectedUserRole = (user) => {
	if (!user) return DEFAULT_RESTORED_ROLE;
	if (user.role !== "deleted") return user.role;
	return user.previousRole || DEFAULT_RESTORED_ROLE;
};

const resolveDeletedById = (user) => {
	if (!user?.deletedBy) return "";
	return (user.deletedBy._id || user.deletedBy).toString();
};

const resolveDeleteAfter = (deletedAt) => new Date(deletedAt.getTime() + USER_DELETION_GRACE_MS);

const buildDeletedAccountMessage = (user) => {
	const deleteAfter = toDate(user?.deleteAfter);
	if (deleteAfter) {
		return `This account is scheduled for permanent deletion on ${deleteAfter.toISOString()}. Contact support to restore it.`;
	}

	return "This account has been deleted. Contact support to restore it.";
};

const cleanupDeletedUserRelations = async (userId) => {
	await Promise.all([
		User.updateMany({ friends: userId }, { $pull: { friends: userId } }),
		User.updateMany({ friend_requests: userId }, { $pull: { friend_requests: userId } }),
		Event.updateMany({ updatedBy: userId }, { $set: { updatedBy: null } }),
	]);
};

const deleteUserDraftEvents = async (userId) => {
	const result = await Event.deleteMany({
		createdBy: userId,
		status: "inactive",
	});

	return result.deletedCount || 0;
};

const buildDeletionAuditReason = (user) => {
	const deletedById = resolveDeletedById(user);
	if (deletedById && deletedById === user._id.toString()) {
		return user.deletionReason || "User deleted own account";
	}

	return user.deletionReason || "Account deleted by administrator";
};

const markUserDeleted = async (user, { actorUserId, reason } = {}) => {
	if (!user) throw new Error("User not found");
	if (isUserDeleted(user)) throw new Error("User already marked as deleted");

	const deletedAt = new Date();
	user.previousRole = resolveProtectedUserRole(user);
	user.role = "deleted";
	user.deletedAt = deletedAt;
	user.deleteAfter = resolveDeleteAfter(deletedAt);
	user.deletedBy = actorUserId || null;
	user.deletionReason = normalizeDeletionReason(reason);
	user.friends = [];
	user.friend_requests = [];

	await user.save();
	await revokeUserRefreshTokens(user._id);
	await cleanupDeletedUserRelations(user._id);

	return user;
};

const restoreDeletedUser = async (user) => {
	if (!user) throw new Error("User not found");
	if (!isUserDeleted(user)) throw new Error("User is not marked as deleted");

	user.role = resolveProtectedUserRole(user);
	user.previousRole = null;
	user.deletedAt = null;
	user.deleteAfter = null;
	user.deletedBy = null;
	user.deletionReason = "";

	await user.save();
	return user;
};

const finalizeDeletedUser = async (user) => {
	if (!user) throw new Error("User not found");
	if (!isUserDeleted(user)) throw new Error("User is not marked as deleted");

	await revokeUserRefreshTokens(user._id);
	await cleanupDeletedUserRelations(user._id);
	await deleteUserDraftEvents(user._id);

	if (user.email && !(await isBlacklisted(user.email))) {
		await addEmailToBlacklist(user.email, user.deletedBy || user._id, buildDeletionAuditReason(user));
	}

	const userFolder = path.join(UPLOADS_DIR, "users", user._id.toString());
	await fs.rm(userFolder, { recursive: true, force: true });
	await RefreshToken.deleteMany({ userId: user._id });
	await user.deleteOne();
};

module.exports = {
	USER_DELETION_GRACE_DAYS,
	USER_DELETION_GRACE_MS,
	buildDeletedAccountMessage,
	cleanupDeletedUserRelations,
	finalizeDeletedUser,
	isUserDeleted,
	markUserDeleted,
	resolveProtectedUserRole,
	restoreDeletedUser,
};
