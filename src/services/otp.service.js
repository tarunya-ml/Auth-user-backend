const crypto = require("crypto");
const redis = require("../config/redis");
const logger=require("../config/logger");

module.exports.generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log(otp);
    return otp;
};

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(String(otp).trim() + process.env.OTP_SECRET)
        .digest("hex");
};

const OTP_Expiry = 5 * 60;

module.exports.storeOtp = async (phone, email, otp) => {
    let key;
    if (phone) {
        key = `otp:${phone}`;
    } else if (email) {
        key = `otp:${email}`;
    }

    console.log("STORE key:", `otp:${phone || email}`);
    // if (!key) {
    //     throw new Error("Either phone or email is required to store OTP");
    // }

    const hashedOtp = hashOtp(otp);
    await redis.setex(key, OTP_Expiry, hashedOtp);
};

module.exports.verifyOtp = async ({ phone, email, otp }) => {

    let key;
    if (phone) {
        key = `otp:${phone}`;
    } else if (email) {
        key = `otp:${email}`;
    }
    console.log("VERIFY key:", `otp:${phone || email}`);

    if (!key) {
        throw new Error("Either phone or email is required to verify OTP");
    }

    const storedHashedOtp = await redis.get(key);
    console.log(storedHashedOtp);

    if (!storedHashedOtp) {
        logger.warn("otp expired or not found");
        
        throw new Error("OTP expired or not found");
    }

    const incomingHashedOtp = hashOtp(otp);

    const isMatch = crypto.timingSafeEqual(
        Buffer.from(incomingHashedOtp),
        Buffer.from(storedHashedOtp.trim())
    );

    if (!isMatch) {
        throw new Error("Invalid OTP");
        logger.info("Invalid otp from the user");
    }

    await redis.del(key);
    return true;
};