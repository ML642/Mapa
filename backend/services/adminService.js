const mongoose = require("mongoose");
const Event = require("../models/Event");
const ParserRun = require("../models/ParserRun");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { buildEventDateAddFieldsStage, buildEventDateQuery } = require("./eventScheduleService");
const { RELAX_CATEGORIES } = require("./parserSources");

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const RECENT_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

const USER_SELECT = [
	"_id",
	"username",
	"email",
	"authType",
	"role",
	"previousRole",
	"profilePicture",
	"bio",
	"isPublic",
	"friends",
	"friend_requests",
	"favorites",
	"will_attend",
	"might_attend",
	"isPayed",
	"type",
	"payedUntil",
	"isVerified",
	"deletedAt",
	"deleteAfter",
	"deletedBy",
	"deletionReason",
	"createdAt",
	"updatedAt",
].join(" ");

const USER_SORTS = new Set(["createdAt", "updatedAt", "username", "email", "role", "deleteAfter"]);
const EVENT_SORTS = new Set(["event_date", "createdAt", "updatedAt", "title", "status", "category"]);

const normalizePage = (value) => Math.max(1, Number(value) || 1);

const normalizeSize = (value, fallback = DEFAULT_PAGE_SIZE) =>
	Math.min(MAX_PAGE_SIZE, Math.max(1, Number(value) || fallback));

const normalizeSortOrder = (value, fallback = -1) => {
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["asc", "1"].includes(normalized)) return 1;
		if (["desc", "-1"].includes(normalized)) return -1;
	}

	return fallback;
};

const normalizeBoolean = (value) => {
	if (value === undefined || value === null || value === "") return null;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(normalized)) return true;
		if (["false", "0", "no", "off"].includes(normalized)) return false;
	}

	return null;
};

const escapeRegex = (value) => String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compactObject = (value) =>
	Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));

const toDateOrNull = (value) => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const getEnumValues = (model, path) => model.schema.path(path)?.enumValues || [];

const toIdString = (value) => {
	if (!value) return null;
	if (typeof value === "string") return value;
	return String(value._id || value);
};

const countArray = (value) => (Array.isArray(value) ? value.length : 0);

const resolveEventDate = (event) => {
	if (event.event_date) return event.event_date;
	if (event.date_summary?.startsAt) return event.date_summary.startsAt;
	if (event.dateRange?.from) return event.dateRange.from;
	if (!Array.isArray(event.event_dates) || !event.event_dates.length) return null;

	return event.event_dates.reduce((earliest, value) => {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return earliest;
		if (!earliest || date < earliest) return date;
		return earliest;
	}, null);
};

