const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const otpService = require("../services/otp.service");
const logger=require("../config/logger");



module.exports.register = async (req, res, next) => {
    try {
        // console.log("Content-Type:", req.headers["content-type"]);
        const { name, email, phone, password } = req.body;

        const isUserExists = await userModel.findOne({ $or: [{ email }, { phone }] });
        if (isUserExists) {
            if (isUserExists.email === email) {
                return res.status(409).json({ message: `User already exists with ${email}` });
            }
            if (isUserExists.phone === phone) {
                return res.status(409).json({ message: `User already exists with ${phone}` });
            }
        }

        // create new user
        const user = await userService.createUser({ name, phone, email, password });

        // generate token
        const token = await user.generateToken();

        // save token in cookies
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            message: `Welcome ${name},You registered successfully`
        });
    }
    catch (err) {
        res.status(400).json({
            // message: "user registration failed!"
            message: err.message
        })
    }

}

// login user method
module.exports.login = async (req, res, next) => {
    const { phone, email, password } = req.body;

    // login user via email and password
    if (email && password) {
        logger.info(`login attempt with email and password ${req.body.email}`);
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(401).json({
                message: `invalid username or password!`
            });
        }

        if (password != user.password) {
            return res.status(401).json({
                message: "invalid username or password!"
            });
        }

        // generate token
        const token = await user.generateToken();

        // save token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        });

        logger.info(`Login successful for user with ${user._id}`);
        res.status(200).json({
            message: "Login successful!"
        });
    }

    //login user via email-otp
    else if (email) {
        logger.info(`login attempt with Email and Otp ${req.body.email}`);

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "invalid email!"
            });
        }

        // generate otp
        const otp = await otpService.generateOtp();

        // store otp in redis
        await otpService.storeOtp(null, email, otp);

        // send otp via message using twilio

        res.status(200).json({
            message: `otp sent on ${email}.`
        });
        logger.info(`Otp sent to user on ${email}`);
    }

    // login with phone number(otp)
    else if (phone) {
        logger.info(`login attempt with phone and Otp ${req.body.phone}`);

        const user = await userModel.findOne({ phone });
        if (!user) {
            return res.status(401).json({
                message: "invalid phone!"
            });
        }

        // generate otp
        const otp = await otpService.generateOtp();

        // store otp in redis
        await otpService.storeOtp(phone, null,otp);

        // send otp via message using twilio

        res.status(200).json({
            message: `otp sent on ${phone}.`
        });

        logger.info(`Otp sent to user on ${phone}`);
    }
}

// verify otp method
module.exports.verify_Otp = async (req, res, next) => {
    try {
        const { email, phone, otp } = req.body;

        const query = [];
        if (email) {
            query.push({ email })
            logger.info(`verify user otp via email `)
        };
        if (phone) {
            query.push({ phone: String(phone) });
            logger.info(`verify user otp via email `);
        }

        const user = await userModel.findOne({ $or: query });

        if (!user) {
            return res.status(409).json({
                message: "user not found!"
            });
        }

        // call verifyOtp 
        await otpService.verifyOtp({
        phone: phone ? String(phone) : undefined,
        email: email ? String(email) : undefined,
         otp: String(otp)
        });
        if(phone) logger.info(`otp verified successfully for: ${user.phone}`);
        if(email) logger.info(`otp verified successfully for: ${user.email}`);

        // generate token
        const token = await user.generateToken();
        logger.info(`Token generated successfully`);

        // store token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict"
        });

        res.status(200).json({
            message: `Login successful, welcome ${user.name}`
        });

        logger.info(`user login successfully ${user._id}`);
    }
    catch (err) {
        logger.error(err);
        res.status(400).json({
            // message: "otp verification failed!"
            message: err.message
        });
    }

}