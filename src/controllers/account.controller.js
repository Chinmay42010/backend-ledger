const accountModel = require("../models/account.model");

/**
 * 1. Create a new account for the authenticated user
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
        res.status(500).json({
            message: err.message || "Internal server error",
        });
    }
}

async function getUserAccountController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id });

        return res.status(200).json({
            message: "Fetched accounts successfully",
            accounts,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id,
        });

        if (!account) {
            return res.status(400).json({
                message: "Account not found",
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            accountId: account._id,
            balance: balance,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountController,
    getAccountBalanceController,
};
