const express = require("express");
const farmController = require("../controllers/farm.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  validateCreateFarm,
  validateUpdateFarm,
  validateFarmIdParam,
} = require("../validators/farm.validator");

const router = express.Router();

router.use(requireAuth);
router.post("/", validateCreateFarm, farmController.createFarm);
router.get("/", farmController.listFarms);
router.get("/:id", validateFarmIdParam, farmController.getFarm);
router.put("/:id", validateFarmIdParam, validateUpdateFarm, farmController.updateFarm);
router.delete("/:id", validateFarmIdParam, farmController.deleteFarm);

module.exports = router;
