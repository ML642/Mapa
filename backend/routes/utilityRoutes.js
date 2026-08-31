const express = require("express");
const utilityController = require("../controllers/utilityController");

const router = express.Router();

router.get("/status", utilityController.status);
router.get("/health", utilityController.status); // alias for /status

module.exports = router;