const serializeUser = (user, sessionCount = 0) => ({
	id: user._id.toString(),
	username: user.username,
	email: user.email,
	authType: user.authType,
	role: user.role,
	previousRole: user.previousRole,
	profilePicture: user.profilePicture,
	bio: user.bio,
	isPublic: user.isPublic,
	isPayed: user.isPayed,
	type: user.type,
	payedUntil: user.payedUntil,
	isVerified: user.isVerified,
	counts: {
		friends: countArray(user.friends),
		friendRequests: countArray(user.friend_requests),
		favorites: countArray(user.favorites),
		willAttend: countArray(user.will_attend),
		mightAttend: countArray(user.might_attend),
		activeSessions: sessionCount,
	},
	deletion: {
		deletedAt: user.deletedAt,
		deleteAfter: user.deleteAfter,
		deletedBy: toIdString(user.deletedBy),
		reason: user.deletionReason,
	},
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

const serializeDashboardUser = (user) => ({
	id: user._id.toString(),
	username: user.username,
	role: user.role,
	profilePicture: user.profilePicture,
	isVerified: user.isVerified,
	deletion: {
		deletedAt: user.deletedAt,
		deleteAfter: user.deleteAfter,
	},
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
});

const serializeEvent = (event) => ({
	id: event._id.toString(),
	_id: event._id,
	title: event.title,
	description: event.description,
	event_date: resolveEventDate(event),
	event_dates: event.event_dates,
	date_display: event.date_display,
	date_summary: event.date_summary,
	dateDisplayMode: event.dateDisplayMode,
	isPermanent: event.isPermanent,
	dateRange: event.dateRange,
	schedule: event.schedule,
	address: event.address,
	coordinates: event.coordinates,
	category: event.category,
	event_image: event.event_image,
	price: event.price,
	price_description: event.price_description,
	is_premium: event.is_premium,
	phone: event.phone,
	source: event.source,
	status: event.status,
	createdBy: toIdString(event.createdBy),
	updatedBy: toIdString(event.updatedBy),
	moderation: event.moderation,
	parseInfo: event.parseInfo,
	parserMeta: event.parserMeta,
	derived: {
		imageCount: countArray(event.event_image),
		datesCount: countArray(event.event_dates),
		sessionsCount: event.date_summary?.sessionsCount ?? countArray(event.event_dates),
		isPermanent: Boolean(event.isPermanent),
		dateMode: event.dateDisplayMode || event.date_summary?.mode || "sessions",
		hasCoordinates:
			Array.isArray(event.coordinates) &&
			event.coordinates.length === 2 &&
			event.coordinates.some((coordinate) => Number(coordinate) !== 0),
		pendingModeration: event.moderation?.required === true || event.moderation?.state === "pending",
	},
	createdAt: event.createdAt,
	updatedAt: event.updatedAt,
});

const statusCounts = async (model, field, filter = {}) => {
	const rows = await model.aggregate([
		{ $match: filter },
		{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
		{ $sort: { count: -1, _id: 1 } },
	]);

	return rows.reduce((acc, row) => {
		acc[row._id || "unknown"] = row.count;
		return acc;
	}, {});
};

const getSessionCountMap = async (userIds) => {
	if (!userIds.length) return new Map();

	const now = new Date();
	const rows = await RefreshToken.aggregate([
		{
			$match: {
				userId: { $in: userIds },
				isRevoked: false,
				expiresAt: { $gt: now },
			},
		},
		{ $group: { _id: "$userId", count: { $sum: 1 } } },
	]);

	return new Map(rows.map((row) => [row._id.toString(), row.count]));
};

const buildUserFilter = (query = {}) => {
	const filter = {};
	const validRoles = new Set(getEnumValues(User, "role"));

	if (query.q) {
		const regex = new RegExp(escapeRegex(query.q), "i");
		filter.$or = [{ username: regex }, { email: regex }];
	}

	const requestedRoles = []
		.concat(query.roles || [])
		.concat(query.role || [])
		.flatMap((role) => String(role).split(","))
		.map((role) => role.trim())
		.filter((role) => validRoles.has(role));

	if (requestedRoles.length) filter.role = { $in: [...new Set(requestedRoles)] };

	if (query.status === "active") filter.role = { $nin: ["deleted", "banned"] };
	if (query.status === "deleted") filter.role = "deleted";
	if (query.status === "banned") filter.role = "banned";
	if (query.status === "staff") filter.role = { $in: ["creator", "moderator", "admin", "superadmin"] };

	if (query.authType) filter.authType = query.authType;
	if (query.type) filter.type = query.type;

	const isVerified = normalizeBoolean(query.isVerified);
	if (isVerified !== null) filter.isVerified = isVerified;

	const isPublic = normalizeBoolean(query.isPublic);
	if (isPublic !== null) filter.isPublic = isPublic;

	const isPayed = normalizeBoolean(query.isPayed);
	if (isPayed !== null) filter.isPayed = isPayed;

	const dateFrom = toDateOrNull(query.dateFrom || query.createdFrom);
	const dateTo = toDateOrNull(query.dateTo || query.createdTo);
	if (dateFrom || dateTo) filter.createdAt = compactObject({ $gte: dateFrom, $lte: dateTo });

	const deleteBefore = toDateOrNull(query.deleteBefore);
	if (deleteBefore) filter.deleteAfter = { $lte: deleteBefore };

	return filter;
};

const buildEventFilter = (query = {}) => {
	const filter = {};
	const validStatuses = new Set(getEnumValues(Event, "status"));
	const addAnd = (condition) => {
		filter.$and = [...(filter.$and || []), condition];
	};
	const missingImagesCondition = {
		$or: [{ event_image: { $exists: false } }, { event_image: [] }],
	};
	const missingCoordinatesCondition = {
		$or: [{ coordinates: { $exists: false } }, { coordinates: [] }, { coordinates: [0, 0] }],
	};
	const incompleteMetadataCondition = {
		$or: [
			{ description: { $exists: false } },
			{ description: "" },
			{ address: { $exists: false } },
			{ address: "" },
			{ phone: { $exists: false } },
			{ phone: "" },
			{
				$and: [
					{ source: { $in: [null, ""] } },
					{ "parserMeta.source": { $in: [null, ""] } },
				],
			},
		],
	};
	const moderationCondition = {
		$or: [
			{ status: "inactive" },
			{ status: "parsed" },
			{ "moderation.required": true },
			{ "moderation.state": "pending" },
		],
	};

	if (query.status && query.status !== "all") {
		const statuses = String(query.status)
			.split(",")
			.map((status) => status.trim())
			.filter((status) => validStatuses.has(status));
		if (statuses.length) filter.status = { $in: [...new Set(statuses)] };
	}

	if (query.category) {
		const resolvedCategory = Event.resolveCategory(query.category);
		if (resolvedCategory) filter.category = resolvedCategory;
	}

	if (query.source) filter.source = query.source;
	if (query.parserSource) filter["parserMeta.source"] = query.parserSource;

	if (query.q || query.text) {
		const regex = new RegExp(escapeRegex(query.q || query.text), "i");
		filter.$or = [
			{ title: regex },
			{ description: regex },
			{ address: regex },
			{ source: regex },
			{ "parserMeta.externalId": regex },
		];
	}

	const isPremium = normalizeBoolean(query.isPremium ?? query.premium);
	if (isPremium !== null) filter.is_premium = isPremium;

	const hasImages = normalizeBoolean(query.hasImages);
	if (hasImages === true) filter.event_image = { $exists: true, $ne: [] };
	if (hasImages === false) addAnd(missingImagesCondition);

	const hasCoordinates = normalizeBoolean(query.hasCoordinates);
	if (hasCoordinates === true) addAnd({ $nor: [missingCoordinatesCondition] });
	if (hasCoordinates === false) addAnd(missingCoordinatesCondition);

	const hasDescription = normalizeBoolean(query.hasDescription);
	if (hasDescription === true) addAnd({ description: { $exists: true, $ne: "" } });
	if (hasDescription === false) addAnd({ $or: [{ description: { $exists: false } }, { description: "" }] });

	const hasPhone = normalizeBoolean(query.hasPhone);
	if (hasPhone === true) addAnd({ phone: { $exists: true, $ne: "" } });
	if (hasPhone === false) addAnd({ $or: [{ phone: { $exists: false } }, { phone: "" }] });

	const needsModeration = normalizeBoolean(query.needsModeration);
	if (needsModeration === true) addAnd(moderationCondition);

	if (query.qualityIssue) {
		const qualityIssue = String(query.qualityIssue);
		if (qualityIssue === "missingImages") addAnd(missingImagesCondition);
		if (qualityIssue === "missingCoordinates") addAnd(missingCoordinatesCondition);
		if (qualityIssue === "incompleteMetadata") addAnd(incompleteMetadataCondition);
		if (qualityIssue === "needsModeration") addAnd(moderationCondition);
		if (qualityIssue === "any") {
			addAnd({
				$or: [
					missingImagesCondition,
					missingCoordinatesCondition,
					incompleteMetadataCondition,
					moderationCondition,
				],
			});
		}
	}

	const createdFrom = toDateOrNull(query.createdFrom);
	const createdTo = toDateOrNull(query.createdTo);
	if (createdFrom || createdTo) filter.createdAt = compactObject({ $gte: createdFrom, $lte: createdTo });

	return filter;
};

const buildEventDateStages = (query = {}) => {
	const dateFrom = toDateOrNull(query.dateFrom);
	const dateTo = toDateOrNull(query.dateTo);

	const stages = [buildEventDateAddFieldsStage()];

	if (dateFrom || dateTo) {
		stages.push({ $match: buildEventDateQuery({ dateFrom, dateTo }) });
	}

	return stages;
};

const getDashboard = async (query = {}) => {
	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
	const upcomingSevenDays = new Date(now.getTime() + 7 * DAY_MS);
	const recentLimit = Math.min(20, Math.max(1, Number(query.recentLimit) || RECENT_LIMIT));

	const [
		eventStatusCounts,
		eventCategoryCounts,
		userRoleCounts,
		parserStatusCounts,
		moderationCounts,
		userCounts,
		eventQualityCounts,
		activeParserRun,
		latestParserRun,
		recentParserRuns,
		recentEvents,
		recentUsers,
	] = await Promise.all([
		statusCounts(Event, "status"),
		statusCounts(Event, "category", { status: { $ne: "deleted" } }),
		statusCounts(User, "role"),
		statusCounts(ParserRun, "status"),
		Promise.all([
			Event.countDocuments({ status: "inactive" }),
			Event.countDocuments({
				$or: [{ status: "parsed" }, { "moderation.queue": "parser", "moderation.state": "pending" }],
			}),
			Event.countDocuments({ status: "deleted" }),
			Event.countDocuments({ status: "ignored" }),
		]),
		Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: { $nin: ["deleted", "banned"] } }),
			User.countDocuments({ role: "deleted" }),
			User.countDocuments({ role: "banned" }),
			User.countDocuments({ isVerified: true }),
			User.countDocuments({ isVerified: false }),
			User.countDocuments({ isPayed: true }),
			User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
			User.countDocuments({ role: "deleted", deleteAfter: { $lte: now } }),
		]),
		Promise.all([
			Event.countDocuments({ status: "active", ...buildEventDateQuery({ dateFrom: now, dateTo: upcomingSevenDays }) }),
			Event.countDocuments({ status: { $ne: "deleted" }, event_image: { $size: 0 } }),
			Event.countDocuments({
				status: { $ne: "deleted" },
				$or: [{ coordinates: { $exists: false } }, { coordinates: [] }, { coordinates: [0, 0] }],
			}),
			Event.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
		]),
		ParserRun.findOne({ status: { $in: ["queued", "running"] } }).sort({ createdAt: -1 }).lean(),
		ParserRun.findOne().sort({ createdAt: -1 }).lean(),
		ParserRun.find().sort({ createdAt: -1 }).limit(recentLimit).lean(),
		Event.find()
			.select("_id title status category event_dates date_display date_summary dateDisplayMode isPermanent dateRange schedule event_image moderation parserMeta createdAt updatedAt")
			.sort({ updatedAt: -1 })
			.limit(recentLimit)
			.lean(),
		User.find()
			.select("_id username role isVerified profilePicture createdAt updatedAt deletedAt deleteAfter")
			.sort({ createdAt: -1 })
			.limit(recentLimit)
			.lean(),
	]);

	const [pendingManual, pendingParser, deletedEvents, ignoredEvents] = moderationCounts;
	const [totalUsers, activeUsers, deletedUsers, bannedUsers, verifiedUsers, unverifiedUsers, paidUsers, newUsers7d, purgeDueUsers] =
		userCounts;
	const [upcoming7d, missingImages, missingCoordinates, created7d] = eventQualityCounts;

	return {
		generatedAt: now,
		moderation: {
			pendingManual,
			pendingParser,
			deletedEvents,
			ignoredEvents,
		},
		events: {
			total: Object.values(eventStatusCounts).reduce((sum, count) => sum + count, 0),
			byStatus: eventStatusCounts,
			byCategory: eventCategoryCounts,
			upcoming7d,
			created7d,
			missingImages,
			missingCoordinates,
		},
		users: {
			total: totalUsers,
			active: activeUsers,
			deleted: deletedUsers,
			banned: bannedUsers,
			verified: verifiedUsers,
			unverified: unverifiedUsers,
			paid: paidUsers,
			new7d: newUsers7d,
			purgeDue: purgeDueUsers,
			byRole: userRoleCounts,
		},
		parser: {
			byStatus: parserStatusCounts,
			activeRun: activeParserRun,
			latestRun: latestParserRun,
			recentRuns: recentParserRuns,
		},
		activity: {
			recentEvents: recentEvents.map(serializeEvent),
			recentUsers: recentUsers.map(serializeDashboardUser),
			recentParserRuns,
		},
	};
};

