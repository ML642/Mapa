const redis = require("../../config/redis");
const { createLogger } = require("../../services/createLogger");

const logger = createLogger({ fileName: "rateLimit.log" });

const PAIR_LIMIT = 5;
const IP_LIMIT = 50;

/**
 * Escalating block durations: 1-5 blocks last one minute, 6-10 last five
 * minutes, and subsequent blocks last fifteen minutes.
 */
function getBlockTime(blockCount) {
    if (blockCount > 10) return 15 * 60; // 15 minutes
    if (blockCount > 5) return 5 * 60;   // 5 minutes
    return 60;                           // 1 minute
}

/**
 * Atomically increments a Redis counter and creates a temporary block when
 * the effective limit is reached.
 */
async function applyLimit(key, limit, windowSeconds = 15 * 60) {
    const blockKey = `${key}:block`;
    const blocksCountKey = `${key}:blocks_count`;

    const blockedTtl = await redis.ttl(blockKey);
    if (blockedTtl > 0) {
        logger.warn({ key, ttl: blockedTtl }, "RATE_LIMIT_BLOCKED_REQUEST_REJECTED");
        return { isAllowed: false, count: null, remainingSeconds: blockedTtl };
    }

    const currentBlockCount = Number(await redis.get(blocksCountKey)) || 0;
    const effectiveLimit = currentBlockCount > 0 ? 1 : limit;

    const result = await redis
        .multi()
        .incr(key)
        .expire(key, windowSeconds, "NX")
        .exec();

    const newCount = Number(result?.[0]?.[1]) || 0;

    if (newCount >= effectiveLimit) {
        const blockCount = await redis.incr(blocksCountKey);
        await redis.expire(blocksCountKey, 60 * 60);

        const blockTime = getBlockTime(blockCount);

        await redis
            .multi()
            .set(blockKey, "1", "EX", blockTime)
            .del(key)
            .exec();

        logger.error(
            { key, count: newCount, effectiveLimit, blockTime, blockCount },
            "RATE_LIMIT_THRESHOLD_EXCEEDED_NEW_BLOCK_APPLIED"
        );

        return {
            isAllowed: true,
            count: newCount,
            remainingSeconds: blockTime,
        };
    }

    logger.debug({ key, count: newCount, limit: effectiveLimit }, "RATE_LIMIT_ATTEMPT_PASSED");
    return { isAllowed: true, count: newCount, remainingSeconds: 0 };
}

function mergeResults(...results) {
    const isAllowed = results.every((r) => r.isAllowed);
    const remainingSeconds = Math.max(...results.map((r) => r.remainingSeconds || 0));
    return { isAllowed, remainingSeconds };
}

const rateLimit = {
    /**
     * Limits login attempts by IP and email/IP pair.
     */
    async emailLogin(ip, email) {
        const normalizedEmail = email.trim().toLowerCase();
        const pair = await applyLimit(`rl:email:pair:${ip}:${normalizedEmail}`, PAIR_LIMIT);
        const ipOnly = await applyLimit(`rl:email:ip:${ip}`, IP_LIMIT);

        return mergeResults(pair, ipOnly);
    },

    /**
     * Limits account registrations by IP address.
     */
    async register(ip) {
        const ipOnly = await applyLimit(`rl:reg:ip:${ip}`, 3);
        return mergeResults(ipOnly);
    },

    /**
     * Clears login counters after a successful authentication.
     */
    async resetLoginLimits(ip, email) {
        const normalizedEmail = email.trim().toLowerCase();
        const pairKey = `rl:email:pair:${ip}:${normalizedEmail}`;

        await redis.del(
            pairKey,
            `${pairKey}:block`,
            `${pairKey}:blocks_count`
        );
    },
    /**
     * Checks whether OTP sending is blocked for the email or IP address.
     */
    async checkSendOtpBlocked(ip, email, scope = "verification") {
        const normalizedEmail = email.trim().toLowerCase();
        const emailBlockKey = `rl:otp:send:${scope}:email:${normalizedEmail}:block`;
        const ipBlockKey = `rl:otp:send:${scope}:ip:${ip}:block`;

        const [emailTtl, ipTtl] = await Promise.all([
            redis.ttl(emailBlockKey),
            redis.ttl(ipBlockKey),
        ]);

        const maxTtl = Math.max(emailTtl, ipTtl);
        if (maxTtl > 0) {
            return { isAllowed: false, remainingSeconds: maxTtl };
        }

        return { isAllowed: true, remainingSeconds: 0 };
    },

    /**
     * Records an OTP send attempt for the email and IP address.
     */
    async recordSendOtpAttempt(ip, email, scope = "verification") {
        const normalizedEmail = email.trim().toLowerCase();
        const emailLimit = await applyLimit(`rl:otp:send:${scope}:email:${normalizedEmail}`, 5);
        const ipLimit = await applyLimit(`rl:otp:send:${scope}:ip:${ip}`, 20);

        return mergeResults(emailLimit, ipLimit);
    },

    /**
     * Checks whether OTP code verification is blocked for the IP/email pair.
     */
    async checkVerifyOtpLimit(ip, email, scope = "verification") {
        const normalizedEmail = email.trim().toLowerCase();
        const blockKey = `rl:otp:verify:${scope}:pair:${ip}:${normalizedEmail}:block`;

        const blockedTtl = await redis.ttl(blockKey);
        if (blockedTtl > 0) {
            logger.warn({ ip, email: normalizedEmail, ttl: blockedTtl }, "OTP_VERIFY_BLOCKED_REQUEST_REJECTED");
            return { isAllowed: false, remainingSeconds: blockedTtl };
        }

        return { isAllowed: true, remainingSeconds: 0 };
    },

    /**
     * Records an unsuccessful OTP verification attempt.
     */
    async recordFailedOtp(ip, email, scope = "verification") {
        const normalizedEmail = email.trim().toLowerCase();
        const pairKey = `rl:otp:verify:${scope}:pair:${ip}:${normalizedEmail}`;

        const result = await applyLimit(pairKey, 5, 15 * 60);

        if (!result.isAllowed || result.remainingSeconds > 0) {
            return { isBlockedNow: true, remainingSeconds: result.remainingSeconds };
        }

        return { isBlockedNow: false, remainingSeconds: 0 };
    },

    /**
     * Clears OTP verification counters after a successful verification.
     */
    async resetOtpLimits(ip, email, scope = "verification") {
        const normalizedEmail = email.trim().toLowerCase();
        const pairKey = `rl:otp:verify:${scope}:pair:${ip}:${normalizedEmail}`;

        await redis.del(
            pairKey,
            `${pairKey}:block`,
            `${pairKey}:blocks_count`
        );
    }
};

module.exports = rateLimit;
export default rateLimit;
