import mongoose from "mongoose";
import Event from "../models/Event";
import EventComment from "../models/EventComment";
import ApiError from "../utils/ApiError";
import { roleHierarchy } from "./roleHierarchy";

const COMMENT_MAX_LENGTH = 1000;
const COMMENT_PAGE_SIZE = 100;

const normalizeCommentBody = (value: unknown) => String(value ?? "")
	.replace(/\r\n/g, "\n")
	.trim();

const assertObjectId = (value: string, field: string) => {
	if (!mongoose.isValidObjectId(value)) {
		throw ApiError.BadRequest(`Invalid ${field}`);
	}
};

const serializeComment = (comment: any) => ({
	_id: comment._id,
	body: comment.body,
	createdAt: comment.createdAt,
	updatedAt: comment.updatedAt,
	author: comment.author ? {
		_id: comment.author._id,
		username: comment.author.username,
		profilePicture: comment.author.profilePicture || "",
	} : null,
});

export class EventCommentService {
	static async list(eventId: string) {
		assertObjectId(eventId, "event id");
		const event = await Event.findOne({ _id: eventId, status: "active" }).select("_id").lean();
		if (!event) throw ApiError.NotFound("Event not found");

		const [comments, total] = await Promise.all([
			EventComment.find({ event: eventId })
				.sort({ createdAt: -1, _id: -1 })
				.limit(COMMENT_PAGE_SIZE)
				.populate("author", "_id username profilePicture")
				.lean(),
			EventComment.countDocuments({ event: eventId }),
		]);

		return {
			comments: comments.map(serializeComment),
			total,
		};
	}

	static async create({ eventId, userId, body }: { eventId: string; userId: string; body: unknown }) {
		assertObjectId(eventId, "event id");
		const normalizedBody = normalizeCommentBody(body);
		if (!normalizedBody || normalizedBody.length > COMMENT_MAX_LENGTH) {
			throw ApiError.BadRequest(`Comment must be between 1 and ${COMMENT_MAX_LENGTH} characters`);
		}

		const event = await Event.findOne({ _id: eventId, status: "active" }).select("_id").lean();
		if (!event) throw ApiError.NotFound("Event not found");

		const comment = await EventComment.create({
			event: event._id,
			author: userId,
			body: normalizedBody,
		});
		await comment.populate("author", "_id username profilePicture");

		return serializeComment(comment);
	}

	static async remove({
		eventId,
		commentId,
		userId,
		userRole,
	}: {
		eventId: string;
		commentId: string;
		userId: string;
		userRole: string;
	}) {
		assertObjectId(eventId, "event id");
		assertObjectId(commentId, "comment id");

		const comment = await EventComment.findOne({ _id: commentId, event: eventId });
		if (!comment) throw ApiError.NotFound("Comment not found");

		const isAuthor = comment.author.toString() === userId;
		if (!isAuthor && !roleHierarchy(userRole, "moderator")) {
			throw ApiError.Forbidden("You can only delete your own comments");
		}

		await comment.deleteOne();
	}
}