const listUsers = async (query = {}) => {
	const page = normalizePage(query.page);
	const size = normalizeSize(query.size);
	const sortField = USER_SORTS.has(query.sort) ? query.sort : "createdAt";
	const sortOrder = normalizeSortOrder(query.order, -1);
	const filter = buildUserFilter(query);

	const [total, users] = await Promise.all([
		User.countDocuments(filter),
		User.find(filter)
			.select(USER_SELECT)
			.sort({ [sortField]: sortOrder, _id: sortOrder })
			.skip((page - 1) * size)
			.limit(size)
			.lean(),
	]);

	const sessionCounts = await getSessionCountMap(users.map((user) => user._id));

	return {
		users: users.map((user) => serializeUser(user, sessionCounts.get(user._id.toString()) || 0)),
		total,
		page,
		totalPages: Math.ceil(total / size),
		filters: compactObject({
			q: query.q,
			role: query.role,
			roles: query.roles,
			status: query.status,
			authType: query.authType,
			isVerified: query.isVerified,
			isPublic: query.isPublic,
			isPayed: query.isPayed,
			type: query.type,
		}),
		sort: {
			field: sortField,
			order: sortOrder === 1 ? "asc" : "desc",
		},
	};
};

const getUserById = async (userId) => {
	if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("INVALID_ID_FORMAT");

	const user = await User.findById(userId).select(USER_SELECT).lean();
	if (!user) throw new Error("USER_NOT_FOUND");

	const [sessionCount, createdEventsCount, updatedEventsCount, recentEvents] = await Promise.all([
		RefreshToken.countDocuments({
			userId,
			isRevoked: false,
			expiresAt: { $gt: new Date() },
		}),
		Event.countDocuments({ createdBy: user._id }),
		Event.countDocuments({ updatedBy: user._id }),
		Event.find({ $or: [{ createdBy: user._id }, { updatedBy: user._id }] })
			.select("_id title status category event_dates date_display date_summary dateDisplayMode isPermanent dateRange schedule event_image createdAt updatedAt")
			.sort({ updatedAt: -1 })
			.limit(10)
			.lean(),
	]);

	return {
		user: serializeUser(user, sessionCount),
		contributions: {
			createdEvents: createdEventsCount,
			updatedEvents: updatedEventsCount,
			recentEvents: recentEvents.map(serializeEvent),
		},
	};
};

