const mongoose = require("mongoose");
const logger=require("../config/logger");

const connectDB = () => {
    try {
        mongoose.connect(process.env.MONGODB_CONNECTION_URI);
        logger.info("Database connected successfully");
    }
    catch (err) {
        logger.error(err || "database connection failed!");
    }
}

module.exports=connectDB;