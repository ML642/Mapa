// middlewares/authMiddleware.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { roleHierarchy } = require("../services/roleHierarchy");
const { buildDeletedAccountMessage } = require("../services/userDeletionService");

const readBearerToken = (headerValue) => {
	if (!headerValue || typeof headerValue !== "string" || !headerValue.startsWith("Bearer ")) return null;
	return headerValue.split(" ")[1];
};

const safeEqual = (left, right) => {
	const leftBuffer = Buffer.from(String(left));
	const rightBuffer = Buffer.from(String(right));

	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

exports.privilege = (requiredRole = "user") => {
	return async (req, res, next) => {
		try {
			const token = readBearerToken(req.headers.authorization);
			if (!token) return res.status(401).json({ message: "Token not provided" });

			let decoded;
			try {
				decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
			} catch {
				return res.status(401).json({ message: "Unauthorized" });
			}

			req.userId = decoded.id;
			const user = await User.findById(req.userId);

			if (!user)
				return res.status(400).json({ message: "User not found, please contact support if your token is still valid" });
			if (!user.isVerified) return res.status(403).json({ message: "User is not verified" });

			req.userRole = user.role;
			if (user.role === "banned" && requiredRole !== "banned")
				return res.status(403).json({ message: "User is banned" });
			if (user.role === "deleted" && requiredRole !== "deleted")
				return res.status(403).json({ message: buildDeletedAccountMessage(user) });

			if (roleHierarchy(user.role, "user")) req.isPrivileged = true;

			if (roleHierarchy(user.role, requiredRole)) return next();

			return res.status(403).json({ message: "Forbidden: insufficient privileges" });
		} catch (err) {
			next(ApiError.Internal("Error checking user privileges", err));
		}
	};
};

exports.passwordResetToken = () => {
    return async (req, res, next) => {
        try {
            let token = req.headers.authorization;

            if (!token || !token.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Token not provided" });
            }

            token = token.split(" ")[1];

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            } catch {
                return res.status(401).json({ message: "Unauthorized" });
            }

            if (decoded.purpose !== "password_reset") {
                return res.status(403).json({ message: "Forbidden: invalid token purpose" });
            }

            req.userId = decoded.id;
            
            next();
        } catch (err) {
            next(ApiError.Internal("Error validating password reset token", err));
        }
    };
}

exports.requireParserWorker = (req, res, next) => {
	try {
		const configuredToken = process.env.PARSER_WORKER_TOKEN;
		if (!configuredToken) return res.status(503).json({ message: "Parser worker API is not configured" });

		const token = readBearerToken(req.headers.authorization) || req.headers["x-parser-token"];
		if (!token) return res.status(401).json({ message: "Parser worker token not provided" });
		if (!safeEqual(token, configuredToken)) return res.status(401).json({ message: "Unauthorized parser worker" });

		return next();
	} catch (err) {
		next(ApiError.Internal("Error checking parser worker access", err));
	}
}
