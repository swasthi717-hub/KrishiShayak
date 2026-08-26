const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const { validateSignup, validateLogin } = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", authLimiter, validateSignup, authController.signup);
router.post("/login", authLimiter, validateLogin, authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.me);

module.exports = router;
