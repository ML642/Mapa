const crypto = require("crypto");
const { createLogger } = require("../services/createLogger");

const logger = createLogger({ fileName: "request.log" });

const requestLogger = (req, res, next) => {
	req.id = crypto.randomUUID();
	const start = Date.now();

	res.on("finish", () => {
		if (req.method === "GET" && !req.isPrivileged) return;
		const duration = Date.now() - start;

		logger.info({
			reqId: req.id, 
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			durationMs: duration,
			ip: req.ip,
			userAgent: req.headers["user-agent"],
			userId: req.userId || null,
			params: req.params,
			query: req.query,
			entityId: req.body?.eventId ?? req.body?.userId,
		});
	});

	next();
};

module.exports = requestLogger;
