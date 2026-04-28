const morgan = require("morgan");
const logger = require("../config/logger");

// Stream morgan output into Winston
const stream = {
        write: (message) => logger.info(message.trim()),
};

const morganMiddleware = morgan(
    ":method :url :status :res[content-length] - :response-time ms",
    { stream }
);

module.exports = morganMiddleware;