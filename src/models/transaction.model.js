const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        fromAccpunt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: [
                true,
                "Transaction must be associated with a from account",
            ],
            index: true,
        },
        toAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
            required: [
                true,
                "Transaction must be associated with a to account",
            ],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
                message:
                    "Status can either PENDING, COMPLETED, FAILED or REVERSED",
            },
            default: "PENDING",
        },
        amount: {
            type: Number,
            requires: [true, "Amount is required to make a transaction"],
            min: [0, "Transaction amount cannot be negative"],
        },
        idempotencyKey: {
            type: String,
            required: [
                true,
                "Idempotency key is required for creating a transaction",
            ],
            index: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    },
);

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
