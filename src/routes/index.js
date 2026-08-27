const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");
const farmRoutes = require("./farm.routes");
const cropRoutes = require("./crop.routes");
const soilReportRoutes = require("./soilReport.routes");
const weatherRoutes = require("./weather.routes");
const copilotRoutes = require("./copilot.routes");
const mandiRoutes = require("./mandi.routes");
const fertilizerRoutes = require("./fertilizer.routes");
const diseaseDetectionRoutes = require("./diseaseDetection.routes");
const yieldPredictionRoutes = require("./yieldPrediction.routes");
const whatIfRoutes = require("./whatIf.routes");
const alertRoutes = require("./alert.routes");
const schemeRoutes = require("./scheme.routes");
const syncRoutes = require("./sync.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/farms", farmRoutes);
router.use("/crops", cropRoutes);
router.use("/soil-reports", soilReportRoutes);
router.use("/weather", weatherRoutes);
router.use("/copilot", copilotRoutes);
router.use("/mandi", mandiRoutes);
router.use("/fertilizer-recommendations", fertilizerRoutes);
router.use("/disease-detections", diseaseDetectionRoutes);
router.use("/yield-predictions", yieldPredictionRoutes);
router.use("/what-if", whatIfRoutes);
router.use("/alerts", alertRoutes);
router.use("/schemes", schemeRoutes);
router.use("/sync", syncRoutes);

module.exports = router;