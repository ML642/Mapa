const { EventCommentService } = require("../services/eventCommentService");

exports.list = async (req, res, next) => {
	try {
		res.json(await EventCommentService.list(req.params.eventId));
	} catch (error) {
		next(error);
	}
};

exports.create = async (req, res, next) => {
	try {
		const comment = await EventCommentService.create({
			eventId: req.params.eventId,
			userId: req.userId,
			body: req.body?.body,
		});
		res.status(201).json({ comment });
	} catch (error) {
		next(error);
	}
};

exports.remove = async (req, res, next) => {
	try {
		await EventCommentService.remove({
			eventId: req.params.eventId,
			commentId: req.params.commentId,
			userId: req.userId,
			userRole: req.userRole,
		});
		res.status(204).end();
	} catch (error) {
		next(error);
	}
};
