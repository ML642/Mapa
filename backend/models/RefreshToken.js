// models/RefreshToken.js
const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const refreshTokenSchema = new mongoose.Schema({
	token: { type: String, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

	isRevoked: { type: Boolean, default: false },
	revokedAt: { type: Date },

	userAgent: { type: String },

	createdAt: { type: Date, default: Date.now },
	expiresAt: { type: Date, required: true },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
