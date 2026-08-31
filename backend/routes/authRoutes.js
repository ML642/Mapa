const express = require("express");
const authController = require("../controllers/authController");
const { privilege, passwordResetToken } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");

const {
    registerSchema,
    requestResetSchema,
    verifyResetCodeSchema,
    confirmPasswordResetSchema,
    loginSchema,
    googleAuthSchema,
    emailSendSchema,
    verifyEmailSchema
} = require("../schemas/auth.schema");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already used or blacklisted
 */

router.post("/login", validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiI...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     isPayed:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                     payedUntil:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Incorrect email or password (attempts remaining)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: INVALID_CREDENTIALS
 *       429:
 *         description: Too many failed login attempts. User temporary blocked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 retryAfter:
 *                   type: integer
 *                   description: Time to wait in seconds before next attempt
 *                   example: 60
 *                 code:
 *                   type: string
 *                   example: TOO_MANY_REQUESTS
 */
router.post("/logout/all", privilege(), authController.logoutAll);

/**
 * @swagger
 * /auth/logout/all:
 *   post:
 *     summary: Logout user from all sessions
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revokedCount:
 *                   type: integer
 */

router.post("/logout", privilege(), authController.logout);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *           format: jwt
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Refresh token missing or not found
 */

router.post("/refresh", authController.refreshToken);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *           format: jwt
 *       - in: header
 *         name: user-agent
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Missing refresh token or user-agent
 *       403:
 *         description: Invalid refresh token
 */

router.post("/revoke", privilege("moderator"), authController.revokeRefreshTokenFromUser);

/**
 * @swagger
 * /auth/revoke:
 *   post:
 *     summary: Revoke all refresh tokens for a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User tokens revoked
 *       400:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */

router.post("/verify/email/send", validate(emailSendSchema), authController.sendVerificationEmail);

/**
 * @swagger
 * /auth/verify/email/send:
 *   post:
 *     summary: Send or resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent successfully or cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification email sent successfully
 *                 isResent:
 *                   type: boolean
 *                   description: Indicates if a new email was sent (false if cooldown is active)
 *                   example: true
 *                 cooldownRemaining:
 *                   type: integer
 *                   description: Seconds remaining before a new email can be requested
 *                   example: 60
 *       400:
 *         description: Email missing, user not found, or user already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email is required
 *       429:
 *         description: Rate limit exceeded for OTP sending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 retryAfter:
 *                   type: integer
 *                   description: Time to wait in seconds before next attempt
 *                   example: 60
 *                 code:
 *                   type: string
 *                   example: TOO_MANY_REQUESTS
 */

router.post("/verify/email", validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @swagger
 * /auth/verify/email:
 *   post:
 *     summary: Verify email with OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Path=/
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiI...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c22b1c8e4111"
 *                     username:
 *                       type: string
 *                       example: john_doe
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       400:
 *         description: Invalid/expired code, missing fields, or user already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: INVALID_CODE
 *       429:
 *         description: Too many failed code verification attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 retryAfter:
 *                   type: integer
 *                   description: Time to wait in seconds before next attempt
 *                   example: 60
 *                 code:
 *                   type: string
 *                   example: TOO_MANY_REQUESTS
 */
router.post("/google", validate(googleAuthSchema), authController.googleAuth);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth login / register
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authentication successful
  *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     isPayed:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                     payedUntil:
 *                       type: string
 *                       format: date-time
 *       201:
 *         description: Account registered via Google
 *       400:
 *         description: Invalid Google token or blacklisted email
 */

router.post("/reset-password/request", validate(requestResetSchema), authController.requestPasswordReset);
/**
 * @swagger
 * /auth/reset-password/request:
 *   post:
 *     summary: Request password reset code
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP code sent successfully or cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset password email sent successfully
 *                 isResent:
 *                   type: boolean
 *                   example: true
 *                 cooldownRemaining:
 *                   type: integer
 *                   example: 60
 *       400:
 *         description: Bad request (missing email or email blacklisted)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: EMAIL_BLACKLISTED
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: USER_NOT_FOUND
 *       429:
 *         description: Too many requests or rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: TOO_MANY_REQUESTS
 *                 retryAfter:
 *                   type: integer
 *                   example: 60
 */

router.post("/reset-password/verify", validate(verifyResetCodeSchema), authController.verifyResetCode);
/**
 * @swagger
 * /auth/reset-password/verify:
 *   post:
 *     summary: Verify password reset OTP code
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP code verified successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: resetToken=eyJhbGciOi...; Path=/; HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resetToken:
 *                   type: string
 *                   example: eyJhbGciOi...
 *       400:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: INVALID_CODE
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: USER_NOT_FOUND
 *       429:
 *         description: Too many failed verification attempts (Blocked)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: TOO_MANY_REQUESTS
 *                 retryAfter:
 *                   type: integer
 *                   example: 60
 */

router.post("/reset-password/confirm", passwordResetToken(), validate(confirmPasswordResetSchema), authController.confirmPasswordReset);
/**
 * @swagger
 * /auth/reset-password/confirm:
 *   post:
 *     summary: Confirm password reset and set new password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been successfully reset. Please log in with your new password.
 *       400:
 *         description: Invalid or missing password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PASSWORD_REQUIRED
 *       401:
 *         description: Unauthorized or reset token expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: USER_NOT_FOUND
 */


module.exports = router;
