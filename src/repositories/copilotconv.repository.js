const { supabaseAdmin } = require("../config/db");
const { ApiError } = require("../utils/errors");

async function insert(conversation) {
  const { data, error } = await supabaseAdmin
    .from("copilot_conversations")
    .insert(conversation)
    .select("*")
    .single();
  if (error) throw new ApiError(500, `Failed to create conversation: ${error.message}`);
  return data;
}

async function findByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("copilot_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new ApiError(500, `Failed to list conversations: ${error.message}`);
  return data || [];
}

async function findOwnedById(userId, conversationId) {
  const { data, error } = await supabaseAdmin
    .from("copilot_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError(500, `Failed to load conversation: ${error.message}`);
  return data;
}

async function touch(conversationId) {
  const { error } = await supabaseAdmin
    .from("copilot_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw new ApiError(500, `Failed to update conversation: ${error.message}`);
}

async function deleteOwnedById(userId, conversationId) {
  const { error } = await supabaseAdmin
    .from("copilot_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) throw new ApiError(500, `Failed to delete conversation: ${error.message}`);
}

module.exports = { insert, findByUserId, findOwnedById, touch, deleteOwnedById };