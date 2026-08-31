const Event = require("../models/Event");
const User = require("../models/User");
const {roleHierarchy} = require("./roleHierarchy");

const DEFAULT_ACTIVITY_LIMIT = 10;
const DEFAULT_PREVIEW_FRIENDS_LIMIT = 3;

const toObjectIdString = (value) => {
	if (!value) return "";

	if (typeof value === "string") {
		return value;
	}

	if (value._id) {
		return value._id.toString();
	}

	return value.toString();
};


const getEventDate = (event) => {
	if (event?.date_summary?.startsAt) return new Date(event.date_summary.startsAt).toISOString();
	if (event?.dateRange?.from) return new Date(event.dateRange.from).toISOString();

	const eventDates = Array.isArray(event?.event_dates) ? event.event_dates : [];
	if (!eventDates.length) return null;

	const nearestDate = eventDates.reduce((nearest, current) => {
		if (!nearest) return current;
		return new Date(current).getTime() < new Date(nearest).getTime() ? current : nearest;
	}, null);

	return nearestDate ? new Date(nearestDate).toISOString() : null;
};

const getFriendsIdSet = (friends) =>
	new Set((Array.isArray(friends) ? friends : []).map((friendId) => toObjectIdString(friendId)).filter(Boolean));

const getMutualFriendsCount = (targetUser, currentUserFriendsSet) => {
	const targetFriends = Array.isArray(targetUser?.friends) ? targetUser.friends : [];

	return targetFriends.reduce((count, friendId) => {
		const normalizedId = toObjectIdString(friendId);
		return currentUserFriendsSet.has(normalizedId) ? count + 1 : count;
	}, 0);
};

const serializeFriend = (user) => ({
	_id: toObjectIdString(user),
	id: toObjectIdString(user),
	username: user?.username || "",
	profilePicture: user?.profilePicture || "",
	friendsCount: Array.isArray(user?.friends) ? user.friends.length : Number(user?.friendsCount || 0),
});

const serializeFriendRequest = (user, mutualFriendsCount) => ({
	_id: toObjectIdString(user),
	id: toObjectIdString(user),
	username: user?.username || "",
	profilePicture: user?.profilePicture || "",
	mutualFriendsCount,
});

const serializeActivityAttendee = (user) => ({
	_id: toObjectIdString(user),
	id: toObjectIdString(user),
	username: user?.username || "",
	profilePicture: user?.profilePicture || "",
});

const serializeActivityEvent = (event, attendees) => ({
	_id: toObjectIdString(event),
	id: toObjectIdString(event),
	title: event?.title || "",
	description: event?.description || "",
	event_date: getEventDate(event),
	date_display: event?.date_display || "",
	date_summary: event?.date_summary || null,
	dateDisplayMode: event?.dateDisplayMode || "sessions",
	isPermanent: Boolean(event?.isPermanent),
	address: event?.address || "",
	category: event?.category || "Другое",
	event_image: event?.event_image || [],
	price: event?.price ?? null,
	price_description: event?.price_description || "",
	is_premium: Boolean(event?.is_premium),
	attendees: attendees.slice(0, 3).map(serializeActivityAttendee),
	attendeeCount: attendees.length,
});

const buildFriendActivity = async (friends, state, limit = DEFAULT_ACTIVITY_LIMIT) => {
	const eventAttendeesMap = new Map();

	for (const friend of friends) {
		const events = Array.isArray(friend?.[state]) ? friend[state] : [];

		for (const eventId of events) {
			const normalizedEventId = toObjectIdString(eventId);
			if (!normalizedEventId) continue;

			if (!eventAttendeesMap.has(normalizedEventId)) {
				eventAttendeesMap.set(normalizedEventId, []);
			}

			eventAttendeesMap.get(normalizedEventId).push(friend);
		}
	}

	const eventIds = Array.from(eventAttendeesMap.keys());
	if (!eventIds.length) {
		return [];
	}

	const events = await Event.find({
		_id: { $in: eventIds },
		status: "active",
	}).select("_id title description event_dates date_display date_summary dateDisplayMode isPermanent dateRange address category event_image price price_description is_premium");

	return events
		.map((event) => serializeActivityEvent(event, eventAttendeesMap.get(event._id.toString()) || []))
		.filter((event) => Boolean(event.event_date) || event.isPermanent)
		.sort((left, right) => {
			if (!left.event_date && !right.event_date) return right.attendeeCount - left.attendeeCount;
			if (!left.event_date) return 1;
			if (!right.event_date) return -1;
			const timeDiff = new Date(left.event_date).getTime() - new Date(right.event_date).getTime();
			if (timeDiff !== 0) return timeDiff;
			return right.attendeeCount - left.attendeeCount;
		})
		.slice(0, limit);
};