const listEvents = async (query = {}) => {
	const page = normalizePage(query.page);
	const size = normalizeSize(query.size);
	const sortField = EVENT_SORTS.has(query.sort) ? query.sort : "updatedAt";
	const sortOrder = normalizeSortOrder(query.order, -1);
	const filter = buildEventFilter(query);
	const dateStages = buildEventDateStages(query);
	const sort = { [sortField]: sortOrder, _id: sortOrder };

	const basePipeline = [{ $match: filter }, ...dateStages];

	const [countResult, events] = await Promise.all([
		Event.aggregate([...basePipeline, { $count: "total" }]),
		Event.aggregate([
			...basePipeline,
			{ $sort: sort },
			{ $skip: (page - 1) * size },
			{ $limit: size },
			{
				$project: {
					title: 1,
					description: 1,
					event_date: 1,
					event_dates: 1,
					date_display: 1,
					date_summary: 1,
					dateDisplayMode: 1,
					isPermanent: 1,
					dateRange: 1,
					schedule: 1,
					address: 1,
					coordinates: 1,
					category: 1,
					event_image: 1,
					price: 1,
					price_description: 1,
					is_premium: 1,
					phone: 1,
					source: 1,
					status: 1,
					createdBy: 1,
					updatedBy: 1,
					moderation: 1,
					parseInfo: 1,
					parserMeta: 1,
					createdAt: 1,
					updatedAt: 1,
				},
			},
		]),
	]);

	const total = countResult[0]?.total || 0;

	return {
		events: events.map(serializeEvent),
		total,
		page,
		totalPages: Math.ceil(total / size),
		filters: compactObject({
			q: query.q || query.text,
			status: query.status,
			category: query.category,
			source: query.source,
			parserSource: query.parserSource,
			isPremium: query.isPremium ?? query.premium,
			hasImages: query.hasImages,
			hasCoordinates: query.hasCoordinates,
			hasDescription: query.hasDescription,
			hasPhone: query.hasPhone,
			needsModeration: query.needsModeration,
			qualityIssue: query.qualityIssue,
			dateFrom: query.dateFrom,
			dateTo: query.dateTo,
		}),
		sort: {
			field: sortField,
			order: sortOrder === 1 ? "asc" : "desc",
		},
	};
};

