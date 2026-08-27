const express = require("express");
const weatherController = require("../controllers/weather.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateFarmIdParam } = require("../validators/weather.validator");

const router = express.Router();

router.use(requireAuth);
router.get("/:farmId", validateFarmIdParam, weatherController.getFarmWeather);

module.exports = router;