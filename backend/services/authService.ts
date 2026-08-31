import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { UPLOADS_DIR } from "../config/paths";
import User from "../models/User";
import axios from "axios";
import { isBlacklisted } from "./blacklistService";
import { ensureUsernameAvailable } from "./userProfileService";
import { generateTemporaryResetJwt, revokeUserRefreshTokens } from "./tokenService";
import { sendVerificationEmail as sendEmailService, sendResetPasswordEmail } from "./emailService";
import { createRefreshToken, generateAccessToken } from "./tokenService";
import { revokeRefreshToken } from "./tokenService";
import { findAvailableUsername } from "./userProfileService";
import { downloadImageToMemory, uploadAvatar } from "./imageService";
import { createAccessToken } from "./tokenService";
import { roleHierarchy } from "./roleHierarchy";
import { RegisterInput, VerifyEmailInput, VerifyEmailResult, LoginInput, LoginResult, GoogleAuthResult } from "../types/dto/auth.dto";
import { generateCode } from "../utils/generateCode";
import ApiError from "../utils/ApiError";
import redis from "../config/redis";
import rateLimit from "../lib/rate-limit/rateLimit";


export class AuthService {
    private OTP_TTL = 15 * 60;
    private COOLDOWN_TTL = 60;
    /**
     */
    private ensureNotDeleted(user: any): void {
        if (user && user.role === "deleted") {
            throw new Error("ACCOUNT_DELETED");
        }
    }

    /**
     */
    public async register(input: RegisterInput): Promise<{ userId: string }> {
        const { username, email, password } = input;
        const lowerCaseEmail = email.toLowerCase();

        const user = await User.findOne({ email: lowerCaseEmail });
        this.ensureNotDeleted(user);

        if (user) {
            throw new Error("EMAIL_ALREADY_USED");
        }

        let availableUsername: string;
        try {
            availableUsername = await ensureUsernameAvailable(username);
        } catch (validationError: any) {
            const error = new Error("USERNAME_VALIDATION_FAILED");
            (error as any).details = validationError.message;
            throw error;
        }

        if (await isBlacklisted(lowerCaseEmail)) {
            throw new Error("EMAIL_BLACKLISTED");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username: availableUsername,
            email: lowerCaseEmail,
            password: hashedPassword
        });

        const userFolder = path.join(UPLOADS_DIR, "users", newUser._id.toString());
        const eventsFolder = path.join(userFolder, "events");
        fs.mkdirSync(eventsFolder, { recursive: true });

