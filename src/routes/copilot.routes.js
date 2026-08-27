const express = require("express");
const copilotController = require("../controllers/copilot.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateSendMessage, validateConversationIdParam } = require("../validators/copilot.validator");

const router = express.Router();

router.use(requireAuth);
router.get("/conversations", copilotController.listConversations);
router.get("/conversations/:id", validateConversationIdParam, copilotController.getConversation);
router.delete("/conversations/:id", validateConversationIdParam, copilotController.deleteConversation);
router.post("/messages", validateSendMessage, copilotController.sendMessage);

module.exports = router;