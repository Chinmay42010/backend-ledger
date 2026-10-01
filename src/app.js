const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

/**
 * Imported  routes
 */
const authRouter = require("./routes/auth.routes.js");
const accountRouter = require("./routes/account.routes.js");
const transactionRoutes = require("./routes/transaction.routes.js");

/**
 * Used routes
 */

app.get("/api/health", (req, res) => {
    res.send("Ledger service is up and running")
})
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);

module.exports = app;
