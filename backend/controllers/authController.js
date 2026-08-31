const { AuthService } = require("../services/authService");
const ApiError = require("../utils/ApiError");
const { cookieConfig } = require("../config/cookieConfig");
const rateLimit = require("../lib/rate-limit/rateLimit");
const getClientIp = require("../utils/getIp");
const authService = new AuthService();

/**
 */
exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body ?? {};

        await authService.register({ username, email, password });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.sendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body ?? {};
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const ip = getClientIp(req);

        const result = await authService.sendVerificationEmail({ email, ip });

        return res.status(200).json({
            message: result.isResent
                ? "Verification email sent successfully"
                : "Код уже был отправлен ранее.",
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body ?? {};
        const userAgent = req.headers["user-agent"];
        const ip = getClientIp(req);

        if (!email) return res.status(400).json({ message: "Email is required" });
        if (!code) return res.status(400).json({ message: "Code is required" });
        if (!userAgent) return res.status(400).json({ message: "User agent is required" });

        const result = await authService.verifyEmail({ email, code, userAgent, ip });

        res.cookie("refreshToken", result.refreshToken, cookieConfig);

        return res.status(200).json({
            message: "Email verified successfully",
            accessToken: result.accessToken,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        const userAgent = req.headers["user-agent"];
        const ip = getClientIp(req);

        const result = await authService.login({ email, password, userAgent, ip });

        res.cookie("refreshToken", result.refreshToken, cookieConfig);

        return res.status(200).json({
            message: "Login successful",
            accessToken: result.accessToken,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout({ refreshToken });

        res.clearCookie("refreshToken", cookieConfig);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};
exports.logoutAll = async (req, res, next) => {
    try {
        const userId = req.userId;

        const result = await authService.logoutAll(userId);

        res.clearCookie("refreshToken", cookieConfig);

        res.status(200).json({
            message: "All sessions revoked",
            revokedCount: result.modifiedCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.googleAuth = async (req, res, next) => {
    try {
        const { accessToken: token } = req.body ?? {};
        const userAgent = req.headers["user-agent"];

        const result = await authService.googleAuth({ token, userAgent });

        res.cookie("refreshToken", result.refreshToken, cookieConfig);

        if (result.isNewUser) {
            return res.status(201).json({
                message: "Account registered successfully",
                redirect: `https://my-mapa.by/register?third=${encodeURIComponent(result.user.email)}`,
                accessToken: result.accessToken,
                user: {
                    id: result.user.id,
                    username: result.user.username,
                },
            });
        }

        res.status(200).json({
            message: "Google authentication successful",
            accessToken: result.accessToken,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const userAgent = req.headers["user-agent"];

        const tokens = await authService.refreshToken({ refreshToken, userAgent });

        res.cookie("refreshToken", tokens.refreshToken, cookieConfig);

        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: tokens.accessToken,
        });
    } catch (err) {
        res.clearCookie("refreshToken", cookieConfig);
        next(err);
    }
};

/**
 */
exports.revokeRefreshTokenFromUser = async (req, res, next) => {
    try {
        const { userId } = req.body ?? {};
        const currentUserRole = req.userRole;

        const result = await authService.revokeRefreshTokenFromUser({ userId, currentUserRole });

        res.status(200).json({
            message: "User tokens revoked",
            revokedCount: result.revokedCount,
        });
    } catch (error) {
        if (error.message === "USER_NOT_FOUND" || error.message === "FORBIDDEN_ROLE_HIERARCHY") {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

/**
 */
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body ?? {};
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const ip = getClientIp(req);

        const result = await authService.sendResetPasswordEmail({ email, ip });

        return res.status(200).json({
            message: result.isResent
                ? "Reset password email sent successfully"
                : "Код для сброса пароля уже был отправлен ранее.",
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.verifyResetCode = async (req, res, next) => {
    try {
        const { email, code } = req.body ?? {};
        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are required" });
        }

        const ip = getClientIp(req);

        const result = await authService.verifyResetCode({ email, code, ip });

        res.cookie("resetToken", result.resetToken, cookieConfig);

        return res.status(200).json({ resetToken: result.resetToken });
    } catch (error) {
        next(error);
    }
};

/**
 */
exports.confirmPasswordReset = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { password } = req.body ?? {};

        await authService.resetPassword({ userId, newPassword: password });

        res.clearCookie("resetToken", cookieConfig);

        return res.status(200).json({
            message: "Password has been successfully reset. Please log in with your new password.",
        });
    } catch (error) {
        next(error);
    }
};
