const mongoose = require("mongoose");

const eventCommentSchema = new mongoose.Schema(
	{
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Event",
			required: true,
			index: true,
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		body: {
			type: String,
			required: true,
			minlength: 1,
			maxlength: 1000,
			set: (value) => String(value ?? "").replace(/\r\n/g, "\n").trim(),
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

eventCommentSchema.index({ event: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model("EventComment", eventCommentSchema);
