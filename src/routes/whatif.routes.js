const express = require("express");
const whatIfController = require("../controllers/whatIf.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateWhatIfRequest } = require("../validators/whatIf.validator");

const router = express.Router();

router.use(requireAuth);
router.post("/", validateWhatIfRequest, whatIfController.simulate);

module.exports = router;