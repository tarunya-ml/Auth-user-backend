const userModel=require("../models/user.model");


module.exports.createUser = async ({ name, phone, email, password }) => {
    try {
        if (!name || !email || !phone || !password) {
            const error = new Error("All fields are required!");
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userModel.create({
            name, phone, email, password: hashedPassword
        });

        return user;
    } catch (err) {
        throw err;
    }
};