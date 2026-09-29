const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");

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

        req.user = user;

        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Unautnorized access, invalid access",
        });
    }
}

module.exports = {
    authMiddleware,
};
