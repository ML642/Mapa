const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const allowedCsvMimeTypes = new Set(["text/csv", "application/csv", "application/vnd.ms-excel"]);

const uploadCsv = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const mimeType = file.mimetype?.toLowerCase();
		const extension = path.extname(file.originalname || "").toLowerCase();
		const isCsv = allowedCsvMimeTypes.has(mimeType) || extension === ".csv";

		if (!isCsv) return cb(ApiError.BadRequest("Only CSV files are allowed"));

		cb(null, true);
	},
});

module.exports = uploadCsv;
