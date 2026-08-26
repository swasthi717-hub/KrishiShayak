const express = require("express");
const profileController = require("../controllers/profile.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateProfileUpdate } = require("../validators/profile.validator");

const router = express.Router();

router.use(requireAuth);
router.get("/", profileController.getProfile);
router.put("/", validateProfileUpdate, profileController.updateProfile);

module.exports = router;
