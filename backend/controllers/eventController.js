const { EventService } = require("../services/eventService");

exports.getEvents = async (req, res, next) => {
	try {
		const data = await EventService.getEvents(req.query);
		res.status(200).json({
			events: data.data,
			total: data.total,
			page: data.page,
			totalPages: data.totalPages,
		});
	} catch (error) {
		next(error);
	}
};

exports.getEventById = async (req, res, next) => {
	try {
		const data = await EventService.getPublicEventById(req.params.eventId);
		res.status(200).json(data);
	} catch (error) {
		next(error);
	}
};

exports.getEventAdminById = async (req, res, next) => {
	try {
		const event = await EventService.getAdminEventById(req.params.eventId);
		res.status(200).json(event);
	} catch (e) { next(e); }
};

exports.getEventMap = async (req, res, next) => {
	try {
		const { page, size } = req.query;
		const data = await EventService.getEventMap({ page, size });
		res.status(200).json(data);
	} catch (e) { next(e); }
};

exports.getInterestingEvents = async (req, res, next) => {
	try {
		const { size = 20 } = req.query;
		const data = await EventService.getEvents({
			size,
			sort: { is_premium: -1, event_date: 1 }
		});

		res.status(200).json({
			events: data.data,
			total: data.total
		});
	} catch (error) {
		if (error.message === "NOT_FOUND") {
			return res.status(400).json({ message: "No events found" });
		}
		next(error);
	}
};

exports.updateEvent = async (req, res, next) => {
	try {
		await EventService.updateEvent({
			eventId: req.params.eventId,
			body: req.body,
			userId: req.userId
		});
		res.status(200).json({ message: "Event successfully updated" });
	} catch (error) {
		next(error);
	}
};

exports.searchEvents = async (req, res, next) => {
	try {
		const data = await EventService.searchEvents(req.query);
		res.status(200).json({
			events: data.events,
			total: data.total,
			page: data.page,
			totalPages: data.totalPages,
		});
	} catch (e) { next(e); }
};

exports.deleteEvent = async (req, res, next) => {
	try {
		await EventService.deleteEvent(req.params.eventId, req.userId);
		res.status(200).json({ message: "Event successfully deleted" });
	} catch (error) {
		if (error.message === "ALREADY_DELETED") return res.status(400).json({ message: error.message });
		next(error);
	}
};

exports.permanentlyDeleteEvent = async (req, res, next) => {
	try {
		await EventService.permanentlyDeleteEvent(req.params.eventId);
		res.status(200).json({ message: "Event permanently deleted" });
	} catch (error) {
		if (error.message === "EVENT_NOT_ARCHIVED")
			return res.status(400).json({ message: error.message });
		next(error);
	}
};
