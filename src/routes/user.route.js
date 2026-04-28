const express = require("express");
const router = express.Router();
const authController = require("../controllers/user.controller");
const { registerUserValidation, loginUserValidation }
    = require("../validations/authUser.validation");
const { validateUser } = require("../middlewares/authUser.middleware");


// register user API
router.post("/register-user", registerUserValidation, validateUser, authController.register);


//login user API
router.post("/login-user", loginUserValidation, validateUser, authController.login);

// verify-otp API
router.post("/verify-otp",authController.verify_Otp);




module.exports = router;