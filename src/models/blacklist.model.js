const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: [true, "Token is required to blacklist"],
            unique: [true, "Token is already blacklisted"],
        },
    },
    { timestamps: true },
);

tokenBlacklistSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 3 },
); // Expire after 72 hours


const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema);

module.exports = tokenBlacklistModel;