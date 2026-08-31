const { RecommendationService } = require("../services/recomendationService");
const { EventService } = require("../services/eventService");
const User = require("../models/User");



exports.setInterests = async (req, res, next) => {
	try {

		await RecommendationService.setUserInterests(req.userId, req.body.categories);
		res.status(200).json({ message: "Interests set successfully" });
	} catch (e) {
		next(e)
	}
};

exports.getInterests = async (req, res, next) => {
	try {
		const interests = await RecommendationService.getUserInterests(req.userId);
		res.status(200).json({ interests });
	} catch (e) {
		next(e)
	}
};

exports.attendEvent = async (req, res, next) => {
	try {
		await RecommendationService.updateAttendance(req.userId, req.params.eventId, req.body.state);
		res.json({ message: "Event attendance updated" });
	} catch (e) {
		next(e)
	}
};

exports.attendState = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		const eventId = req.params.eventId;

		const isWill = user.hasId("will_attend", eventId);
		const isMight = user.hasId("might_attend", eventId);

		const state = isWill ? "will_attend" : isMight ? "might_attend" : "will_not_attend";
		res.json({ state });
	} catch (e) {
		next(e)
	}
};

exports.setCategoryWeight = async (req, res, next) => {
	try {
		await RecommendationService.updateEventWeights(req.params.eventId, req.body.categories);
		res.status(200).json({ message: "Category weights updated successfully" });
	} catch (e) {
		next(e)
	}
};

exports.getRecommendedEvents = async (req, res, next) => {
	try {
		const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
		const events = await RecommendationService.getRecommendations(req.userId, size);
		res.json({ events });
	} catch (e) {
		next(e)
	}
};

exports.getSearchHistoryRecommendations = async (req, res, next) => {
	try {
		const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
		res.json(await RecommendationService.getSearchHistoryRecommendations(req.userId, size));
	} catch (e) {
		next(e);
	}
};

exports.getAttendedEvents = async (req, res, next) => {
	try {
		const { state } = req.query;
		if (state !== "will_attend" && state !== "might_attend") {
			throw new Error("INVALID_STATE");
		}

		const events = await EventService.getUserEventsByState(req.userId, state);
		res.json({ events });
	} catch (e) {
		next(e)
	}
};
