// services/imageService.js
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const allowedMimeTypesMap = require("../config/allowedMimeTypesMap");
const { UPLOADS_DIR, resolveUploadPath } = require("../config/paths");

const extractImageIndex = (imagePath) => {
	if (typeof imagePath !== "string") return null;

	const imageName = path.basename(imagePath);
	const match = imageName.match(/image-(\d+)/);
	return match ? Number(match[1]) : null;
};

const getNextImageIndex = (event) => {
	if (!Array.isArray(event?.event_image)) return 0;

	return event.event_image.reduce((nextIndex, imagePath) => {
		const currentIndex = extractImageIndex(imagePath);
		if (!Number.isInteger(currentIndex)) return nextIndex;
		return Math.max(nextIndex, currentIndex + 1);
	}, 0);
};

exports.uploadImages = async (event, files, userId) => {
	if (!files?.length) throw new Error("No images uploaded");
	if (!event) throw new Error("Event not found");
	if (!userId) throw new Error("User ID is required");
	if (event.status === "deleted") throw new Error("Event is deleted");

	let relativePath = path.posix.join("uploads", "events", event._id.toString());
	if (event.status === "inactive")
		relativePath = path.posix.join("uploads", "users", event.createdBy.toString(), "events", event._id.toString());

	const fullPath = resolveUploadPath(relativePath);
	await fs.mkdir(fullPath, { recursive: true });

	let imageCount = getNextImageIndex(event);
	const newImagePaths = [];

	for (const file of files) {
		const ext = path.extname(file.originalname) || ".jpg";
		const numberedFileName = `image-${imageCount++}${ext}`;
		const filePath = path.join(fullPath, numberedFileName);

		await fs.writeFile(filePath, file.buffer);
		newImagePaths.push(path.posix.join(relativePath, numberedFileName));
	}

	event.event_image.push(...newImagePaths);
	event.updatedBy = userId;
	await event.save();

	return event.event_image;
};

exports.downloadImageToMemory = async (url) => {
	try {
		if (!url) throw new Error("No URL provided");

		const response = await axios.get(url, { responseType: "arraybuffer" });
		const contentType = response.headers["content-type"];

		if (!allowedMimeTypesMap[contentType]) throw new Error(`Unsupported content type: ${contentType}`);

		const buffer = Buffer.from(response.data);
		const parsedUrl = new URL(url);
		let baseName = path.basename(parsedUrl.pathname) || "image";

		if (!path.extname(baseName)) baseName += allowedMimeTypesMap[contentType];

		return {
			originalname: baseName,
			buffer,
		};
	} catch (err) {
		throw new ApiError(500,"Error downloading image", err);
	}
};

exports.uploadAvatar = async (userId, file) => {
	try {
		if (!userId) throw new Error("User ID is required");
		if (!file) throw new Error("File is required");

		const user = await User.findById(userId);
		if (!user) throw new Error("User not found");

		const avatarDir = path.join(UPLOADS_DIR, "users", userId.toString(), "avatar");

		if (user.profilePicture) {
			const avatarPath = resolveUploadPath(user.profilePicture);
			try {
				await fs.rm(avatarPath, { recursive: true, force: true });
			} catch (err) {
				console.error("Error deleting old avatar:", err.message);
			}
		}

		await fs.mkdir(avatarDir, { recursive: true });

		const extension = path.extname(file.originalname);
		await fs.writeFile(path.join(avatarDir, `avatar${extension}`), file.buffer);

		user.profilePicture = path.posix.join("uploads", "users", userId.toString(), "avatar", `avatar${extension}`);
		await user.save();

		return user.profilePicture;
	} catch (err) {
		throw new ApiError(500,"Error uploading avatar", err);
	}
};
