const { randomUUID } = require("crypto");
const path = require("path");
const { supabaseAdmin } = require("../config/db");
const diseaseModelProvider = require("../integrations/diseaseModel.provider");
const diseaseDetectionRepository = require("../repositories/diseaseDetection.repository");
const cropService = require("./crop.service");
const env = require("../config/env");
const { ApiError } = require("../utils/errors");

async function uploadImage(userId, file) {
  const ext = path.extname(file.originalname) || ".jpg";
  const objectPath = `${userId}/${randomUUID()}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(env.cropScanBucket)
    .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) {
    throw new ApiError(500, `Failed to upload scan image: ${error.message}`);
  }

  return objectPath;
}

async function submitScan(userId, { cropId }, file) {
  if (cropId) {
    await cropService.getOwnedCrop(userId, cropId);
  }

  const imagePath = await uploadImage(userId, file);

  let record = await diseaseDetectionRepository.insert({
    user_id: userId,
    crop_id: cropId || null,
    image_path: imagePath,
    image_metadata: { mimetype: file.mimetype, size: file.size, original_name: file.originalname },
    status: "pending",
  });

  try {
    const prediction = await diseaseModelProvider.predict({ buffer: file.buffer, mimetype: file.mimetype });
    record = await diseaseDetectionRepository.updateById(record.id, {
      status: "completed",
      prediction,
      model_version: prediction.model_version || null,
    });
    return record;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Disease detection failed";
    await diseaseDetectionRepository.updateById(record.id, { status: "failed", error_message: message });
    throw error instanceof ApiError ? error : new ApiError(500, message);
  }
}

async function getScan(userId, id) {
  const record = await diseaseDetectionRepository.findOwnedById(userId, id);
  if (!record) throw ApiError.notFound("Scan not found");
  return record;
}

async function listScans(userId, cropId) {
  return diseaseDetectionRepository.findByUserId(userId, cropId);
}

module.exports = { submitScan, getScan, listScans };