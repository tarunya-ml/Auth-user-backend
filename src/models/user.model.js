const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse:true
    },
    password: {
        type: String,
        required: true
    }
});


// method to generate token
userSchema.methods.generateToken = function () {
    const token = jwt.sign({
        id: this._id,
    }, process.env.JWTSECRET, {
        expiresIn: "24h"
    });

    return token;
}

// hash password method
userSchema.statics.hashPassword = (password) => {
    const salt = 10;
    return bcrypt.hash(password, salt);
}

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;