const getCurrentUserForRequests = async (userId) => {
	const user = await User.findById(userId).select("friends friend_requests");
	if (!user) {
		throw new Error("User not found");
	}

	return user;
};

const getIncomingFriendRequests = async (userId) => {
	const currentUser = await User.findById(userId)
		.select("friends friend_requests")
		.populate("friend_requests", "_id username profilePicture friends role");

	if (!currentUser) {
		throw new Error("User not found");
	}

	const currentUserFriendsSet = getFriendsIdSet(currentUser.friends);

	return (currentUser.friend_requests || [])
		.filter((requestUser) => Boolean(requestUser) && requestUser.role !== "deleted")
		.map((requestUser) => serializeFriendRequest(requestUser, getMutualFriendsCount(requestUser, currentUserFriendsSet)));
};

const getOutgoingFriendRequests = async (userId) => {
	const currentUser = await getCurrentUserForRequests(userId);
	const currentUserFriendsSet = getFriendsIdSet(currentUser.friends);

	const outgoingRequests = await User.find({ friend_requests: userId })
		.select("_id username profilePicture friends role")
		.where("role")
		.ne("deleted")
		.sort({ username: 1 });

	return outgoingRequests.map((requestUser) =>
		serializeFriendRequest(requestUser, getMutualFriendsCount(requestUser, currentUserFriendsSet))
	);
};

const cancelOutgoingFriendRequest = async (userId, targetUserId) => {
	const targetUser = await User.findById(targetUserId);

	if (!targetUser) {
		throw new Error("User not found");
	}

	if (!targetUser.hasId("friend_requests", userId)) {
		throw new Error("No outgoing friend request to this user");
	}

	targetUser.removeId("friend_requests", userId);
	await targetUser.save();
};

const getFriendsOverview = async (userId) => {
	const currentUser = await User.findById(userId)
		.select("friends friend_requests")
		.populate("friends", "_id username profilePicture friends will_attend might_attend role");

	if (!currentUser) {
		throw new Error("User not found");
	}

	const activeFriends = (currentUser.friends || []).filter((friend) => Boolean(friend) && friend.role !== "deleted");

	const incomingRequestsCount = Array.isArray(currentUser.friend_requests)
		? currentUser.friend_requests.filter(Boolean).length
		: 0;
	const previewFriends = activeFriends
		.slice(0, DEFAULT_PREVIEW_FRIENDS_LIMIT)
		.map(serializeFriend);

	const outgoingRequestsCount = await User.countDocuments({ friend_requests: userId, role: { $ne: "deleted" } });
	const willAttendEvents = await buildFriendActivity(activeFriends, "will_attend");
	const mightAttendEvents = await buildFriendActivity(activeFriends, "might_attend");

	return {
		friendsCount: activeFriends.length,
		incomingRequestsCount,
		outgoingRequestsCount,
		previewFriends,
		willAttendEvents,
		mightAttendEvents,
	};
};

//**
// */

const acceptFriendRequest = async (userId, requesterId) => {
    const [user, requester] = await Promise.all([
        User.findById(userId),
        User.findById(requesterId)
    ]);

    if (!user || !requester) throw new Error("USER_NOT_FOUND");
    
    if (!user.hasId("friend_requests", requesterId)) {
        throw new Error("NO_REQUEST_FOUND");
    }

    if (user.hasId("friends", requesterId)) {
        throw new Error("ALREADY_FRIENDS");
    }

    user.friends.push(requesterId);
    requester.friends.push(userId);

	user.removeId("friend_requests", requesterId);

    return Promise.all([user.save(), requester.save()]);
};

