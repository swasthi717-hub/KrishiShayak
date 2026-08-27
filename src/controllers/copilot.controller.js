const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const copilotService = require("../services/copilot.service");

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await copilotService.listConversations(req.user.id);
  return success(res, { message: "Conversations retrieved", data: conversations });
});

const getConversation = asyncHandler(async (req, res) => {
  const result = await copilotService.getConversation(req.user.id, req.params.id);
  return success(res, { message: "Conversation retrieved", data: result });
});

const sendMessage = asyncHandler(async (req, res) => {
  const result = await copilotService.sendMessage(req.user, req.body);
  return success(res, { statusCode: 201, message: "Message sent", data: result });
});

const deleteConversation = asyncHandler(async (req, res) => {
  await copilotService.deleteConversation(req.user.id, req.params.id);
  return success(res, { message: "Conversation deleted", data: null });
});

module.exports = { listConversations, getConversation, sendMessage, deleteConversation };