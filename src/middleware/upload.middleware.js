const multer = require("multer");
const { ApiError } = require("../utils/errors");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, matches frontend copy

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest("Only JPG, PNG, or WEBP images are allowed"));
    }
    cb(null, true);
  },
});

function singleImage(fieldName) {
  return function handleUpload(req, res, next) {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.badRequest("Image exceeds the 10MB size limit"));
        }
        return next(ApiError.badRequest(err.message));
      }
      if (err) return next(err);
      if (!req.file) return next(ApiError.badRequest("An image file is required"));
      next();
    });
  };
}

module.exports = { singleImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };