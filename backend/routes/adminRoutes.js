const express = require("express");
const adminController = require("../controllers/adminController");
const { privilege } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { createAuditLogSchema, getAuditLogsSchema } = require("../schemas/dto/adminAudit.dto");
const router = express.Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics
 *     description: Requires moderator privileges or higher.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recentLimit
 *         schema:
 *           type: integer
 *           default: 8
 *           maximum: 20
 *         description: Number of recent users, events and parser runs to include.
 *     responses:
 *       200:
 *         description: Dashboard counters and recent activity for the admin panel.
 */
router.get("/dashboard", privilege("moderator"), adminController.getDashboard);

/**
 * @swagger
 * /admin/options:
 *   get:
 *     summary: Get option values for admin panel filters
 *     description: Requires moderator privileges or higher.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles, statuses, categories and supported sort fields.
 */
router.get("/options", privilege("moderator"), adminController.getOptions);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List users for admin panel
 *     description: Requires admin privileges or higher.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by username or email.
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [deleted, banned, user, creator, moderator, admin, superadmin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deleted, banned, staff]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPayed
 *         schema:
 *           type: boolean
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
 *           maximum: 100
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, username, email, role, deleteAfter]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated users with safe profile, role, deletion and count metadata.
 */
router.get("/users", privilege("admin"), adminController.listUsers);

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: Get full admin user profile
 *     description: Requires admin privileges or higher.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Safe user profile with session counts and recent event contributions.
 *       404:
 *         description: User not found.
 */
router.get("/users/:userId", privilege("admin"), adminController.getUserById);

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: List events for admin panel
 *     description: Requires moderator privileges or higher.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by title, description, address, source or parser external id.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, parsed, inactive, ignored, deleted, all]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: parserSource
 *         schema:
 *           type: string
 *       - in: query
 *         name: needsModeration
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: hasImages
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: hasCoordinates
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: hasDescription
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: hasPhone
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: qualityIssue
 *         schema:
 *           type: string
 *           enum: [any, missingImages, missingCoordinates, incompleteMetadata, needsModeration]
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
 *           maximum: 100
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [event_date, createdAt, updatedAt, title, status, category]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated events with moderation, parser and derived quality metadata.
 */
router.get("/events", privilege("moderator"), adminController.listEvents);



/**
 * @swagger
 * /admin/audit:
 *   get:
 *     summary: Fetch paginated audit log entries with filtering
 *     description: Used on AuditPage in Server mode. Always returns entries sorted by createdAt DESC.
 *     tags: [Admin / Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Page size (frontend default is 30)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query across actor, action, target, and details fields
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, error, info]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Successfully retrieved audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - entries
 *                 - total
 *                 - page
 *                 - totalPages
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLogEntry'
 *                 total:
 *                   type: integer
 *                   example: 120
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 4
 *       401:
 *         description: Unauthorized — missing or expired JWT
 *       403:
 *         description: Forbidden — role below moderator
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create a new audit log entry
 *     description: Called fire-and-forget on every admin action.
 *     tags: [Admin / Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditLogInput'
 *     responses:
 *       201:
 *         description: Created. Audit log successfully recorded.
 *       400:
 *         description: Bad Request — required fields missing
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
    "/audit",
    privilege("moderator"),
    validate(getAuditLogsSchema),
    adminController.getAuditLogs
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLogEntry:
 *       type: object
 *       required:
 *         - id
 *         - actor
 *         - action
 *         - target
 *         - status
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique entry identifier
 *           example: "6658f2c8c9c6f3b71e9a1234"
 *         actor:
 *           type: string
 *           description: Username of the admin who performed the action
 *           example: "admin_pavel"
 *         action:
 *           type: string
 *           description: Action description
 *           example: "update event"
 *         target:
 *           type: string
 *           description: ID or description of the affected entity
 *           example: "event_6658f2c8c"
 *         details:
 *           type: string
 *           description: Additional details (optional)
 *           example: "Changed category from Party to Exhibition"
 *         status:
 *           type: string
 *           enum: [success, error, info]
 *           description: Action status
 *           example: "success"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 entry creation timestamp
 *           example: "2026-07-22T14:30:00.000Z"
 * 
 *     CreateAuditLogInput:
 *       type: object
 *       required:
 *         - actor
 *         - action
 *         - target
 *       properties:
 *         actor:
 *           type: string
 *           description: Username of the admin performing the action
 *           example: "admin_pavel"
 *         action:
 *           type: string
 *           description: Action description
 *           example: "delete user"
 *         target:
 *           type: string
 *           description: ID or name of the entity
 *           example: "user_12345"
 *         details:
 *           type: string
 *           description: Optional action details
 *           example: "User requested deletion via support"
 *         status:
 *           type: string
 *           enum: [success, error, info]
 *           default: info
 *           description: Status of the action
 *           example: "info"
 */

router.post(
    "/audit",
    privilege("moderator"),
    validate(createAuditLogSchema),
    adminController.createAuditLog
);


module.exports = router;
