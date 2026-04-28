const crypto = require("crypto");
const redis = require("../config/redis");
const logger = require("../config/logger");

// ── Constants ───────────────────────────────────────────────
const OTP_EXPIRY          = 5 * 60;   // 5 min — OTP validity
const SEND_WINDOW         = 10 * 60;  // 10 min — send rate limit window
const MAX_SEND_ATTEMPTS   = 3;        // max OTP sends per window
const MAX_VERIFY_ATTEMPTS = 5;        // max wrong attempts before OTP is killed

// generate otp method(helper)
module.exports.generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
};

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(String(otp).trim() + process.env.OTP_SECRET)
        .digest("hex");
};

const buildKey = (phone, email) => {
    if (phone) return `otp:${phone}`;
    if (email) return `otp:${email}`;
    return null;
};

//  Store OTP method 
module.exports.storeOtp = async (phone, email, otp) => {
    const key = buildKey(phone, email);

    if (!key) {
        throw new Error("Either phone or email is required to store OTP");
    }

    // Rate limit key: tracks how many times OTP was sent in SEND_WINDOW
    const sendLimitKey = `otp:send_limit:${phone || email}`;

    const attempts = await redis.incr(sendLimitKey);

    // Set expiry only on first attempt (don't reset window on each send)
    if (attempts === 1) {
        await redis.expire(sendLimitKey, SEND_WINDOW);
    }

    if (attempts > MAX_SEND_ATTEMPTS) {
        const ttl = await redis.ttl(sendLimitKey);
        logger.warn(`OTP send limit exceeded for: ${phone || email}`);

        const err = new Error(`Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minute(s).`);
        err.status = 429;
        throw err;
    }

    // Store hashed OTP + reset verify attempt counter
    const hashedOtp = hashOtp(otp);
    const verifyAttemptsKey = `otp:verify_attempts:${phone || email}`;

    await redis.setex(key, OTP_EXPIRY, hashedOtp);
    await redis.del(verifyAttemptsKey); // reset on fresh OTP

    logger.info(`OTP stored for: ${phone || email} (send attempt ${attempts}/${MAX_SEND_ATTEMPTS})`);
};

// Verify OTP (with attempt rate limit)
module.exports.verifyOtp = async ({ phone, email, otp }) => {
    const key = buildKey(phone, email);

    if (!key) {
        throw new Error("Either phone or email is required to verify OTP");
    }

    const verifyAttemptsKey = `otp:verify_attempts:${phone || email}`;

    // Check verify attempt count
    const attempts = await redis.incr(verifyAttemptsKey);

    // Sync verify attempt TTL with OTP TTL on first attempt
    if (attempts === 1) {
        await redis.expire(verifyAttemptsKey, OTP_EXPIRY);
    }

    if (attempts > MAX_VERIFY_ATTEMPTS) {
        // Kill the OTP — force user to request a new one
        await redis.del(key);
        await redis.del(verifyAttemptsKey);

        logger.warn(`OTP verify attempts exceeded for: ${phone || email} — OTP invalidated`);

        const err = new Error("Too many incorrect attempts. Please request a new OTP.");
        err.status = 429;
        throw err;
    }

    // Fetch stored OTP
    const storedHashedOtp = await redis.get(key);

    if (!storedHashedOtp) {
        logger.warn(`OTP expired or not found for: ${phone || email}`);
        throw new Error("OTP expired or not found");
    }

    // Timing-safe comparison
    const incomingHashedOtp = hashOtp(otp);
    const isMatch = crypto.timingSafeEqual(
        Buffer.from(incomingHashedOtp),
        Buffer.from(storedHashedOtp.trim())
    );

    if (!isMatch) {
        const remaining = MAX_VERIFY_ATTEMPTS - attempts;
        logger.warn(`Invalid OTP for: ${phone || email} — ${remaining} attempt(s) left`);

        const err = new Error(
            remaining > 0
                ? `Invalid OTP. ${remaining} attempt(s) remaining.`
                : "Invalid OTP."
        );
        err.status = 400;
        throw err;
    }

    // Success — clean up both keys
    await redis.del(key);
    await redis.del(verifyAttemptsKey);

    logger.info(`OTP verified successfully for: ${phone || email}`);
    return true;
};
