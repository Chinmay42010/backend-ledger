const express = require("express");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message:
                "fromAccount, toAccount, amount and idempotencyKey are required",
        });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if (!fromUserAccount || toUserAccount) {
        return res.status(400).json({
            message: "Invalid from/to account details",
        });
    }

    
}
