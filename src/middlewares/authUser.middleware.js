const { validationResult } = require("express-validator");


module.exports.validateUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            messge: errors.array()
        });
    }

    return next();

}