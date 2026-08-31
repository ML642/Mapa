import path from "path";
import { promises as fs } from "fs";
import { UPLOADS_DIR } from "../config/paths";
import Event from "../models/Event";
import ParserRun from "../models/ParserRun";
import { aggregateFilter } from "./aggregateFilter";
import { buildEventDateAddFieldsStage, buildEventDateQuery, normalizeEventDateUpdate } from "./eventScheduleService";
import { uploadImages } from "./imageService";
import { enqueueParserRun } from "./parserQueue";
import { RELAX_CATEGORIES } from "./parserSources";
import { Types } from "mongoose";
import { GetEventsModerationInput, GetParsedEventsModerationInput, UploadEventModerationInput, ApproveEventInput, RejectParserReviewInput, UploadEventImagesInput, DeleteEventImagesInput, ParseEventsInput, ParseEventsByCategoryInput } from "../types/dto/moderation.dto";


export class ModerationService {
    private readonly PARSER_QUEUE_FILTER = {
        $or: [{ status: "parsed" }, { "moderation.queue": "parser", "moderation.state": "pending" }],
    };

    /*
     */
    private createParserReviewProjection(): Record<string, number> {
        const adminFields = (Event as any).visibleFieldsAdmin || [];
        return adminFields.reduce((projection: Record<string, number>, field: string) => {
            projection[field] = 1;
            return projection;
        }, {});
    }

    /*
    */
    private buildDateStages({ dateFrom, dateTo }: { dateFrom?: string | undefined; dateTo?: string | undefined }): any[] {
        let from: Date | null = null;
        let to: Date | null = null;

        if (dateFrom || dateTo) {
            from = dateFrom ? new Date(dateFrom) : null;
            to = dateTo ? new Date(dateTo) : null;
        }

        return [
            buildEventDateAddFieldsStage(),
            { $match: buildEventDateQuery({ dateFrom: from, dateTo: to }) },
        ];
    }

    /*
     */
    private normalizeCategory(category?: string): string | null {
        if (!category) return null;
        return (Event as any).resolveCategory(category);
    }

    /*
     */
    private clearParserModeration(event: any, userId: string): void {
        event.updatedBy = userId;
        event.moderation = {
            required: false,
            queue: null,
            state: null,
            reason: null,
            source: null,
            runId: null,
            diff: {},
            lastReviewedAt: new Date(),
        };
    }

    /*
     */
    public async getEventsForModeration(input: GetEventsModerationInput) {
        const { category, dateFrom, dateTo, page, size } = input;

        const data = await aggregateFilter({
            size,
            page,
            category,
            dateFrom,
            dateTo,
            status: "inactive",
            select: (Event as any).visibleFieldsAdmin,
        } as any);

        if (!data.total) {
            throw new Error("NO_EVENTS_FOUND");
        }

        return {
            events: data.data,
            total: data.total,
        };
    }

    /*
     */
    public async getParsedEventsForModeration(input: GetParsedEventsModerationInput) {
        const { category, dateFrom, dateTo, page, size } = input;

        const normalizedPage = Math.max(1, Number(page) || 1);
        const normalizedSize = Math.min(100, Math.max(1, Number(size) || 20));
        const resolvedCategory = this.normalizeCategory(category);

        const match: Record<string, any> = { ...this.PARSER_QUEUE_FILTER };

        if (category && !resolvedCategory) {
            throw new Error("INVALID_CATEGORY");
        }
        if (resolvedCategory) {
            match.category = resolvedCategory;
        }

        const basePipeline = [{ $match: match }, ...this.buildDateStages({ dateFrom, dateTo })];
        const countResult = await Event.aggregate([...basePipeline, { $count: "total" }]);
        const total = countResult[0]?.total || 0;

        if (!total) {
            throw new Error("NO_EVENTS_FOUND");
        }

        const events = await Event.aggregate([
            ...basePipeline,
            { $sort: { event_date: 1, updatedAt: -1 } },
            { $skip: (normalizedPage - 1) * normalizedSize },
            { $limit: normalizedSize },
            { $project: this.createParserReviewProjection() },
        ]);

        return {
            events,
            total,
            page: normalizedPage,
            totalPages: Math.ceil(total / normalizedSize),
        };
    }

    /*
    */
    public async getDeletedEvents(input: GetEventsModerationInput) {
        const { category, dateFrom, dateTo, page, size } = input;

        const data = await aggregateFilter({
            size,
            page,
            category,
            dateFrom,
            dateTo,
            status: "deleted",
            select: (Event as any).visibleFieldsAdmin,
        } as any);

        if (!data.total) {
            throw new Error("NO_EVENTS_FOUND");
        }

        return {
            events: data.data,
            total: data.total,
            page: data.page,
            totalPages: data.totalPages,
        };
    }

    /**
    */
    public async uploadEventForModeration(input: UploadEventModerationInput) {
    const { 
        title, 
        description, 
        event_dates, 
        schedule,
        dateRange,
        dateDisplayMode,
        isPermanent,
        address, 
        coordinates, 
        category, 
        is_premium, 
        price, 
        price_description,
        phone,
        files, 
        userId 
    } = input;

    if (category && (Event as any).resolveCategory(category) === null) {
        throw new Error("INVALID_CATEGORY");
    }

    const dateFields = normalizeEventDateUpdate(input as any);

    const event = await Event.create({
        title,
        description,
        event_dates,
        schedule,
        dateRange,
        dateDisplayMode,
        isPermanent,
        ...dateFields, 
        address,
        coordinates,
        category,
        is_premium,
        price,
        price_description,
        phone,
        status: "inactive",
        createdBy: userId,
    });

    if (files && files.length > 0) {
        await uploadImages(event, files, userId);
    }

    return {
        _id: event._id.toString(),
    };
}



