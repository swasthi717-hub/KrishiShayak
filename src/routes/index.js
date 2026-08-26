const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