/**
 */
const rejectFriendRequest = async (userId, requesterId) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("USER_NOT_FOUND");
    
    if (!user.hasId("friend_requests", requesterId)) {
        throw new Error("NO_REQUEST_FOUND");
    }

    user.removeId("friend_requests", requesterId);
    return user.save();
};

/**
 */
const removeFriend = async (userId, friendId) => {
    const [user, friend] = await Promise.all([
        User.findById(userId),
        User.findById(friendId)
    ]);

    if (!user || !friend) throw new Error("USER_NOT_FOUND");

    if (!user.hasId("friends", friendId)) {
        throw new Error("NOT_FRIENDS");
    }

    user.removeId("friends", friendId);
    friend.removeId("friends", userId);

    return Promise.all([user.save(), friend.save()]);
};


const sendFriendRequest = async (userId, friendId) => {
    if (userId === friendId) throw new Error("SELF_REQUEST");

    const [user, friend] = await Promise.all([
        User.findById(userId),
        User.findById(friendId)
    ]);

    if (!friend || !user) throw new Error("USER_NOT_FOUND");
    if (user.hasId("friends", friendId)) throw new Error("ALREADY_FRIENDS");
    
    if (user.hasId("friend_requests", friendId)) {
        return acceptFriendRequest(userId, friendId);
    }

    if (friend.hasId("friend_requests", userId)) {
        throw new Error("REQUEST_ALREADY_SENT");
    }

    friend.friend_requests.push(userId);
    return friend.save();
};

/**
 */
const getFriendsList = async (targetUserId, viewerId, viewerRole) => {
    const user = await User.findById(targetUserId).populate({
        path: "friends",
        select: "_id username profilePicture friends role",
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    const isOwner = targetUserId === viewerId;
    const isFriend = user.hasId("friends", viewerId);
    const isAdmin = roleHierarchy(viewerRole, "admin");

    if (!isOwner && !isFriend && !isAdmin) {
        throw new Error("FORBIDDEN_LIST");
    }

    return (user.friends || [])
        .filter((friend) => friend && friend.role !== "deleted")
        .map(serializeFriend);
};

/**
 */
const getMutualFriends = async (userId, otherId, detailed = false) => {
    let userQuery = User.findById(userId);

    if (detailed) {
        userQuery = userQuery.populate("friends", "_id username profilePicture friends");
    }

    const [user, other] = await Promise.all([
        userQuery,
        User.findById(otherId)
    ]);

    if (!user || !other) throw new Error("USER_NOT_FOUND");

    const mutual = user.friends.filter(f => {
        const id = detailed ? f._id : f;
        return other.hasId("friends", id);
    });

    if (detailed) return mutual.map(serializeFriend);
    return { count: mutual.length };
};

/**
 */
const getFriendshipStatus = async (userId, otherId) => {
    if (userId === otherId) throw new Error("SELF_CHECK");

    const [user, other] = await Promise.all([
        User.findById(userId).select("friend_requests"),
        User.findById(otherId).select("friends friend_requests")
    ]);

    if (!other) throw new Error("USER_NOT_FOUND");

    if (other.hasId("friends", userId)) return "true";
    
    const isPending = other.hasId("friend_requests", userId) || 
                      (user && user.hasId("friend_requests", otherId));
                      
    return isPending ? "pending" : "false";
};


module.exports = {
	buildFriendActivity,
	cancelOutgoingFriendRequest,
	getFriendsOverview,
	getIncomingFriendRequests,
	getOutgoingFriendRequests,
	serializeFriend,
	serializeFriendRequest,
	toObjectIdString,
	sendFriendRequest,
	getFriendsList,
	getMutualFriends,
	getFriendshipStatus,
	acceptFriendRequest,
	rejectFriendRequest,
	removeFriend
};