    /**
     */
    public async approveEvent(input: ApproveEventInput) {
        const { eventId, userId } = input;
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("EVENT_NOT_FOUND");
        }

        const createdBy = event.createdBy;
        const hasPendingParserReview =
            event.moderation?.queue === "parser" && event.moderation?.state === "pending";

        if (event.status !== "inactive" && event.status !== "parsed" && !hasPendingParserReview) {
            throw new Error("EVENT_ALREADY_APPROVED");
        }

        if (hasPendingParserReview) {
            const diffEntries = Object.entries(event.moderation?.diff ?? {});
            for (const [field, value] of diffEntries) {
                if (value && Object.prototype.hasOwnProperty.call(value, "parsed")) {
                    (event as any)[field] = (value as any).parsed;
                }
            }

            if (event.status === "parsed") {
                event.status = "active";
            }
            this.clearParserModeration(event, userId);
            await event.save();

            return { isParserChanges: true, message: "Parser changes approved successfully" };
        }

        const oldPath = path.join(UPLOADS_DIR, "users", createdBy.toString(), "events", eventId.toString());
        const newPath = path.join(UPLOADS_DIR, "events", eventId.toString());

        await fs.mkdir(newPath, { recursive: true });

        try {
            await fs.cp(oldPath, newPath, { recursive: true });
            await fs.rm(oldPath, { recursive: true, force: true });
        } catch (err) {
            console.error("Error moving event folder:", err);
        }

        if (event.event_image && event.event_image.length > 0) {
            event.event_image = event.event_image.map((imgPath: string) => {
                return imgPath.replace(`uploads/users/${createdBy}/events/${eventId}`, `uploads/events/${eventId}`);
            });
        }

        event.updatedBy = new Types.ObjectId(userId) as any;
        event.status = "active";
        await event.save();

        return { isParserChanges: false, message: "Event successfully approved" };
    }

    /**
     */
    public async rejectParserReview(input: RejectParserReviewInput) {
        const { eventId, userId } = input;
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error("EVENT_NOT_FOUND");
        }

        const hasPendingParserReview =
            event.moderation?.queue === "parser" && event.moderation?.state === "pending";
        if (!hasPendingParserReview) {
            throw new Error("NO_PARSER_REVIEW_PENDING");
        }

        event.updatedBy = new Types.ObjectId(userId) as any;
        if (event.status === "parsed") {
            event.status = "ignored";
            this.clearParserModeration(event, userId);
            await event.save();

            return { isIgnored: true, message: "Parsed event rejected and ignored" };
        }

        this.clearParserModeration(event, userId);
        await event.save();

        return { isIgnored: false, message: "Parser changes rejected" };
    }

    /**
     */
    public async uploadEventImages(input: UploadEventImagesInput) {
        const { eventId, files, userId } = input;
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("EVENT_NOT_FOUND");
        }

        await uploadImages(event, files, userId);

        return {
            event_image: event.event_image,
        };
    }

    /**
     */
    public async deleteEventImages(input: DeleteEventImagesInput) {
        const { eventId, imageIndexes } = input;
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("EVENT_NOT_FOUND");
        }
        if (!imageIndexes || !imageIndexes.length) {
            throw new Error("NO_IMAGES_TO_DELETE");
        }

        const stringIndexes = imageIndexes.map(String);
        const deletePromises: Promise<void>[] = [];

        event.event_image = event.event_image.filter((img: string) => {
            const imageName = path.basename(img);
            const match = imageName.match(/image-(\d+)/);

            if (match && match[1] && stringIndexes.includes(match[1])) {
                const imagePath = path.join(__dirname, "..", img);

                deletePromises.push(
                    fs.rm(imagePath, { recursive: true, force: true }).catch((err) => {
                        console.error(`Error deleting ${imageName}:`, err);
                    })
                );
                return false;
            }
            return true;
        });

        await Promise.all(deletePromises);
        await event.save();
    }

    /**
     */
    public async parseEvents(input: ParseEventsInput) {
        const { userId } = input;

        const activeRun = await ParserRun.findOne({
            source: "relax",
            status: { $in: ["queued", "running"] },
        }).sort({ createdAt: -1 });

        if (activeRun) {
            const error = new Error("PARSER_RUN_IN_PROGRESS");
            (error as any).data = activeRun;
            throw error;
        }

        const run = await ParserRun.create({
            source: "relax",
            mode: "full",
            requestedBy: userId,
            logs: [{ level: "info", message: "Legacy parser endpoint queued relax/all" }],
        });

        await enqueueParserRun(run);

        return { run };
    }

    /**
     */
    public async parseEventsByCategory(input: ParseEventsByCategoryInput) {
        const { category, size, userId } = input;

        if (!RELAX_CATEGORIES.includes(category)) {
            throw new Error("INVALID_CATEGORY");
        }

        const activeRun = await ParserRun.findOne({
            source: "relax",
            status: { $in: ["queued", "running"] },
        }).sort({ createdAt: -1 });

        if (activeRun) {
            const error = new Error("PARSER_RUN_IN_PROGRESS");
            (error as any).data = activeRun;
            throw error;
        }

        const run = await ParserRun.create({
            source: "relax",
            mode: "category",
            category,
            limit: Math.max(1, Math.min(10_000, Number(size) || 100)),
            requestedBy: userId,
            logs: [{ level: "info", message: `Legacy parser endpoint queued relax/${category}` }],
        });

        await enqueueParserRun(run);

        return { run };
    }
}
