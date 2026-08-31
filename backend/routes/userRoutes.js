// routes/userRoutes.js
const express = require("express");
const upload = require("../middlewares/upload");
const userController = require("../controllers/userController");
const { privilege } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", privilege(), userController.getCurrentUser);
router.patch("/me", privilege(), userController.updateCurrentUser);
router.get("/history/searches", privilege(), userController.getSearchHistory);
router.post("/history/searches", privilege(), userController.addSearchHistoryItem);
router.delete("/history/searches", privilege(), userController.clearSearchHistory);
router.get("/history/views", privilege(), userController.getViewHistory);
router.post("/history/views/:eventId", privilege(), userController.addViewHistoryItem);
router.delete("/history/views", privilege(), userController.clearViewHistory);

router.get("/username/:username", privilege("moderator"), userController.getUserByUsername);

/**
 * @swagger
 * /user/username/{username}:
 *   get:
 *     summary: Search users by username (moderator only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users matching username
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "680125ab12cd34ef56789012"
 *                   userId:
 *                     type: string
 *                     example: "680125ab12cd34ef56789012"
 *                   username:
 *                     type: string
 *                     example: "JohnDoe"
 *                   profilePicture:
 *                     type: string
 *                     example: "https://mapa.by/uploads/usersid/profile.jpg"
 *                   mutualFriends:
 *                     type: number
 *       400:
 *         description: Users not found
 */

router.get("/:userId", privilege(), userController.getUserById);

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User]
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
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - title: User information
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     mutualFriends:
 *                       type: number
 * 
 *                 - title: User information (friend, moderator)
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     isPayed:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                       enum: [default, premium, pro]
 *                     mutualFriends:
 *                       type: number
 *                     role:
 *                       type: string
 *                       enum: [deleted, banned, user, creator, moderator, admin, superadmin]
 *                     email:
 *                       type: string
 *                       format: email
 *             examples:
 *               user:
 *                 summary: User information
 *                 value:
 *                   id: "680125ab12cd34ef56789012"
 *                   username: "JohnDoe"
 *                   profilePicture: "https://mapa.by/uploads/users/id/profile.jpg"
 *                   mutualFriends: 5
 *               friend:
 *                 summary: User information (friend, moderator)
 *                 value:
 *                   id: "680125ab12cd34ef56789013"
 *                   username: "JaneDoe"
 *                   bio: "Hello, I'm Jane Doe!"
 *                   profilePicture: "https://mapa.by/uploads/users/id/profile.jpg"
 *                   isPayed: true
 *                   type: "premium"
 *                   mutualFriends: 3
 *                   role: "user"
 *                   email: "jane@example.com"
 *       400:
 *         description: User not found
 */

router.put("/update/role/:userId", privilege("admin"), userController.updateUserRole);

/**
 * @swagger
 * /user/update/role/{userId}:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *                 enum: [deleted, banned, user, creator, moderator, admin, superadmin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role or user not found
 *       403:
 *         description: Forbidden
 */

router.put("/update/:userId", privilege(), userController.updateUser);

/**
 * @swagger
 * /user/update/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 bio:
 *                   type: string
 *       400:
 *         description: User not found or invalid fields
 *       403:
 *         description: Forbidden
 */

router.post("/upload/avatar", privilege(), upload.single("avatar"), userController.uploadAvatar);

/**
 * @swagger
 * /user/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profilePicture:
 *                   type: string
 *                   example: "https://mapa.by/uploads/users/id/avatar/avatar.jpg"
 *       400:
 *         description: File required
 *       500:
 *         description: Server error
 */

router.delete("/delete/:userId", privilege(), userController.deleteUser);
router.post("/restore/:userId", privilege("admin"), userController.restoreUser);
router.delete("/purge/:userId", privilege("admin"), userController.purgeUser);

/**
 * @swagger
 * /user/delete/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [User]
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       400:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */

router.get("/favorites/:userId", privilege(), userController.getFavorites);

/**
 * @swagger
 * /user/favorites/{userId}:
 *   get:
 *     summary: Get user favorites
 *     tags: [User]
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
 *         description: List of user's active favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
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
 *                         format: date-time
 *                       address:
 *                         type: string
 *                       event_image:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */

router.get("/favorites/isFavorite/:eventId", privilege(), userController.isFavorite);

/**
 * @swagger
 * /user/favorites/isFavorite/{eventId}:
 *   get:
 *     summary: Check if event is in user's favorites
 *     tags: [User]
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
 *         description: Boolean indicating if event is a favorite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 */

router.post("/favorites/add/:eventId", privilege(), userController.addFavorite);

/**
 * @swagger
 * /user/favorites/add/{eventId}:
 *   post:
 *     summary: Add event to user's favorites
 *     tags: [User]
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
 *         description: Favourite added successfully
 *       400:
 *         description: Event not found or already in favorites
 */

router.delete("/favorites/delete/:eventId", privilege(), userController.removeFavorite);

/**
 * @swagger
 * /user/favorites/delete/{eventId}:
 *   delete:
 *     summary: Remove event from user's favorites
 *     tags: [User]
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
 *         description: Favourite removed successfully"
 *       400:
 *         description: Event not found
 */

module.exports = router;
