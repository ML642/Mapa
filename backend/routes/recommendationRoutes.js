// routes/eventRoutes.js
const express = require("express");
const recommendationController = require("../controllers/recommendationController");
const {privilege} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/user/set/interests", privilege(), recommendationController.setInterests);

/**
 * @swagger
 * /recommendation/user/set/interests:
 *   post:
 *     summary: Set user interests
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["music", "art", "sports"]
 *     responses:
 *       200:
 *         description: Interests set successfully
 *       400:
 *         description: Invalid categories
 */

router.get("/user/interests", privilege(), recommendationController.getInterests);

/**
 * @swagger
 * /recommendation/user/interests:
 *   get:
 *     summary: Get user interests
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user interests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interests:
 *                   type: object
 *                   example: { "music": 0.33, "art": 0.33, "sports": 0.34 }
 *       400:
 *         description: Interests not set
 */

router.post("/event/set/weight/:eventId", privilege("moderator"), recommendationController.setCategoryWeight);

/**
 * @swagger
 * /recommendation/event/set/weight/{eventId}:
 *   post:
 *     summary: Set category weights for an event (moderator only)
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: number
 *             example: { "music": 0.5, "art": 0.5 }
 *     responses:
 *       200:
 *         description: Category weights updated successfully
 *       400:
 *         description: Invalid event or category weights
 */

router.get("/event/attend/state/:eventId", privilege(), recommendationController.attendState);

/**
 * @swagger
 * /recommendation/event/attend/{eventId}:
 *   post:
 *     summary: Attend an event or update attendance state
 *     tags: [Recommendation]
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
 *               state:
 *                 type: string
 *                 enum: [will_attend, might_attend, will_not_attend]
 *                 example: will_attend
 *     responses:
 *       200:
 *         description: Event attendance updated
 *       400:
 *         description: Invalid state or already marked
 */

router.post("/event/attend/:eventId", privilege(), recommendationController.attendEvent);

/**
 * @swagger
 * /recommendation/event/attend/state/{eventId}:
 *   get:
 *     summary: Get user's attendance state for an event
 *     tags: [Recommendation]
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
 *         description: Current attendance state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   enum: [will_attend, might_attend, will_not_attend]
 */

router.get("/event/attend", privilege(), recommendationController.getAttendedEvents);

/**
 * @swagger
 * /recommendation/event/attend:
 *   get:
 *     summary: Get user events attend state
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *           enum: [will_attend, might_attend]
 *         description: Type of attendance
 *     responses:
 *       200:
 *         description: List of events attended by user
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       event_date:
 *                         type: string
 *                       address:
 *                         type: string
 *                       event_image:
 *                         type: string
 *       400:
 *         description: Invalid state
 */

router.get("/event", privilege(), recommendationController.getRecommendedEvents);

/**
 * @swagger
 * /recommendation/search-history:
 *   get:
 *     summary: Get personalized recommendations from search and viewing history, interests, and attendance
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recommended active events and search phrases used for ranking
 */
router.get("/search-history", privilege(), recommendationController.getSearchHistoryRecommendations);

/**
 * @swagger
 * /recommendation/event:
 *   get:
 *     summary: Get recommended events for user based on interests
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max number of events to return
 *     responses:
 *       200:
 *         description: List of recommended events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       400:
 *         description: Interests not set
 */

module.exports = router;
