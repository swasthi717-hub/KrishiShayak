const express = require("express");
const yieldPredictionController = require("../controllers/yieldPrediction.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validatePredictRequest, validatePredictionIdParam } = require("../validators/yieldPrediction.validator");

const router = express.Router();

router.use(requireAuth);
router.post("/", validatePredictRequest, yieldPredictionController.predict);
router.get("/", yieldPredictionController.listPredictions);
router.get("/:id", validatePredictionIdParam, yieldPredictionController.getPrediction);

module.exports = router;