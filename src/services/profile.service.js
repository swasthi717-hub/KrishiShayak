const profileRepository = require("../repositories/profile.repository");
const { ALLOWED_FIELDS } = require("../validators/profile.validator");
const { ApiError } = require("../utils/errors");

function pickProfileFields(payload = {}) {
  const updates = {};

  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates[field] = payload[field] === "" ? null : payload[field];
    }
  });

  return updates;
}

async function getOrCreateProfile(user, extras = {}) {
  const existing = await profileRepository.findByUserId(user.id);
  if (existing) {
    return existing;
  }

  try {
    return await profileRepository.insert({
      user_id: user.id,
      name: extras.name || user.user_metadata?.name || null,
      phone: extras.phone || user.phone || user.user_metadata?.phone || null,
      preferred_language: extras.preferred_language || "hi",
    });
  } catch (error) {
    const alreadyExists = await profileRepository.findByUserId(user.id);
    if (alreadyExists) {
      return alreadyExists;
    }
    throw error;
  }
}

async function getProfile(user) {
  return getOrCreateProfile(user);
}

async function updateProfile(user, payload) {
  const updates = pickProfileFields(payload);

  if (!Object.keys(updates).length) {
    throw ApiError.badRequest("No valid profile fields provided");
  }

  await getOrCreateProfile(user, updates);

  const updated = await profileRepository.updateByUserId(user.id, updates);
  if (!updated) {
    throw ApiError.notFound("Profile not found");
  }

  return updated;
}

module.exports = {
  getProfile,
  updateProfile,
  getOrCreateProfile,
};
