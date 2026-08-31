const pino = require("pino");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const logDir = path.join(process.cwd(), "logs");

const isDev = process.env.NODE_ENV !== "production";

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

exports.createLogger = ({ level = "info", fileName = "info.log" }) => {
	console.log(isDev);
	const logFilePath = path.join(logDir, fileName);
	if (isDev) {
		return pino({
			level: "info",
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			},
		});
	}
	return pino({ level }, pino.destination(logFilePath));
};
