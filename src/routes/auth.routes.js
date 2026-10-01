const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller.js")
const authMiddleware = require("../middleware/auth.middleware.js");

// POST /api/auth/register
router.post("/register", authController.userRegisterController);

// POST /api/auth/login
router.post("/login", authController.userLoginController);

// POST /api/auth/logout
router.post("/logout", authMiddleware.authMiddleware, authController.userLogoutController);

module.exports = router;
