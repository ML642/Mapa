
process.env.NODE_ENV = "test";
process.env.DEBUG = "false";

process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.PARSER_WORKER_TOKEN ||= "test-parser-worker-token";
process.env.PARSER_SYSTEM_USER_ID ||= "000000000000000000000001";

process.env.REDIS_HOST ||= "127.0.0.1";
process.env.REDIS_PORT ||= "6379";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/mapa-test-placeholder";

export {};
