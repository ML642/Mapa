import mongoose, { Types } from 'mongoose';
import Event from '../models/Event';
import EventComment from '../models/EventComment';
import { aggregateFilter } from './aggregateFilter';
import { searchEvents as searchEventsService } from './eventSearchService';
import { RecommendationService } from './recomendationService';
import User from '../models/User';
import { mergeEventDateUpdate } from './eventScheduleService';

interface UpdateEventInput {
    eventId: string;
    body: Record<string, any>;
    userId: string;
}

export class EventService {
    /**
     */
    static async getEvents(filters: any) {
        const data = await aggregateFilter({ ...filters, status: "active" });
        if (!data || data.total === 0) throw new Error("NOT_FOUND");
        return data;
    }

    /**
     */
    static async getPublicEventById(id: string) {
        this.validateObjectId(id);
        const data = await aggregateFilter({ id } as any);
        if (!data || data.total === 0) throw new Error("NOT_FOUND");
        return data.data;
    }

    /**
     */
    static async getAdminEventById(id: string) {
        this.validateObjectId(id);
        const event = await Event.findById(id);
        if (!event) throw new Error("NOT_FOUND");
        return event;
    }

    /**
     */
    static async getEventMap({ page = 1, size = 100 } = {}) {
    const data = await aggregateFilter({
        page,
        size,
        select: "coordinates _id category",
    } as any);

    if (!data || data.total === 0) throw new Error("NOT_FOUND");

    return {
        events: data.data,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
    };
}

    /**
     */
    static async searchEvents(params: any) {
        if (!params.text) throw new Error("MISSING_QUERY");
        return await searchEventsService(params);
    }

    /**
     */
    static async getUserEventsByState(userId: string, state: "will_attend" | "might_attend") {
        const { data: user } = await aggregateFilter({
            model: User,
            id: userId,
            select: state,
            populate: [{
                from: "events",
                localField: state,
                as: state,
                select: ["_id", "title", "description", "event_date", "date_display", "date_summary", "dateDisplayMode", "isPermanent", "address", "category", "event_image", "is_premium", "status"],
            }],
        } as any);

        if (!user || !user[state]) return [];

        return (user[state] as any[])
            .filter((e) => e.status === "active")
            .sort((a, b) => {
                if (!a.event_date && !b.event_date) return 0;
                if (!a.event_date) return 1;
                if (!b.event_date) return -1;
                return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
            });
    }

    /**
     */
    static async updateEvent({ eventId, body, userId }: UpdateEventInput) {
        this.validateObjectId(eventId);

        const event = await Event.findById(eventId);
        if (!event) throw new Error("NOT_FOUND");

        const updatedFields = Object.keys(body);
        const isUpdateAllowed = updatedFields.every(field =>
            (Event as any).allowedToUpdateFields.includes(field)
        );

        if (!isUpdateAllowed) throw new Error("FORBIDDEN_FIELDS");

        const normalizedBody = mergeEventDateUpdate(body) as Record<string, any>;

        if (normalizedBody.weights) {
            this.processWeights(normalizedBody.weights);
            event.set('weights', normalizedBody.weights);
            RecommendationService.normalizeEventWeights(event);
            delete normalizedBody.weights;
        }

        Object.assign(event, normalizedBody);
        event.updatedBy = new Types.ObjectId(userId) as any;

        return await event.save();
    }

    /**
     */
    static async deleteEvent(eventId: string, userId: string) {
        this.validateObjectId(eventId);

        const event = await Event.findById(eventId);
        if (!event) throw new Error("NOT_FOUND");
        if (event.status === "deleted") throw new Error("ALREADY_DELETED");

        event.status = "deleted";
        event.updatedBy = new Types.ObjectId(userId) as any;

        return await event.save();
    }

    /**
     */
    static async permanentlyDeleteEvent(eventId: string) {
        this.validateObjectId(eventId);

        const event = await Event.findById(eventId);
        if (!event) throw new Error("NOT_FOUND");
        if (event.status !== "deleted") throw new Error("EVENT_NOT_ARCHIVED");

        await Promise.all([
            Event.deleteOne({ _id: event._id }),
            EventComment.deleteMany({ event: event._id }),
        ]);
    }

    /**
     */
    private static processWeights(weights: Record<string, any>) {
        for (const category in weights) {
            const weight = weights[category];

            const isValidCategory = (Event as any).resolveCategory(category);
            if (!isValidCategory) {
                throw new Error(`INVALID_CATEGORY: ${category}`);
            }

            if (typeof weight !== "number" || weight < 0 || weight > 1) {
                throw new Error(`INVALID_WEIGHT_VALUE: ${category}`);
            }
        }
    }

    /**
     */
    private static validateObjectId(id: string) {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("INVALID_ID_FORMAT");
        }
    }
};
