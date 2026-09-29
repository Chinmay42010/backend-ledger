const userModel = require("../models/user.models.js");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service.js");

/**
 * user register controller
 * POST api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password, and name are required",
                status: "Failed",
            });
        }

        const isExist = await userModel.findOne({
            email: email,
        });

        if (isExist) {
            return res.status(422).json({
                message: "User already exists with this email",
                status: "Failed",
            });
        }

        const user = await userModel.create({
            email,
            password,
            name,
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "3d",
        });

        res.cookie("token", token);

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token,
        });

        await emailService.sendRegistrationEmail(user.email, user.name);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Internal server error",
            status: "Failed",
        });
    }
}

/**
 * user login controller
 * POST api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Email or password is incorrect",
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is incorrect",
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "3d",
        });

        res.cookie("token", token);

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error) {}
}

module.exports = {
    userRegisterController,
    userLoginController,
};
