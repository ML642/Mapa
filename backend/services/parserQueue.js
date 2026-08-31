const { Queue } = require("bullmq");
const redis = require("../config/redis");

const PARSER_QUEUE_NAME = "parser-runs";

let parserQueue;

const getParserQueue = () => {
	if (!parserQueue) {
		parserQueue = new Queue(PARSER_QUEUE_NAME, {
			connection: redis,
			defaultJobOptions: {
				removeOnComplete: 100,
				removeOnFail: 100,
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 5_000,
				},
			},
		});
	}

	return parserQueue;
};

const enqueueParserRun = async (run) => {
	const queue = getParserQueue();

	return queue.add(
		"run",
		{
			runId: run._id.toString(),
			source: run.source,
		},
		{
			jobId: run._id.toString(),
		}
	);
};

module.exports = {
	PARSER_QUEUE_NAME,
	getParserQueue,
	enqueueParserRun,
};
