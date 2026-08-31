const {
	cancelOutgoingFriendRequest,
	getFriendsOverview,
	getIncomingFriendRequests,
	getOutgoingFriendRequests,
	sendFriendRequest,
	getFriendsList,
	getFriendshipStatus,
	getMutualFriends,
	acceptFriendRequest,
	removeFriend,
	rejectFriendRequest } = require("../services/friendService");



exports.sendFriendRequest = async (req, res, next) => {
	try {
		await sendFriendRequest(req.userId, req.params.userId);
		res.status(200).json({ message: "Friend request sent successfully" });
	} catch (e) {
		next(e)
	}
};

exports.acceptFriendRequest = async (req, res, next) => {
	try {
		await acceptFriendRequest(req.userId, req.params.userId);
		res.status(200).json({ message: "Friend request accepted" });
	} catch (e) {
		next(e)
	}
};

exports.rejectFriendRequest = async (req, res, next) => {
	try {
		await rejectFriendRequest(req.userId, req.params.userId);
		res.status(200).json({ message: "Friend request rejected" });
	} catch (e) {
		next(e)
	}
};

exports.removeFriend = async (req, res, next) => {
	try {
		await removeFriend(req.userId, req.params.userId);
		res.status(200).json({ message: "Friend removed successfully" });
	} catch (e) {
		next(e)
	}
};

exports.getFriends = async (req, res, next) => {
	try {
		const friends = await getFriendsList(
			req.params.userId,
			req.userId,
			req.userRole
		);
		res.status(200).json({ friends });
	} catch (e) {
		next(e)
	}
};

exports.getFriendRequests = async (req, res, next) => {
	try {
		const friend_requests = await getIncomingFriendRequests(req.userId);
		res.status(200).json({ friend_requests });
	} catch (e) {
		next(e)
	}
};

exports.getOutgoingFriendRequests = async (req, res, next) => {
	try {
		const outgoing_requests = await getOutgoingFriendRequests(req.userId);
		res.status(200).json({ outgoing_requests });
	} catch (e) {
		next(e)
	}
};

exports.cancelFriendRequest = async (req, res, next) => {
	try {
		await cancelOutgoingFriendRequest(req.userId, req.params.userId);
		res.status(200).json({ message: "Friend request canceled" });
	} catch (e) {
		next(e)
	}
};

exports.getOverview = async (req, res, next) => {
	try {
		const overview = await getFriendsOverview(req.userId);
		res.status(200).json(overview);
	} catch (e) {
		next(e)
	}
};

exports.getMutualFriends = async (req, res, next) => {
	try {
		const result = await getMutualFriends(req.userId, req.params.userId, false);
		res.status(200).json({ mutualFriendsCount: result.count });
	} catch (e) {
		next(e)
	}
};

exports.getMutualFriendsDetails = async (req, res, next) => {
	try {
		const mutualFriends = await getMutualFriends(req.userId, req.params.userId, true);
		res.status(200).json({ mutualFriends });
	} catch (e) {
		next(e)
	}
};

exports.isFriend = async (req, res, next) => {
	try {
		const isFriend = await getFriendshipStatus(req.userId, req.params.userId);
		res.status(200).json({ isFriend });
	} catch (e) {
		next(e)
	}
};