const getOptions = () => ({
	roles: getEnumValues(User, "role"),
	restorableRoles: getEnumValues(User, "previousRole"),
	authTypes: getEnumValues(User, "authType"),
	subscriptionTypes: getEnumValues(User, "type"),
	eventStatuses: getEnumValues(Event, "status"),
	eventCategories: getEnumValues(Event, "category"),
	parserSources: ["relax"],
	parserCategories: RELAX_CATEGORIES,
	userSorts: [...USER_SORTS],
	eventSorts: [...EVENT_SORTS],
	pageSize: {
		default: DEFAULT_PAGE_SIZE,
		max: MAX_PAGE_SIZE,
	},
});
/**
 */
const getAuditLogs = async ({ page = 1, size = 30, q, status }) => {
	const query = {};

	if (status) {
		query.status = status;
	}

	if (q && q.trim() !== "") {
		const searchRegex = new RegExp(q.trim(), "i"); 
		query.$or = [
			{ actor: searchRegex },
			{ action: searchRegex },
			{ target: searchRegex },
			{ details: searchRegex },
		];
	}

	const limit = Number(size);
	const skip = (Number(page) - 1) * limit;

	const [rawEntries, total] = await Promise.all([
		AuditLog.find(query)
			.sort({ createdAt: -1 }) 
			.skip(skip)
			.limit(limit)
			.exec(),
		AuditLog.countDocuments(query),
	]);

	const entries = rawEntries.map((doc) => doc.toJSON());

	const totalPages = Math.ceil(total / limit) || 1;

	return {
		entries,
		total,
		page: Number(page),
		totalPages,
	};
}

/**
 */
const createAuditLog = async (data) => {
	const newLog = await AuditLog.create(data);
	return newLog.toJSON();
}

module.exports = {
	getDashboard,
	getOptions,
	getUserById,
	listEvents,
	listUsers,
	getAuditLogs,
	createAuditLog
};
