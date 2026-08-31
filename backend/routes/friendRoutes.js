// routes/eventRoutes.js
const express = require("express");
const friendController = require("../controllers/friendController");
const {privilege} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/overview", privilege(), friendController.getOverview);
router.get("/requests", privilege(), friendController.getFriendRequests);
router.get("/requests/outgoing", privilege(), friendController.getOutgoingFriendRequests);

/**
 * @swagger
 * /friends/requests:
 *   get:
 *     summary: Get incoming friend requests
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friend_requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 */

router.post("/requests/send/:userId", privilege(), friendController.sendFriendRequest);
router.post("/requests/cancel/:userId", privilege(), friendController.cancelFriendRequest);

/**
 * @swagger
 * /friends/requests/send/{userId}:
 *   post:
 *     summary: Send a friend request to a user
 *     tags: [Friends]
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
 *         description: Friend request sent successfully
 *       400:
 *         description: Cannot send request (already friends, request pending, or self)
 */

router.post("/requests/accept/:userId", privilege(), friendController.acceptFriendRequest);

/**
 * @swagger
 * /friends/requests/accept/{userId}:
 *   post:
 *     summary: Accept a friend request from a user
 *     tags: [Friends]
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
 *         description: Friend request accepted
 *       400:
 *         description: No friend request from this user or already friends
 */

router.post("/requests/reject/:userId", privilege(), friendController.rejectFriendRequest);

/**
 * @swagger
 * /friends/requests/reject/{userId}:
 *   post:
 *     summary: Reject a friend request from a user
 *     tags: [Friends]
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
 *         description: Friend request rejected
 *       400:
 *         description: No friend request from this user
 */

router.get("/mutual/:userId", privilege(), friendController.getMutualFriends);

/**
 * @swagger
 * /friends/mutual/{userId}:
 *   get:
 *     summary: Get mutual friends count with another user
 *     tags: [Friends]
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
 *         description: Count of mutual friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mutualFriendsCount:
 *                   type: integer
 *       400:
 *         description: User not found
 */

router.get("/mutual/details/:userId", privilege(), friendController.getMutualFriendsDetails);

/**
 * @swagger
 * /friends/mutual/details/{userId}:
 *   get:
 *     summary: Get details of mutual friends with another user
 *     tags: [Friends]
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
 *         description: Details of mutual friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mutualFriends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *       400:
 *         description: User not found
 */

router.post("/remove/:userId", privilege(), friendController.removeFriend);

/**
 * @swagger
 * /friends/remove/{userId}:
 *   post:
 *     summary: Remove a friend
 *     tags: [Friends]
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
 *         description: Friend removed successfully
 *       400:
 *         description: Not friends with this user
 */

router.get("/isFriend/:userId", privilege(), friendController.isFriend);

/**
 * @swagger
 * /friends/isFriend/{userId}:
 *   get:
 *     summary: Check friend status with a user
 *     tags: [Friends]
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
 *         description: Friendship status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFriend:
 *                   type: string
 *                   enum: ["pending", "true", "false"]
 *       400:
 *         description: User not found or same account
 */

router.get("/:userId", privilege(), friendController.getFriends);

/**
 * @swagger
 * /friends/{userId}:
 *   get:
 *     summary: Get a user's friends
 *     tags: [Friends]
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
 *         description: List of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *                       friendsCount:
 *                         type: integer
 *       403:
 *         description: Forbidden
 */


module.exports = router;
