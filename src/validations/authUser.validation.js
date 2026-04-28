const { body } = require("express-validator");

module.exports.registerUserValidation = [
    body("name")
        .trim()
        .isLength({ min: 3 })
        .withMessage("name must be greater than 3-characters"),
    body("phone")
        .isMobilePhone("en-IN")
        .withMessage("invalid phone number!"),
    body("email")
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("invalid email!"),
    body("password")
        .isLength({ min: 5 })
        .withMessage("please,set a strong password!")
],

    module.exports.loginUserValidation = [
        body("phone")
            .optional()
            .isMobilePhone("en-IN")
            .withMessage("not a valid phone number!"),
        body("email")
            .optional()
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage("invalid email format"),
        body("password")
            .optional()
    ]
