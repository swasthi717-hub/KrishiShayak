const { supabase } = require("../config/db");
const { ApiError } = require("../utils/errors");
const asyncHandler = require("../utils/asyncHandler");

function extractBearerToken(header) {
  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw ApiError.unauthorized("Missing or invalid Authorization header");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  req.user = data.user;
  req.accessToken = token;
  next();
});

module.exports = {
  requireAuth,
};
