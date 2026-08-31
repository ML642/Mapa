// middleware/upload.js
const multer = require("multer");
const allowedMimeTypesMap = require("../config/allowedMimeTypesMap");

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowedMimeTypes = Object.keys(allowedMimeTypesMap);

		if (!allowedMimeTypes.includes(file.mimetype))
			return cb(new Error(`Only ${allowedMimeTypes.join(", ")} files are allowed`));

		cb(null, true);
	},
});

module.exports = upload;
