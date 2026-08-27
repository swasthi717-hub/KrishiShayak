const geminiProvider = require("../integrations/gemini.provider");
const conversationRepository = require("../repositories/copilotConversation.repository");
const messageRepository = require("../repositories/copilotMessage.repository");
const profileService = require("./profile.service");
const farmService = require("./farm.service");
const cropService = require("./crop.service");
const { ApiError } = require("../utils/errors");

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
};

async function buildSystemPrompt(user, language) {
  const profile = await profileService.getProfile(user);
  const farms = await farmService.listFarms(user.id);
  const crops = farms.length ? await cropService.listCrops(user.id) : [];

  const languageName = LANGUAGE_NAMES[language || profile.preferred_language] || "Hindi";

  const farmSummary = farms
    .map((f) => `${f.farm_name} (${f.area ?? "?"} ${f.area_unit}, ${f.state || ""} ${f.district || ""})`)
    .join("; ");
  const cropSummary = crops.map((c) => `${c.crop_name} (${c.growth_stage || "stage unknown"})`).join("; ");

  return [
    "You are KrishiSahayak, an AI farming copilot for Indian farmers.",
    "Answer only agriculture-related questions (crops, soil, weather, pests, fertilizer, market prices, government schemes).",
    "If asked something unrelated to farming, politely redirect to farming topics.",
    `Always respond in ${languageName}.`,
    "Keep answers practical and concise, suited for a farmer reading on a phone.",
    farmSummary ? `Farmer's farms: ${farmSummary}.` : "The farmer has not added any farms yet.",
    cropSummary ? `Farmer's current crops: ${cropSummary}.` : "The farmer has not added any crops yet.",
  ].join(" ");
}

async function listConversations(userId) {
  return conversationRepository.findByUserId(userId);
}

async function getConversation(userId, conversationId) {
  const conversation = await conversationRepository.findOwnedById(userId, conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  const messages = await messageRepository.findByConversationId(conversationId, 100);
  return { conversation, messages };
}

async function sendMessage(user, { conversationId, message, language }) {
  let conversation = conversationId ? await conversationRepository.findOwnedById(user.id, conversationId) : null;

  if (conversationId && !conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  if (!conversation) {
    conversation = await conversationRepository.insert({
      user_id: user.id,
      title: message.slice(0, 60),
      language: language || null,
    });
  }

  const history = await messageRepository.findByConversationId(conversation.id, 20);
  const systemPrompt = await buildSystemPrompt(user, language);

  const replyText = await geminiProvider.generateReply({
    systemPrompt,
    history,
    message,
  });

  await messageRepository.insert({
    conversation_id: conversation.id,
    role: "user",
    content: message,
    language: language || null,
  });

  const assistantMessage = await messageRepository.insert({
    conversation_id: conversation.id,
    role: "assistant",
    content: replyText,
    language: language || null,
  });

  await conversationRepository.touch(conversation.id);

  return { conversation, message: assistantMessage };
}

async function deleteConversation(userId, conversationId) {
  const conversation = await conversationRepository.findOwnedById(userId, conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  await conversationRepository.deleteOwnedById(userId, conversationId);
}

module.exports = { listConversations, getConversation, sendMessage, deleteConversation };