const express = require("express");
const cropController = require("../controllers/crop.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  validateCreateCrop,
  validateUpdateCrop,
  validateCropIdParam,
  validateCropQuery,
} = require("../validators/crop.validator");

const router = express.Router();

router.use(requireAuth);
router.post("/", validateCreateCrop, cropController.createCrop);
router.get("/", validateCropQuery, cropController.listCrops);
router.get("/:id", validateCropIdParam, cropController.getCrop);
router.put("/:id", validateCropIdParam, validateUpdateCrop, cropController.updateCrop);
router.delete("/:id", validateCropIdParam, cropController.deleteCrop);

module.exports = router;
