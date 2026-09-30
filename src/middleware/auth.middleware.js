const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token is missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel
            .findById(decoded.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Unautnorized access, invalid access",
            });
        }

        const isBlacklisted = await tokenBlacklistModel.findOne({ token });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid",
            });
        }

        req.user = user;

        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Unautnorized access, invalid access",
        });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token is missing" });
    }

    let decoded;

    const isBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
        });
    }
    
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid or expired",
        });
    }

    try {
        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found",
            });
        }

        if (!user.systemUser) {
            return res
                .status(403)
                .json({ message: "Forbidden access, not a system user" });
        }

        req.user = user;

        return next();
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error",
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware,
};
