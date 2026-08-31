// services/tokenService.js
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
	throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not defined in .env");

exports.generateAccessToken = (userId) => {
	return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
};

const generateRefreshToken = (userId, exspireAfterDays = 7) => {
	return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${exspireAfterDays}d` });
};

exports.createRefreshToken = async (userId, userAgent) => {
	const exspireAfterDays = 7;

	const refreshToken = generateRefreshToken(userId, exspireAfterDays);
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + exspireAfterDays);

	await RefreshToken.create({
		token: refreshToken,
		userId,
		expiresAt,
		userAgent,
	});

	return refreshToken;
};

exports.createAccessToken = async (refreshToken, userAgent) => {
	if (!refreshToken) throw new Error("Refresh token required");

	try {
		jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
	} catch (err) {
		throw new Error("Invalid or expired refresh token", { cause: err });
	}

	const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
	if (!tokenDoc) throw new Error("Refresh token not found");

	if (tokenDoc.isRevoked) {
		const revokedAt = tokenDoc.revokedAt?.getTime() ?? 0;
		const isOldRevoke = Date.now() - revokedAt > 5 * 1000;

		if (isOldRevoke) await exports.revokeUserRefreshTokens(tokenDoc.userId);

		throw new Error("Refresh token revoked");
	}

	if (tokenDoc.userAgent !== userAgent) {
		await exports.revokeRefreshToken(refreshToken);
		throw new Error("Device mismatch");
	}

	const newRefreshToken = await exports.createRefreshToken(tokenDoc.userId, userAgent);
	await exports.revokeRefreshToken(refreshToken);

	const accessToken = exports.generateAccessToken(tokenDoc.userId);

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};
};

exports.revokeRefreshToken = async (refreshToken) => {
	return RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true, revokedAt: new Date() });
};

exports.revokeUserRefreshTokens = async (userId) => {
	return RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
};

exports.generateTemporaryResetJwt = (userId) => {
    return jwt.sign(
        { id: userId, purpose: "password_reset" }, 
        process.env.JWT_ACCESS_SECRET, 
        { expiresIn: "10m" }
    );
};

