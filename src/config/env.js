const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback = undefined) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "*",

  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  weatherApiKey: optional("WEATHER_API_KEY"),
  weatherApiBaseUrl: optional("WEATHER_API_BASE_URL", "https://api.openweathermap.org/data/2.5"),

  geminiApiKey: optional("GEMINI_API_KEY"),
  geminiModel: optional("GEMINI_MODEL", "gemini-1.5-flash"),
  geminiApiBaseUrl: optional("GEMINI_API_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),

  mandiApiKey: optional("MANDI_API_KEY"),
  mandiApiBaseUrl: optional("MANDI_API_BASE_URL", "https://api.data.gov.in/resource"),
  mandiResourceId: optional("MANDI_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070"),

  firebaseProjectId: optional("FIREBASE_PROJECT_ID"),
  firebaseClientEmail: optional("FIREBASE_CLIENT_EMAIL"),
  firebasePrivateKey: optional("FIREBASE_PRIVATE_KEY"),

  diseaseModelEndpoint: optional("DISEASE_MODEL_ENDPOINT"),
  yieldModelEndpoint: optional("YIELD_MODEL_ENDPOINT"),

  cropScanBucket: optional("SUPABASE_CROP_SCAN_BUCKET", "crop-scans"),
};

module.exports = env;