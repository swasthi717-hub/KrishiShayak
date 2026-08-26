const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  const message = result.session
    ? "Account created successfully"
    : "Account created. Confirm your email before logging in if email confirmation is enabled.";

  return success(res, {
    statusCode: 201,
    message,
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return success(res, {
    message: "Logged in successfully",
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.accessToken);
  return success(res, {
    message: "Logged out successfully",
    data: null,
  });
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user);
  return success(res, {
    message: "Current user",
    data: result,
  });
});

module.exports = {
  signup,
  login,
  logout,
  me,
};
