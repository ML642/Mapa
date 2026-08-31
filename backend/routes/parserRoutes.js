const express = require("express");
const parserController = require("../controllers/parserController");
const parserWorkerController = require("../controllers/parserWorkerController");
const { privilege, requireParserWorker } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/worker/runs/:runId", requireParserWorker, parserWorkerController.getWorkerRun);
router.post("/worker/runs/:runId/heartbeat", requireParserWorker, parserWorkerController.heartbeat);
router.post("/worker/runs/:runId/events", requireParserWorker, parserWorkerController.ingestEvents);
router.post("/worker/runs/:runId/complete", requireParserWorker, parserWorkerController.completeRun);

router.post("/runs", privilege("moderator"), parserController.createParserRun);
router.get("/runs", privilege("moderator"), parserController.listParserRuns);
router.get("/runs/:runId", privilege("moderator"), parserController.getParserRunById);
router.post("/runs/:runId/cancel", privilege("moderator"), parserController.cancelParserRun);

module.exports = router;
