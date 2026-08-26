const express = require("express");
const { success } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", (req, res) => {
  return success(res, {
    message: "KrishiSahayak API is running",
    data: {
      service: "krishisahayak-api",
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
