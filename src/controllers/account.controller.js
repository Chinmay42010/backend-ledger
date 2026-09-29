const accountModel = require("../models/account.model");

/**
 *
 */

async function createAccountController(req, res) {
    try {
        const user = req.user;

        const account = await accountModel.create({
            user: user._id,
        });

        res.status(201).json({
            account,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error" });
    }
}

module.exports = {
    createAccountController,
};
