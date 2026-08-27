const express = require("express");
const diseaseDetectionController = require("../controllers/diseaseDetection.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { singleImage } = require("../middleware/upload.middleware");
const {
  validateSubmitScan,
  validateScanIdParam,
  validateScanQuery,
} = require("../validators/diseaseDetection.validator");

const router = express.Router();

router.use(requireAuth);
router.post("/", singleImage("photo"), validateSubmitScan, diseaseDetectionController.submitScan);
router.get("/", validateScanQuery, diseaseDetectionController.listScans);
router.get("/:id", validateScanIdParam, diseaseDetectionController.getScan);

module.exports = router;