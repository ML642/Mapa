// config/redis.js
const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();
const REDIS_PORT = process.env.REDIS_PORT;

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";

const redis = new Redis({
	host: REDIS_HOST,
	port: REDIS_PORT || 6379,
	maxRetriesPerRequest: 3,
});

redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err));

module.exports = redis;
