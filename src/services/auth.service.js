const { supabase, createUserClient } = require("../config/db");
const { ApiError } = require("../utils/errors");
const profileService = require("./profile.service");

function mapAuthError(error, fallbackMessage) {
  const message = error?.message || fallbackMessage;
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return ApiError.conflict("An account with this email already exists");
  }

  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return ApiError.unauthorized("Invalid email or password");
  }

  return new ApiError(400, message);
}

function serializeSession(authData, profile) {
  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    profile,
    session: authData.session
      ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          token_type: authData.session.token_type,
        }
      : null,
  };
}

async function signup({ email, password, name, phone, preferred_language }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || null,
        phone: phone || null,
        preferred_language: preferred_language || "hi",
      },
    },
  });

  if (error) {
    throw mapAuthError(error, "Unable to sign up");
  }

  if (!data.user) {
    throw ApiError.badRequest("Unable to create account");
  }

  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw ApiError.conflict("An account with this email already exists");
  }

  let profile = await profileService.getOrCreateProfile(data.user, {
    name,
    phone,
    preferred_language,
  });

  const signupUpdates = {};
  if (name !== undefined) signupUpdates.name = name;
  if (phone !== undefined) signupUpdates.phone = phone;
  if (preferred_language !== undefined) signupUpdates.preferred_language = preferred_language;

  if (Object.keys(signupUpdates).length) {
    try {
      profile = await profileService.updateProfile(data.user, signupUpdates);
    } catch (error) {
      if (error.statusCode !== 400) {
        throw error;
      }
    }
  }

  return serializeSession(data, profile);
}

async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw mapAuthError(error, "Unable to log in");
  }

  const profile = await profileService.getOrCreateProfile(data.user);
  return serializeSession(data, profile);
}

async function logout(accessToken) {
  const userClient = createUserClient(accessToken);
  const { error } = await userClient.auth.signOut();

  if (error) {
    throw new ApiError(400, error.message || "Unable to log out");
  }
}

async function getCurrentUser(user) {
  const profile = await profileService.getOrCreateProfile(user);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  };
}

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
};
