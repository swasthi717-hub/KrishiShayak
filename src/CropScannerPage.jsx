import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Leaf,
  CheckCircle2,
  Eye,
  Loader2,
  Save,
  Volume2,
  AlertCircle,
} from "lucide-react";

import Layout from "./Layout.jsx";

import {
  loadDiseaseModel,
  detectDisease,
} from "./services/diseasedetection.js";

import { getDiseaseExplanation } from "./services/gemini.js";
import { supabase } from "./lib/supabase";
import { queueTableWrite } from "./sync/queueAction";

import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

const TIPS = [
  "Take photo in natural daylight",
  "Focus on the affected leaf clearly",
  "Include both healthy and diseased parts",
  "Avoid blurry or dark photos",
  "Capture a single leaf close-up",
];

const SEVERITY_THEME = {
  Mild: "bg-yellow-100 text-yellow-800",
  Moderate: "bg-orange-100 text-orange-700",
  Severe: "bg-red-100 text-red-700",
};

const UI_TEXT = [
  "Crop Scanner",
  "AI Crop Health Scanner",
  "Upload or Capture Leaf Photo",
  "JPG, PNG, WEBP · Max 10MB",
  "Choose Photo",
  "Tips for Best Results",
  ...TIPS,
  "Analyze Leaf",
  "Analyzing...",
  "Loading disease model...",
  "No photo uploaded yet",
  "Upload a leaf photo to get instant disease analysis",
  "Detection Result",
  "Confidence:",
  "Save Scan",
  "AI Explanation",
  "Read explanation aloud",
  "Recent Scans",
  "No saved scans yet.",
  "Crop",
  "Please choose an image smaller than 10MB.",
  "Please choose a JPG, PNG, or WEBP image.",
  "Unable to analyze this image.",
  "Unable to load the selected image.",
  "Unable to save disease scan.",
  "There is no confident disease result to save.",
  "Please log in first.",
  "Disease scan saved — syncing now.",
  "Saved offline — will sync automatically once you're back online.",
  "Unable to confidently identify this disease. Please upload a clearer leaf photo.",
  "AI explanation unavailable offline. Connect to the internet to get treatment and prevention guidance.",
  "The disease was detected, but the detailed AI explanation is currently unavailable.",
  "Disease detection model is still loading. Please wait.",
];

const SPEECH_LANGUAGES = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  or: "or-IN",
};

function parseConfidenceFromNotes(notes) {
  const match = /\(([\d.]+)% confidence\)/.exec(notes || "");
  return match ? Number(match[1]) : null;
}

