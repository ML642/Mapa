// routes/eventRoutes.js
const express = require("express");
const eventController = require("../controllers/eventController");
const eventCommentController = require("../controllers/eventCommentController");
const { privilege } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { updateEventSchema } = require("../schemas/dto/eventModeration.schemas");
const router = express.Router();

router.get("/", eventController.getEvents);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get events with filters
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer

 *     responses:
 *       200:
 *         description: Events list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

router.get("/map", eventController.getEventMap);

/**
 * @swagger
 * /events/map:
 *   get:
 *     summary: Get events for map
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Event coordinates for map display
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [53.9, 27.5667]
 *                       category:
 *                         type: string
 */

router.get("/interesting", eventController.getInterestingEvents);

/**
 * @swagger
 * /events/interesting:
 *   get:
 *     summary: Get interesting events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit the number of events returned
 *     responses:
 *       200:
 *         description: List of interesting events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */

router.get("/search", eventController.searchEvents);
router.get("/admin/:eventId", privilege("moderator"), eventController.getEventAdminById);
router.get("/:eventId/comments", eventCommentController.list);
router.post("/:eventId/comments", privilege(), eventCommentController.create);
router.delete("/:eventId/comments/:commentId", privilege(), eventCommentController.remove);

/**
 * @swagger
 * /events/{eventId}/comments:
 *   get:
 *     summary: List comments for an active event
 *     tags: [Event comments]
 *   post:
 *     summary: Create a comment for an active event
 *     tags: [Event comments]
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /events/{eventId}/comments/{commentId}:
 *   delete:
 *     summary: Delete an own comment or any comment as a moderator
 *     tags: [Event comments]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /events/search:
 *   get:
 *     summary: Search events by query
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: text
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword(s)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           description: Filter by category
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events to this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

router.get("/:eventId", eventController.getEventById);

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */

router.put("/update/:eventId", privilege("moderator"), validate(updateEventSchema), eventController.updateEvent);

/**
 * @swagger
 * /events/update/{eventId}:
 *   put:
 *     summary: Update an event
 *     description: Update allowed fields of an event. Only moderators can update events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: MongoDB ObjectId of the event
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               event_dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date-time
 *                 description: Legacy list of concrete session start datetimes. Still supported.
 *               schedule:
 *                 type: array
 *                 description: Preferred format for several sessions on the same date.
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     times:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["10:00", "14:30", "19:00"]
 *               dateDisplayMode:
 *                 type: string
 *                 enum: [sessions, range, permanent]
 *               dateRange:
 *                 type: object
 *                 description: For range events both from and to are required; from without to is treated as a permanent event.
 *                 properties:
 *                   from:
 *                     type: string
 *                     format: date-time
 *                   to:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *               isPermanent:
 *                 type: boolean
 *               address:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [53.9, 27.5667]
 *               category:
 *                 type: string
 *               weights:
 *                 type: object
 *                 category:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *               is_premium:
 *                 type: boolean
 *               price:
 *                 type: number
 *               price_description:
 *                 type: string
 *               phone:
 *                 type: string
 *               source:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, parsed, inactive, ignored, deleted]
 *     responses:
 *       200:
 *         description: Event successfully updated
 *       400:
 *         description: Invalid request or forbidden fields update
 */

router.delete("/delete/permanent/:eventId", privilege("moderator"), eventController.permanentlyDeleteEvent);
router.delete("/delete/:eventId", privilege("moderator"), eventController.deleteEvent);

/**
 * @swagger
 * /events/delete/{eventId}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */

module.exports = router;