        return { userId: newUser._id.toString() };
    }

    /**
     */
    public async getOtpCooldown(email: string): Promise<number> {
        const lowerCaseEmail = email.trim().toLowerCase();
        const cooldownKey = `otp:cooldown:email:${lowerCaseEmail}`;

        const remaining = await redis.ttl(cooldownKey);
        return remaining > 0 ? remaining : 0;
    }
    /**
     */
    public async sendVerificationEmail({
        email,
        ip
    }: {
        email: string;
        ip: string;
    }): Promise<{ isResent: boolean; cooldownRemaining: number }> {
        const lowerCaseEmail = email.trim().toLowerCase();

        const blockCheck = await rateLimit.checkSendOtpBlocked(ip, lowerCaseEmail, "verification");
        if (!blockCheck.isAllowed) {
            throw new ApiError(429, `Too many requests. Please try again in ${blockCheck.remainingSeconds} seconds.`, {
                retryAfter: blockCheck.remainingSeconds,
                code: "TOO_MANY_REQUESTS"
            } as any);;
        }

        const user = await User.findOne({ email: lowerCaseEmail });
        if (!user) throw new ApiError(404, "USER_NOT_FOUND");
        if (user.isVerified) throw new ApiError(400, "ALREADY_VERIFIED");

        const cooldownKey = `otp:cooldown:email:${lowerCaseEmail}`;
        const codeKey = `otp:code:email:${lowerCaseEmail}`;

        const cooldownRemaining = await redis.ttl(cooldownKey);
        if (cooldownRemaining > 0) {
            return {
                isResent: false,
                cooldownRemaining
            };
        }

        const limit = await rateLimit.recordSendOtpAttempt(ip, lowerCaseEmail, "verification");
        if (!limit.isAllowed) {
            throw new ApiError(429, `Too many requests. Please try again in ${limit.remainingSeconds} seconds.`, {
                retryAfter: limit.remainingSeconds,
                code: "TOO_MANY_REQUESTS"
            } as any);
        }

        const existingCode = await redis.get(codeKey);
        const codeToSend = existingCode || generateCode();

        await redis
            .multi()
            .set(codeKey, codeToSend, "EX", this.OTP_TTL)
            .set(cooldownKey, "1", "EX", this.COOLDOWN_TTL)
            .exec();

        await sendEmailService(user.email, codeToSend);

        return {
            isResent: true,
            cooldownRemaining: this.COOLDOWN_TTL
        };
    }

    /**
     */
    public async verifyEmail(input: VerifyEmailInput & { ip: string }) {
        const { email, code, userAgent, ip } = input;
        const lowerCaseEmail = email.trim().toLowerCase();

        const check = await rateLimit.checkVerifyOtpLimit(ip, lowerCaseEmail, "verification");
        if (!check.isAllowed) {
            throw new ApiError(
                429,
                `Too many verification-code attempts. You are blocked for ${check.remainingSeconds} seconds.`,
                { retryAfter: check.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
            );
        }

        const user = await User.findOne({ email: lowerCaseEmail });
        if (!user) {
            throw new ApiError(404, "USER_NOT_FOUND");
        }

        if (user.isVerified) {
            throw new ApiError(400, "ALREADY_VERIFIED");
        }

        const codeKey = `otp:code:email:${lowerCaseEmail}`;
        const cooldownKey = `otp:cooldown:email:${lowerCaseEmail}`;

        const savedCode = await redis.get(codeKey);
        if (!savedCode) {
            throw new ApiError(400, "CODE_EXPIRED");
        }

        if (String(savedCode) !== String(code).trim()) {
            const failedResult = await rateLimit.recordFailedOtp(ip, lowerCaseEmail, "verification");

            if (failedResult.isBlockedNow) {
                throw new ApiError(
                    429,
                    `Invalid code. You exceeded the attempt limit and are blocked for ${failedResult.remainingSeconds} seconds.`,
                    { retryAfter: failedResult.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
                );
            }

            throw new ApiError(400, "INVALID_CODE");
        }

        await rateLimit.resetOtpLimits(ip, lowerCaseEmail, "verification");

        user.isVerified = true;
        await user.save();
        await redis.del(codeKey, cooldownKey);

        const refreshToken = await createRefreshToken(user._id, userAgent);
        const accessToken = generateAccessToken(user._id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
            },
        };
    }

    /**
     */
    public async login(input: LoginInput & { ip: string }): Promise<LoginResult> {
        const { email, password, userAgent, ip } = input;
        const lowerCaseEmail = (email || "").trim().toLowerCase();

        const limit = await rateLimit.emailLogin(ip, lowerCaseEmail);

        if (!limit.isAllowed) {
            throw new ApiError(
                429,
                `Too many requests. Please try again in ${limit.remainingSeconds} seconds.`,
                { retryAfter: limit.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
            );
        }

        const retryAfter = limit.remainingSeconds;

        try {
            if (!userAgent) throw new ApiError(400, "MISSING_USER_AGENT");
            if (typeof email !== "string" || typeof password !== "string") throw new ApiError(400, "INVALID_INPUT_TYPES");
            if (!lowerCaseEmail || password.length === 0) throw new ApiError(400, "EMPTY_CREDENTIALS");

            const user = await User.findOne({ email: lowerCaseEmail });
            if (!user) throw new ApiError(404, "USER_NOT_FOUND");
            if (user.role === "deleted") throw new ApiError(400, "ACCOUNT_DELETED");

            const storedPasswordHash = typeof user.password === "string" && user.password.length > 0
                ? user.password
                : null;

            const isPasswordValid = storedPasswordHash ? await bcrypt.compare(password, storedPasswordHash) : false;

            if (!isPasswordValid) {
                throw new ApiError(401, "INVALID_CREDENTIALS");
            }

            await rateLimit.resetLoginLimits(ip, lowerCaseEmail);

            const refreshToken = await createRefreshToken(user._id, userAgent);
            const accessToken = generateAccessToken(user._id);

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    bio: user.bio,
                    isPayed: user.isPayed,
                    type: user.type,
                    payedUntil: user.payedUntil,
                },
            };

        } catch (error) {

            if (retryAfter > 0) {
                throw new ApiError(
                    429,
                    `Too many login attempts. Please try again in ${retryAfter} seconds.`,
                    { retryAfter, code: "TOO_MANY_REQUESTS" } as any
                );
            }
            throw error;
        }
    }

    /**
     */
    public async logout(refreshToken?: string): Promise<void> {

        if (!refreshToken) {
            throw new Error("REFRESH_TOKEN_REQUIRED");
        }

        const result = await revokeRefreshToken(refreshToken);

        if (!result || !result.modifiedCount) {
            throw new Error("TOKEN_NOT_FOUND");
        }
    }

    public async logoutAll(userId: string): Promise<{ modifiedCount: number }> {
        const result = await revokeUserRefreshTokens(userId);
        return { modifiedCount: result?.modifiedCount || 0 };
    }

    /**
     */
    public async googleAuth({ token, userAgent }: { token?: string, userAgent?: string }): Promise<GoogleAuthResult> {

        if (!token || typeof token !== "string") {
            throw new ApiError(400, "GOOGLE_TOKEN_REQUIRED");
        }
        if (!userAgent) {
            throw new ApiError(400, "MISSING_USER_AGENT");
        }

        let googleUserData;
        try {
            const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` },
            });
            googleUserData = userInfoResponse.data;
        } catch (error) {
            throw new ApiError(400, "INVALID_GOOGLE_TOKEN");
        }

        const { sub: googleId, email, email_verified: emailVerified, name: username, picture: profilePicture } = googleUserData;

        if (emailVerified !== true) {
            throw new ApiError(400, "GOOGLE_EMAIL_NOT_VERIFIED");
        }

        if (await isBlacklisted(email)) {
            throw new ApiError(403, "EMAIL_BLACKLISTED");
        }

        let user = await User.findOne({ email });
        this.ensureNotDeleted(user);

        if (user && user.authType !== "google") {
            throw new ApiError(400, "EMAIL_REGISTERED_WITH_PASSWORD");
        }

        let isNewUser = false;

        if (!user) {
            const fallbackName = username || email?.split("@")[0] || "User";
            const availableUsername = await findAvailableUsername(fallbackName);

            user = await User.create({
                username: availableUsername,
                email,
                password: null,
                authType: "google",
                googleId,
                isVerified: true,
            });

            if (profilePicture) {
                try {
                    const avatar = await downloadImageToMemory(profilePicture);
                    user.profilePicture = await uploadAvatar(user._id, avatar);
                    await user.save();
                } catch (avatarError) {
                    console.error("[ERROR] Failed to upload Google avatar:", avatarError);
                }
            }

            isNewUser = true;
        }

        const refreshToken = await createRefreshToken(user._id, userAgent);
        const accessToken = generateAccessToken(user._id);

        return {
            accessToken,
            refreshToken,
            isNewUser,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                bio: user.bio,
                isPayed: user.isPayed,
                type: user.type,
                payedUntil: user.payedUntil //? new Date(user.payedUntil) : null,
            },
        };
    }

    public async refreshToken({ refreshToken, userAgent }: { refreshToken?: string, userAgent?: string }): Promise<{ accessToken: string, refreshToken: string }> {

        if (!refreshToken) {
            throw new ApiError(401, "REFRESH_TOKEN_REQUIRED");
        }
        if (!userAgent) {
            throw new ApiError(400, "MISSING_USER_AGENT");
        }

        const tokens = await createAccessToken(refreshToken, userAgent);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    /**
     */
    public async revokeRefreshTokenFromUser({ userId, currentUserRole }: { userId: string, currentUserRole: string }): Promise<{ revokedCount: number }> {

        const user = await User.findById(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        const isHigher = roleHierarchy(currentUserRole, user.role, { higherOnly: true });
        const isSuperAdmin = roleHierarchy(currentUserRole, "superadmin", { strict: true });

        if (!isHigher && !isSuperAdmin) {
            throw new Error("FORBIDDEN_ROLE_HIERARCHY");
        }

        const result = await revokeUserRefreshTokens(userId);

        return {
            revokedCount: result?.modifiedCount || 0
        };
    }

    /** 
     */
    public async sendResetPasswordEmail({
        email,
        ip
    }: {
        email: string;
        ip: string;
    }): Promise<{ isResent: boolean; cooldownRemaining: number }> {
        const lowerCaseEmail = email.trim().toLowerCase();

        const blockCheck = await rateLimit.checkSendOtpBlocked(ip, lowerCaseEmail, "password_reset");
        if (!blockCheck.isAllowed) {
            throw new ApiError(
                429,
                `Too many requests. Please try again in ${blockCheck.remainingSeconds} seconds.`,
                { retryAfter: blockCheck.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
            );
        }

        if (await isBlacklisted(lowerCaseEmail)) {
            throw new ApiError(400, "EMAIL_BLACKLISTED");
        }

        const user = await User.findOne({ email: lowerCaseEmail });
        if (!user) {
            throw new ApiError(404, "USER_NOT_FOUND");
        }

        const codeKey = `otp:code:reset:${lowerCaseEmail}`;
        const cooldownKey = `otp:cooldown:reset:${lowerCaseEmail}`;

        const cooldownRemaining = await redis.ttl(cooldownKey);
        if (cooldownRemaining > 0) {
            return {
                isResent: false,
                cooldownRemaining
            };
        }

        const limit = await rateLimit.recordSendOtpAttempt(ip, lowerCaseEmail, "password_reset");
        if (!limit.isAllowed) {
            throw new ApiError(
                429,
                `Too many requests. Please try again in ${limit.remainingSeconds} seconds.`,
                { retryAfter: limit.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
            );
        }

        const existingCode = await redis.get(codeKey);
        const codeToSend = existingCode || generateCode();

        await redis
            .multi()
            .set(codeKey, codeToSend, "EX", this.OTP_TTL)
            .set(cooldownKey, "1", "EX", this.COOLDOWN_TTL)
            .exec();

        await sendResetPasswordEmail(user.email, codeToSend);

        return {
            isResent: true,
            cooldownRemaining: this.COOLDOWN_TTL
        };
    }

    /**
     */
    public async verifyResetCode({
        email,
        code,
        ip
    }: {
        email: string;
        code: string;
        ip: string;
    }): Promise<{ resetToken: string }> {
        const lowerCaseEmail = email.trim().toLowerCase();
        const codeKey = `otp:code:reset:${lowerCaseEmail}`;

        const blockCheck = await rateLimit.checkVerifyOtpLimit(ip, lowerCaseEmail, "password_reset");
        if (!blockCheck.isAllowed) {
            throw new ApiError(
                429,
                `Too many requests. Please try again in ${blockCheck.remainingSeconds} seconds.`,
                { retryAfter: blockCheck.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
            );
        }

        const user = await User.findOne({ email: lowerCaseEmail });
        if (!user) {
            throw new ApiError(404, "USER_NOT_FOUND");
        }

        const storedCode = await redis.get(codeKey);
        if (!storedCode) {
            throw new ApiError(400, "CODE_EXPIRED");
        }

        if (storedCode !== code.trim()) {
            const failedAttempt = await rateLimit.recordFailedOtp(ip, lowerCaseEmail, "password_reset");

            if (failedAttempt.isBlockedNow) {
                throw new ApiError(
                    429,
                    `Too many attempts. You are blocked for ${failedAttempt.remainingSeconds} seconds.`,
                    { retryAfter: failedAttempt.remainingSeconds, code: "TOO_MANY_REQUESTS" } as any
                );
            }

            throw new ApiError(400, "INVALID_CODE");
        }

        await Promise.all([
            rateLimit.resetOtpLimits(ip, lowerCaseEmail, "password_reset"),
            redis.del(codeKey)
        ]);

        const resetToken = generateTemporaryResetJwt(user._id);

        return { resetToken };
    }

    /**
     */
    public async resetPassword({
        userId,
        newPassword
    }: {
        userId?: string;
        newPassword?: string;
    }): Promise<void> {
        if (!userId) {
            throw new ApiError(401, "UNAUTHORIZED");
        }

        if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length === 0) {
            throw new ApiError(400, "PASSWORD_REQUIRED");
        }

        if (newPassword.length < 6) {
            throw new ApiError(400, "PASSWORD_TOO_SHORT");
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "USER_NOT_FOUND");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        await revokeUserRefreshTokens(user._id);

        if (process.env.DEBUG === "true") {
            console.log(`[DEBUG] Password successfully reset for user ${user._id}`);
        }
    }
}
