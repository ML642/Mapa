const { ModerationService } = require("../services/ModerationService");
const ApiError = require("../utils/ApiError");
const Event = require("../models/Event");
const { CsvValidationError, buildEventsCsv, listEventsForCsvExport, parseEventCsvBuffer } = require("../services/eventCsvService");

const moderationService = new ModerationService();


exports.getEventsForModeration = async (req, res, next) => {
    try {
        const result = await moderationService.getEventsForModeration(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getParsedEventsForModeration = async (req, res, next) => {
    try {
        const result = await moderationService.getParsedEventsForModeration(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getDeletedEvents = async (req, res, next) => {
    try {
        const result = await moderationService.getDeletedEvents(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.importEventsFromCsv = async (req, res, next) => {
	try {
		if (!req.file) return res.status(400).json({ message: "CSV file is required" });

		const events = parseEventCsvBuffer(req.file.buffer, req.userId);
		const createdEvents = await Event.insertMany(events, { ordered: true });

		res.status(201).json({
			message: "Events imported successfully",
			created: createdEvents.length,
		});
	} catch (error) {
		if (error instanceof CsvValidationError)
			return res.status(error.status).json({ message: error.message, errors: error.errors });

		next(ApiError.Internal("Error importing events from CSV", error));
	}
};

exports.exportEventsToCsv = async (req, res, next) => {
	try {
		const events = await listEventsForCsvExport(req.query);
		const csv = buildEventsCsv(events);
		const dateStamp = new Date().toISOString().slice(0, 10);

		res.setHeader("Content-Type", "text/csv; charset=utf-8");
		res.setHeader("Content-Disposition", `attachment; filename="events-${dateStamp}.csv"`);

		res.status(200).send(csv);
	} catch (error) {
		if (error instanceof CsvValidationError)
			return res.status(error.status).json({ message: error.message, errors: error.errors });

		next(ApiError.Internal("Error exporting events to CSV", error));
	}
};

exports.uploadEventForModeration = async (req, res, next) => {
    try {
        const body = req.body;

        let parsedCoordinates = [0, 0];
        if (body.coordinates) {
            parsedCoordinates = Array.isArray(body.coordinates)
                ? body.coordinates.map(Number)
                : [Number(body.coordinates)];
        }

        const dto = {
            title: body.title?.trim(),
            description: body.description,
            address: body.address,
            category: body.category,
            price_description: body.price_description,
            phone: body.phone,
            dateDisplayMode: body.dateDisplayMode,
            
            is_premium: body.is_premium === 'true',
            isPermanent: body.isPermanent === 'true',
            
            event_dates: body.event_dates ? [].concat(body.event_dates) : [],
            coordinates: parsedCoordinates,
            price: body.price ? Number(body.price) : null,
            schedule: body.schedule ? JSON.parse(body.schedule) : undefined,
            dateRange: body.dateRange ? JSON.parse(body.dateRange) : undefined,
        };

        const result = await moderationService.uploadEventForModeration({
            ...dto,
            files: req.files || [],
            userId: req.userId,
        });

        res.status(201).json({
            message: "Event created successfully",
            _id: result._id,
        });
    } catch (error) {
        next(error);
    }
};

exports.approveEvent = async (req, res, next) => {
    try {
        const result = await moderationService.approveEvent({
            eventId: req.params.eventId,
            userId: req.userId,
        });
        res.status(200).json({ message: result.message });
    } catch (error) {
        next(error);
    }
};

exports.rejectParserReview = async (req, res, next) => {
    try {
        const result = await moderationService.rejectParserReview({
            eventId: req.params.eventId,
            userId: req.userId,
        });
        res.status(200).json({ message: result.message });
    } catch (error) {
        next(error);
    }
};

exports.uploadEventImages = async (req, res, next) => {
    try {
        const result = await moderationService.uploadEventImages({
            eventId: req.params.eventId,
            files: req.files || [],
            userId: req.userId,
        });
        res.status(200).json({
            message: "Event images uploaded successfully",
            event_image: result.event_image,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteEventImages = async (req, res, next) => {
    try {
        await moderationService.deleteEventImages({
            eventId: req.params.eventId,
            imageIndexes: req.body.imageIndexes,
        });
        res.status(200).json({ message: "Event images deleted successfully" });
    } catch (error) {
        next(error);
    }
};

exports.parseEvents = async (req, res, next) => {
    try {
        const result = await moderationService.parseEvents({
            userId: req.userId,
        });
        res.status(202).json({
            message: "Parser run queued",
            run: result.run,
        });
    } catch (error) {
        next(error);
    }
};

exports.parseEventsByCategory = async (req, res, next) => {
    try {
        const result = await moderationService.parseEventsByCategory({
            category: req.body.category,
            size: req.body.size,
            userId: req.userId,
        });
        res.status(202).json({
            message: "Parser run queued",
            run: result.run,
        });
    } catch (error) {
        next(error);
    }
};