export default function CropScannerPage() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const { language } = useLanguage();

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [disease, setDisease] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [severity, setSeverity] = useState("Moderate");

  const [explanation, setExplanation] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [farmId, setFarmId] = useState(null);

  const [message, setMessage] = useState("");
  const [modelError, setModelError] = useState("");

  const [recentScans, setRecentScans] = useState([]);

  const [translations, setTranslations] = useState(() => {
    const initial = {};
    UI_TEXT.forEach((text) => {
      initial[text] = text;
    });
    return initial;
  });

  const t = (text) => translations[text] || text;

  /*
   * =========================================================
   * TRANSLATION
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function translatePage() {
      if (!language || language === "en") {
        const english = {};
        UI_TEXT.forEach((text) => {
          english[text] = text;
        });

        if (!cancelled) {
          setTranslations(english);
        }
        return;
      }

      try {
        const translated = await translateTexts(
          UI_TEXT,
          language,
          "en"
        );

        if (cancelled) return;

        const result = {};
        UI_TEXT.forEach((text, index) => {
          result[text] = translated[index] || text;
        });

        setTranslations(result);
      } catch (error) {
        console.error("Crop Scanner translation failed:", error);
      }
    }

    translatePage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  /*
   * =========================================================
   * LOAD DISEASE MODEL
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function initializeDiseaseModel() {
      try {
        setModelLoading(true);
        setModelError("");

        await loadDiseaseModel();

        if (!cancelled) {
          setModelReady(true);
        }
      } catch (error) {
        console.error("Disease model loading failed:", error);

        if (!cancelled) {
          setModelReady(false);
          setModelError(
            error?.message ||
              "Unable to load the disease detection model."
          );
        }
      } finally {
        if (!cancelled) {
          setModelLoading(false);
        }
      }
    }

    initializeDiseaseModel();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================================
   * LOAD FARM + CROP + RECENT SCANS
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadFarmData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user || cancelled) return;

        const {
          data: farm,
          error: farmError,
        } = await supabase
          .from("farms")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (farmError) throw farmError;

        if (farm && !cancelled) {
          setFarmId(farm.id);

          const {
            data: cropData,
            error: cropError,
          } = await supabase
            .from("crops")
            .select("name")
            .eq("farm_id", farm.id)
            .limit(1)
            .maybeSingle();

          if (cropError) throw cropError;

          if (cropData && !cancelled) {
            setSelectedCrop(cropData.name);
          }
        }

        const {
          data: scans,
          error: scansError,
        } = await supabase
          .from("disease_reports")
          .select("id, crop_name, notes, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (scansError) throw scansError;

        if (!cancelled) {
          setRecentScans(scans || []);
        }
      } catch (error) {
        console.error("Failed to load scanner data:", error);
      }
    }

    loadFarmData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================================
   * FILE SELECTION
   * =========================================================
   */

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setMessage("");
    setModelError("");

    if (file.size > 10 * 1024 * 1024) {
      setMessage(t("Please choose an image smaller than 10MB."));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        t("Please choose a JPG, PNG, or WEBP image.")
      );
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(url);
    setDisease(null);
    setConfidence(null);
    setSeverity("Moderate");
    setExplanation("");
    setMessage("");
  }

  /*
   * =========================================================
   * CLEAN PREVIEW URL
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
   * =========================================================
   * ANALYZE IMAGE
   * =========================================================
   */

  async function analyzeImage() {
    if (!selectedFile || !previewUrl) {
      setMessage(t("No photo uploaded yet"));
      return;
    }

    if (!modelReady) {
      setMessage(
        t("Disease detection model is still loading. Please wait.")
      );
      return;
    }

    setAnalyzing(true);
    setMessage("");
    setDisease(null);
    setConfidence(null);
    setSeverity("Moderate");
    setExplanation("");

    try {
      const image = new Image();

      image.onload = async () => {
        try {
          imageRef.current = image;

          const detection = await detectDisease(image);

          if (!detection) {
            throw new Error("Disease model returned no result.");
          }

          const diseaseName =
            detection.diseaseName ||
            detection.disease ||
            detection.label ||
            detection.name ||
            "Unknown";

          const numericConfidence = Number(
            detection.confidence
          );

          setDisease(diseaseName);
          setConfidence(
            Number.isFinite(numericConfidence)
              ? numericConfidence
              : null
          );
          setSeverity(
            detection.severity || "Moderate"
          );

          if (
            diseaseName === "Unknown" ||
            diseaseName === "Unknown disease"
          ) {
            setExplanation(
              t(
                "Unable to confidently identify this disease. Please upload a clearer leaf photo."
              )
            );
            return;
          }

          try {
            const explanationText =
              await getDiseaseExplanation(
                diseaseName,
                selectedCrop,
                language
              );

            setExplanation(
              explanationText ||
                t(
                  "The disease was detected, but the detailed AI explanation is currently unavailable."
                )
            );
          } catch (error) {
            console.error(
              "Gemini explanation failed:",
              error
            );

            setExplanation(
              t(
                "AI explanation unavailable offline. Connect to the internet to get treatment and prevention guidance."
              )
            );
          }
        } catch (error) {
          console.error(
            "Disease detection failed:",
            error
          );

          setMessage(
            t("Unable to analyze this image.")
          );
        } finally {
          setAnalyzing(false);
        }
      };

      image.onerror = () => {
        setAnalyzing(false);
        setMessage(
          t("Unable to load the selected image.")
        );
      };

      image.src = previewUrl;
    } catch (error) {
      console.error(error);
      setAnalyzing(false);
      setMessage(t("Unable to analyze this image."));
    }
  }

  /*
   * =========================================================
   * SAVE DISEASE RESULT
   * =========================================================
   */

  async function savePrediction() {
    try {
      setSaving(true);
      setMessage("");

      if (!disease || disease === "Unknown") {
        setMessage(
          t("There is no confident disease result to save.")
        );
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setMessage(t("Please log in first."));
        return;
      }

      const confidenceValue =
        Number.isFinite(Number(confidence))
          ? Number(confidence)
          : 0;

      const notes = `Detected: ${disease} (${confidenceValue}% confidence)`;

      const cropName = selectedCrop || disease;

      const recordId = await queueTableWrite({
        table: "disease_reports",
        operation: "insert",
        payload: {
          user_id: user.id,
          farm_id: farmId || undefined,
          crop_name: cropName,
          notes,
        },
      });

      setRecentScans((prev) =>
        [
          {
            id: recordId,
            crop_name: cropName,
            notes,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5)
      );

      setMessage(
        navigator.onLine
          ? t("Disease scan saved — syncing now.")
          : t(
              "Saved offline — will sync automatically once you're back online."
            )
      );
    } catch (error) {
      console.error(
        "Failed to save disease report:",
        error
      );

      setMessage(t("Unable to save disease scan."));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * SPEAK EXPLANATION
   * =========================================================
   */

  function speakExplanation() {
    if (
      !("speechSynthesis" in window) ||
      !explanation
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(explanation);

    speech.lang =
      SPEECH_LANGUAGES[language] || "en-IN";

    window.speechSynthesis.speak(speech);
  }

  const scanConfidence =
    parseConfidenceFromNotes;

  return (
    <Layout title={t("Crop Scanner")}>
      <h2 className="font-serif text-2xl font-bold text-[#24352a]">
        {t("AI Crop Health Scanner")}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* UPLOAD */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e8c9a0] bg-[#fbeee0] p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3d9b8] text-[#b5651d]">
              <Camera size={26} />
            </div>

            <p className="text-lg font-bold text-[#24352a]">
              {t("Upload or Capture Leaf Photo")}
            </p>

            <p className="text-sm text-slate-500">
              {t("JPG, PNG, WEBP · Max 10MB")}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-1 flex items-center gap-2 rounded-full bg-[#f0a664] px-5 py-2.5 text-sm font-semibold text-[#4a2e10] shadow-sm hover:bg-[#e5924a]"
            >
              <Upload size={16} />
              {t("Choose Photo")}
            </button>
          </div>

          {/* ERROR / MODEL STATUS */}
          {(message || modelError) && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{message || modelError}</span>
            </div>
          )}

          {/* TIPS */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <p className="flex items-center gap-2 font-bold text-[#24352a]">
              <Eye size={16} />
              {t("Tips for Best Results")}
            </p>

            <ul className="mt-3 space-y-2.5">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-center gap-2 text-sm text-[#3d4d40]"
                >
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-green-600"
                  />
                  {t(tip)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* IMAGE / RESULT */}
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-[#e5dfd2]">
            {previewUrl ? (
              <>
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Uploaded leaf"
                  className="max-h-56 w-full rounded-xl object-contain"
                />

                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={modelLoading || analyzing}
                  className="flex items-center gap-2 rounded-full bg-[#2f7357] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#245d46] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      {t("Analyzing...")}
                    </>
                  ) : (
                    <>
                      <Leaf size={16} />
                      {t("Analyze Leaf")}
                    </>
                  )}
                </button>

                {modelLoading && (
                  <p className="text-xs text-slate-500">
                    {t("Loading disease model...")}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1e7] text-slate-400">
                  <Leaf size={22} />
                </div>

                <p className="font-bold text-[#24352a]">
                  {t("No photo uploaded yet")}
                </p>

                <p className="text-sm text-slate-500">
                  {t(
                    "Upload a leaf photo to get instant disease analysis"
                  )}
                </p>
              </>
            )}

            {/* DETECTION RESULT */}
            {disease && (
              <div className="mt-3 w-full rounded-2xl bg-[#f4f1e7] p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("Detection Result")}
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#24352a]">
                      {disease}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_THEME[severity] ||
                      SEVERITY_THEME.Moderate
                    }`}
                  >
                    {severity}
                  </span>
                </div>

                {confidence !== null && (
                  <p className="mt-1 text-sm text-slate-500">
                    {t("Confidence:")}{" "}
                    {Number(confidence).toFixed(1)}%
                  </p>
                )}

                {disease !== "Unknown" &&
                  disease !== "Unknown disease" && (
                    <button
                      type="button"
                      onClick={savePrediction}
                      disabled={saving}
                      className="mt-3 flex items-center gap-2 rounded-full bg-[#2f7357] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={14} />
                      )}

                      {t("Save Scan")}
                    </button>
                  )}
              </div>
            )}

            {/* AI EXPLANATION */}
            {explanation && (
              <div className="mt-2 w-full rounded-2xl bg-white p-4 text-left ring-1 ring-[#e5dfd2]">
                <div className="flex items-center gap-2">
                  <Leaf
                    size={16}
                    className="text-[#2f7357]"
                  />

                  <p className="font-bold text-[#24352a]">
                    {t("AI Explanation")}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3d4d40]">
                  {explanation}
                </p>

                <button
                  type="button"
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#2f7357]"
                  onClick={speakExplanation}
                >
                  <Volume2 size={14} />
                  {t("Read explanation aloud")}
                </button>
              </div>
            )}

            {message && (
              <p className="text-xs font-medium text-[#2f7357]">
                {message}
              </p>
            )}
          </div>

          {/* RECENT SCANS */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <p className="font-bold text-[#24352a]">
              {t("Recent Scans")}
            </p>

            <div className="mt-3 space-y-1">
              {recentScans.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  {t("No saved scans yet.")}
                </p>
              ) : (
                recentScans.map((scan) => {
                  const confidenceValue =
                    scanConfidence(scan.notes);

                  return (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-[#f7f5ee]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1e7] text-[#1f5b3d]">
                          <Leaf size={16} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#24352a]">
                            {scan.crop_name ||
                              t("Crop")}
                          </p>

                          <p className="text-xs text-slate-500">
                            {scan.created_at
                              ? new Date(
                                  scan.created_at
                                ).toLocaleDateString()
                              : "--"}
                          </p>
                        </div>
                      </div>

                      {confidenceValue !== null && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            confidenceValue >= 80
                              ? SEVERITY_THEME.Mild
                              : confidenceValue >= 60
                              ? SEVERITY_THEME.Moderate
                              : SEVERITY_THEME.Severe
                          }`}
                        >
                          {confidenceValue}%
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
