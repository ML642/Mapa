// services/blacklistService.js
const Blacklist = require("../models/Blacklist");

exports.addEmailToBlacklist = async (email, createdBy, reason = null) => {
	if (!email) throw new Error("Email is required");
	if (!createdBy) throw new Error("User ID is required");

	const isBlacklisted = await exports.isBlacklisted(email);
	if (isBlacklisted) throw new Error(`Email is already blacklisted - ${email}`);

	return Blacklist.create({ email, createdBy, reason });
};

exports.isBlacklisted = async (email) => {
	return !!(await Blacklist.exists({ email }));
};

exports.removeFromBlacklist = async (email) => {
	if (!email) return false;
	const result = await Blacklist.deleteOne({ email });
	return result.deletedCount > 0;
};

exports.getBlacklist = async (filter = {}) => {
	return Blacklist.find(filter).sort({ date: -1 });
};
