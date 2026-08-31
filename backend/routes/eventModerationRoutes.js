// routes/moderationRoutes.js
const express = require("express");
const upload = require("../middlewares/upload");
const uploadCsv = require("../middlewares/uploadCsv");
const eventModerationController = require("../controllers/eventModerationController");
const {privilege} = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { uploadEventSchema } = require("../schemas/dto/eventModeration.schemas");
const router = express.Router();

router.get("/", privilege("moderator"), eventModerationController.getEventsForModeration);

/**
 * @swagger
 * /moderation/events:
 *   get:
 *     summary: Get all inactive events for moderation
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events on page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of events for moderation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     allOf:
 *                     - $ref: '#/components/schemas/EventFull'
 *                     - type: object
 *                       properties:
 *                         status:
 *                           example: "inactive"
 *                 total:
 *                   type: number
 *       400:
 *         description: No events found
 */

router.get("/parsed", privilege("moderator"), eventModerationController.getParsedEventsForModeration);

/**
 * @swagger
 * /moderation/events/parsed:
 *   get:
 *     summary: Get all parsed events for moderation
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events on page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of parsed events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     allOf:
 *                     - $ref: '#/components/schemas/EventFull'
 *                     - type: object
 *                       properties:
 *                         status:
 *                           example: "parsed"
 *                 total:
 *                   type: number
 *       400:
 *         description: No events found
 */

router.get("/deleted", privilege("moderator"), eventModerationController.getDeletedEvents);

/**
 * @swagger
 * /moderation/events/deleted:
 *   get:
 *     summary: Get all deleted events
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events on page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of deleted events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     allOf:
 *                     - $ref: '#/components/schemas/EventFull'
 *                     - type: object
 *                       properties:
 *                         status:
 *                           example: "deleted"
 *                 total:
 *                   type: number
 *       400:
 *         description: No events found
 */

router.post("/import/csv", privilege("creator"), uploadCsv.single("file"), eventModerationController.importEventsFromCsv);

/**
 * @swagger
 * /moderation/events/import/csv:
 *   post:
 *     summary: Import events from a CSV file
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with columns like title, event_dates, date_display_mode, date_range_from, date_range_to, schedule, address, category, coordinates_lat and coordinates_lng
 *     responses:
 *       201:
 *         description: Events imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 created:
 *                   type: integer
 *       400:
 *         description: Invalid CSV file or validation errors
 */

router.get("/export/csv", privilege("moderator"), eventModerationController.exportEventsToCsv);

/**
 * @swagger
 * /moderation/events/export/csv:
 *   get:
 *     summary: Export events to a CSV file
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, parsed, inactive, ignored, deleted, all]
 *           default: active
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: CSV file with exported events
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid filter values
 */

router.post("/upload/event", privilege("creator"), upload.array("images", 10), validate(uploadEventSchema),eventModerationController.uploadEventForModeration);

/**
 * @swagger
 * /moderation/events/upload/event:
 *   post:
 *     summary: Upload a new event for moderation
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - address
 *               - category
 *               - coordinates
 *               - is_premium
 *             properties:
 *               title:
 *                 type: string
 *               event_dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date-time
 *               schedule:
 *                 type: string
 *                 example: '[{"date":"2026-07-15","times":["12:00","15:00"]},{"date":"2026-07-16","times":["18:30"]}]'
 *               dateDisplayMode:
 *                 type: string
 *                 enum: [sessions, range, permanent]
 *                 example: "sessions"
 *               dateRange:
 *                 type: string
 *                 example: '{"from":"2026-07-15","to":"2026-08-31"}'
 *               isPermanent:
 *                 type: boolean
 *                 example: false
 *               address:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 2
 *                 items:
 *                   type: number
 *                   example: [53.9045, 27.5618]
 *               category:
 *                 type: string
 *               is_premium:
 *                 type: boolean
 *                 example: false
 *               price:
 *                 type: number
 *                 nullable: true
 *                 example: 15
 *               price_description:
 *                 type: string
 *               phone:
 *                 type: string
 *                 example: "+375291234567"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Event successfully created and sent to moderation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *                 _id:
 *                   type: string
 *                   example: "6658f2c8c9c6f3b71e9a1234"
 *       400:
 *         description: Bad Request (Invalid category or validation error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "INVALID_CATEGORY"
 *       401:
 *         description: Unauthorized (Missing or invalid token)
 */

router.post("/approve/:eventId", privilege("moderator"), eventModerationController.approveEvent);
router.post("/reject/:eventId", privilege("moderator"), eventModerationController.rejectParserReview);

/**
 * @swagger
 * /moderation/events/approve/{eventId}:
 *   post:
 *     summary: Approve an event (moderator only)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the event to approve
 *     responses:
 *       200:
 *         description: Event approved successfully
 *       400:
 *         description: Event not found or already approved
 */

router.post("/upload/images/:eventId", privilege("moderator"), upload.array("images", 10), eventModerationController.uploadEventImages);

/**
 * @swagger
 * /moderation/events/upload/images/{eventId}:
 *   post:
 *     summary: Upload images for an event
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the event to upload images for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Event not found
 */

router.delete("/delete/images/:eventId", privilege("moderator"), eventModerationController.deleteEventImages);

/**
 * @swagger
 * /moderation/events/delete/images/{eventId}:
 *   delete:
 *     summary: Delete images from an event
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageIndexes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *       400:
 *         description: Event not found, no images to delete
 */

router.post("/parsed/relax", privilege("moderator"), eventModerationController.parseEvents);
router.post("/parsed/relax/category", privilege("moderator"), eventModerationController.parseEventsByCategory);

module.exports = router;
