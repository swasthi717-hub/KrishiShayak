const { success } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const profileService = require("../services/profile.service");

const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user);
  return success(res, {
    message: "Profile retrieved",
    data: profile,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user, req.body);
  return success(res, {
    message: "Profile updated",
    data: profile,
  });
});

module.exports = {
  getProfile,
  updateProfile,
};
