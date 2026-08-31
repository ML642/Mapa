const User = require("../models/User");
const { RecommendationService } = require("./recomendationService");

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 40;
const MAX_BIO_LENGTH = 280;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeUsername = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

const normalizeBio = (value) => String(value ?? "")
	.replace(/\r\n/g, "\n")
	.trim();

const validateUsername = (username) => {
	const normalizedUsername = normalizeUsername(username);

	if (!normalizedUsername) {
		throw new Error("Username is required");
	}

	if (normalizedUsername.length < MIN_USERNAME_LENGTH) {
		throw new Error(`Username must contain at least ${MIN_USERNAME_LENGTH} characters`);
	}

	if (normalizedUsername.length > MAX_USERNAME_LENGTH) {
		throw new Error(`Username must not exceed ${MAX_USERNAME_LENGTH} characters`);
	}

	return normalizedUsername;
};

const validateBio = (bio) => {
	const normalizedBio = normalizeBio(bio);

	if (normalizedBio.length > MAX_BIO_LENGTH) {
		throw new Error(`Bio must not exceed ${MAX_BIO_LENGTH} characters`);
	}

	return normalizedBio;
};

const isUsernameTaken = async (username, excludeUserId = null) => {
	const normalizedUsername = validateUsername(username);
	const filter = {
		username: { $regex: `^${escapeRegex(normalizedUsername)}$`, $options: "i" },
	};

	if (excludeUserId) {
		filter._id = { $ne: excludeUserId };
	}

	return Boolean(await User.exists(filter));
};

const ensureUsernameAvailable = async (username, excludeUserId = null) => {
	const normalizedUsername = validateUsername(username);

	if (await isUsernameTaken(normalizedUsername, excludeUserId)) {
		throw new Error("Username already used");
	}

	return normalizedUsername;
};

const findAvailableUsername = async (usernameCandidate) => {
	let baseUsername = normalizeUsername(usernameCandidate) || "User";

	if (baseUsername.length > MAX_USERNAME_LENGTH) {
		baseUsername = baseUsername.slice(0, MAX_USERNAME_LENGTH).trim();
	}

	if (baseUsername.length < MIN_USERNAME_LENGTH) {
		baseUsername = "User";
	}

	if (!(await isUsernameTaken(baseUsername))) {
		return baseUsername;
	}

	let suffix = 1;
	while (suffix < 10000) {
		const suffixLabel = ` ${suffix}`;
		const candidate = `${baseUsername.slice(0, MAX_USERNAME_LENGTH - suffixLabel.length).trim()}${suffixLabel}`;

		if (!(await isUsernameTaken(candidate))) {
			return candidate;
		}

		suffix += 1;
	}

	throw new Error("Unable to generate available username");
};

const buildProfileUpdatePayload = (input) => {
	if (!input || typeof input !== "object") {
		throw new Error("Profile payload is required");
	}

	const payload = {};

	if (Object.prototype.hasOwnProperty.call(input, "username")) {
		payload.username = validateUsername(input.username);
	}

	if (Object.prototype.hasOwnProperty.call(input, "bio")) {
		payload.bio = validateBio(input.bio);
	}

	if (Object.prototype.hasOwnProperty.call(input, "isPublic")) {
		if (typeof input.isPublic !== "boolean") {
			throw new Error("isPublic must be a boolean");
		}

		payload.isPublic = input.isPublic;
	}

	return payload;
};

const serializeOwnProfile = (user) => {
	const normalizedInterests = user?.interests ?RecommendationService.normalizeInterests(user.interests) : {};
	const interests = Object.entries(normalizedInterests)
		.sort((left, right) => right[1] - left[1])
		.map(([category]) => category);

	return {
		id: user._id.toString(),
		username: user.username,
		email: user.email,
		bio: user.bio,
		profilePicture: user.profilePicture,
		isPublic: user.isPublic,
		role: user.role,
		isPayed: user.isPayed,
		type: user.type,
		payedUntil: user.payedUntil,
		friendCount: user.friends?.length || 0,
		pendingFriendRequestsCount: user.friend_requests?.length || 0,
		favoritesCount: user.favorites?.length || 0,
		willAttendCount: user.will_attend?.length || 0,
		mightAttendCount: user.might_attend?.length || 0,
		interests,
	};
};

module.exports = {
	MIN_USERNAME_LENGTH,
	MAX_USERNAME_LENGTH,
	MAX_BIO_LENGTH,
	normalizeUsername,
	normalizeBio,
	validateUsername,
	validateBio,
	isUsernameTaken,
	ensureUsernameAvailable,
	findAvailableUsername,
	buildProfileUpdatePayload,
	serializeOwnProfile,
};
