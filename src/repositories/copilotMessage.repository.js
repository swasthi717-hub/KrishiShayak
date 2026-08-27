const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function insert(message) {
  const { data, error } = await supabaseAdmin.from("copilot_messages").insert(message).select("*").single();
  if (error) throw new ApiError(500, `Failed to save message: ${error.message}`);
  return data;
}

async function findByConversationId(conversationId, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("copilot_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new ApiError(500, `Failed to load messages: ${error.message}`);
  return data || [];
}

module.exports = { insert, findByConversationId };