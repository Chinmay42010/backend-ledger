const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");
const transctionModel = require("../models/transaction.model");

/**
 * - Create a new transaction
 * Transfer flow:
 * 1. Validate req
 * 2. validate idem key
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

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

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid from/to account details",
        });
    }

    /**
     * 2. Validate Idempotency Key
     */
    const isTransactionAlreadyExixts = await transctionModel.findOne({
        idempotencyKey: idempotencyKey,
    });

    if (isTransactionAlreadyExixts) {
        if (isTransactionAlreadyExixts.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExixts,
            });
        }

        if (isTransactionAlreadyExixts.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is Processing",
            });
        }

        if (isTransactionAlreadyExixts.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry!",
            });
        }

        if (isTransactionAlreadyExixts.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry!",
            });
        }
    }

    /**
     * 3. Check account status
     */
    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {
        return res.status(400).json({
            message:
                "fromAccount & toAccount must be ACTIVE to process the transaction",
        });
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient Balance. Current balance is ${balance}, requested amount is ${amount}`,
        });
    }

    /**
     * 5. Create transaction + ledger entries atomically
     */
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const transaction = (
            await transctionModel.create(
                [
                    {
                        fromAccount,
                        toAccount,
                        amount,
                        idempotencyKey,
                        status: "PENDING",
                    },
                ],
                { session },
            )
        )[0];
        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount,
                    transaction: transaction._id,
                    type: "DEBIT",
                },
            ],
            { session },
        );

        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount,
                    transaction: transaction._id,
                    type: "CREDIT",
                },
            ],
            { session },
        );

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        /**
         * 10. Send email notification
         */
        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            toAccount,
        );

        return res.status(200).json({
            message: "Transaction completed successfully",
            transaction: transaction,
        });
    } catch (err) {
        if (session) {
            await session.abortTransaction();
        }
        // Concurrent duplicate-submit race: pre-check passed on both
        // requests, unique index decided the winner at commit.
        if (err.code === 11000) {
            const existing = await transctionModel.findOne({
                idempotencyKey,
            });
            if (existing) {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existing,
                });
            }
        }
        return res.status(500).json({
            message: err.message || "Internal server error",
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount & idempotencyKey are required",
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if (!toUserAccount) {
        return res.status(400).json({
            message: "invalid toAccount",
        });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id,
    });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found",
        });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const transaction = new transctionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
        });

        const debitLedgerEntry = await ledgerModel.create(
            [
                {
                    account: fromUserAccount._id,
                    amount: amount,
                    transaction: transaction._id,
                    type: "DEBIT",
                },
            ],
            { session },
        );

        const creditLedgerEntry = await ledgerModel.create(
            [
                {
                    account: toUserAccount._id,
                    amount: amount,
                    transaction: transaction._id,
                    type: "CREDIT",
                },
            ],
            { session },
        );

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction,
        });
    } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({
            message: err.message || "Internal server error",
        });
    } finally {
        session.endSession();
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
};
