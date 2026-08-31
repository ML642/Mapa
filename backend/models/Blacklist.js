// models/Blacklist.js
const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	reason: { type: String, default: "Добавлен по решению администрации" },
	date: { type: Date, default: Date.now },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Blacklist", blacklistSchema);
