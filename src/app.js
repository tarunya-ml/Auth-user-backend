const cookieParser = require("cookie-parser");
const express = require("express");
const connectDB = require("./config/database");
const userRoute = require("./routes/user.route");
const morganLogger = require("./middlewares/morganLogger.middleware");
const logger = require("./config/logger");


// instance of the server
const app = express();


// middlewares
app.use(express.json());
app.use(morganLogger);  // log all HTTP requests
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/user", userRoute);

// ✅ Global error handler — must be LAST, after all routes
app.use((err, req, res, next) => {
    logger.error(err);  // logs full stack trace to error.log
    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
});


const port =  process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(port, () => {
            logger.info(`server is running on ${port}`);

        });

    }
    catch (err) {
        logger.error(err);
        process.exit(1);  //exit process if DB connection fails
    }
}


module.exports = startServer;