const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // ✅ All logs → app.log
        new transports.File({
            filename: path.join(__dirname, "../logs/app.log"),
        }),

        // ✅ Error logs → error.log
        new transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
        }),
    ],
});

module.exports = logger;