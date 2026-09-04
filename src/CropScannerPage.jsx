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
  ScanSearch,
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

function parseConfidenceFromNotes(notes) {
  const match = /\(([\d.]+)% confidence\)/.exec(notes || "");
  return match ? Number(match[1]) : null;
}

export default function CropScannerPage() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [disease, setDisease] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [severity, setSeverity] = useState("Moderate");

  const [explanation, setExplanation] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("");
  const [farmId, setFarmId] = useState(null);

  const [recentScans, setRecentScans] = useState([]);

  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD DISEASE MODEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function initializeDiseaseModel() {
      try {
        setModelLoading(true);
        setError("");

        await loadDiseaseModel();

        if (!cancelled) {
          setModelReady(true);
        }
      } catch (err) {
        console.error(
          "Disease model loading failed:",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
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
   * ---------------------------------------------------------
   * LOAD FARM + CROP + RECENT SCANS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadFarmData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          return;
        }

        const {
          data: farm,
          error: farmError,
        } = await supabase
          .from("farms")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (farmError) {
          throw farmError;
        }

        if (farm) {
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

          if (cropError) {
            throw cropError;
          }

          if (cropData) {
            setSelectedCrop(cropData.name);
          }
        }

        /*
         * Load actual saved disease scans.
         *
         * This intentionally uses disease_reports rather than
         * the old disease_predictions table.
         */

        const {
          data: scans,
          error: scansError,
        } = await supabase
          .from("disease_reports")
          .select(
            "id, crop_name, notes, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (scansError) {
          throw scansError;
        }

        setRecentScans(scans || []);
      } catch (err) {
        console.error(
          "Failed to load scanner data:",
          err
        );
      }
    }

    loadFarmData();
  }, []);

  /*
   * ---------------------------------------------------------
   * FILE SELECTION
   * ---------------------------------------------------------
   */

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "The image is larger than 10MB. Please choose a smaller image."
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please choose a JPG, PNG, or WEBP image."
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

    setError("");
    setMessage("");
  }

  /*
   * ---------------------------------------------------------
   * CLEAN PREVIEW URL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
   * ---------------------------------------------------------
   * ANALYZE IMAGE
   * ---------------------------------------------------------
   */

  async function analyzeImage() {
    if (!selectedFile) {
      setError("Please upload a leaf photo first.");
      return;
    }

    if (!modelReady) {
      setError(
        "Disease detection model is still loading. Please wait."
      );
      return;
    }

    if (!imageRef.current) {
      setError(
        "The uploaded image is not ready yet. Please try again."
      );
      return;
    }

    setAnalyzing(true);
    setError("");
    setMessage("");
    setDisease(null);
    setConfidence(null);
    setExplanation("");

    try {
      const detection = await detectDisease(
        imageRef.current
      );

      if (!detection) {
        throw new Error(
          "The disease model returned no result."
        );
      }

      /*
       * Support multiple possible response shapes
       * from the disease detection service.
       */

      const diseaseName =
        detection.diseaseName ||
        detection.disease ||
        detection.label ||
        detection.name ||
        "Unknown";

      const detectedConfidence = Number(
        detection.confidence
      );

      const detectedSeverity =
        detection.severity || "Moderate";

      setDisease(diseaseName);

      if (Number.isFinite(detectedConfidence)) {
        setConfidence(detectedConfidence);
      } else {
        setConfidence(null);
      }

      setSeverity(detectedSeverity);

      /*
       * Unknown result should not be sent to Gemini.
       */

      if (
        diseaseName === "Unknown" ||
        diseaseName === "Unknown disease"
      ) {
        setExplanation(
          "Unable to confidently identify this disease. Please upload a clearer leaf photo."
        );

        return;
      }

      /*
       * Disease classification happens locally.
       *
       * Gemini is only used to generate the explanation,
       * treatment and prevention guidance.
       */

      try {
        const text = await getDiseaseExplanation(
          diseaseName,
          selectedCrop || "Unknown"
        );

        setExplanation(text);
      } catch (geminiError) {
        console.error(
          "Gemini explanation failed:",
          geminiError
        );

        setExplanation(
          "AI explanation unavailable offline. Connect to the internet to get treatment and prevention guidance."
        );
      }
    } catch (err) {
      console.error(
        "Disease analysis failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to analyse this leaf image."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SAVE DISEASE RESULT
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * This uses queueTableWrite instead of directly inserting
   * into Supabase.
   *
   * Therefore:
   *   Online  -> queued and synced to Supabase
   *   Offline -> saved locally and synced later
   *
   * The table used is disease_reports.
   * ---------------------------------------------------------
   */

  async function savePrediction() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!disease || disease === "Unknown") {
        setMessage(
          "There is no confident disease result to save."
        );
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setMessage("Please log in first.");
        return;
      }

      const confidenceValue =
        Number.isFinite(Number(confidence))
          ? Number(confidence)
          : 0;

      const notes = `Detected: ${disease} (${confidenceValue}% confidence)`;

      const cropName =
        selectedCrop || "Unknown Crop";

      const recordId = await queueTableWrite({
        table: "disease_reports",
        operation: "insert",
        payload: {
          user_id: user.id,
          farm_id: farmId || null,
          crop_name: cropName,
          notes,
        },
      });

      /*
       * Optimistically update Recent Scans.
       *
       * queueTableWrite may save locally first when offline,
       * so we create the local representation immediately.
       */

      setRecentScans((prev) =>
        [
          {
            id: recordId,
            crop_name: cropName,
            notes,
            created_at:
              new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5)
      );

      setMessage(
        navigator.onLine
          ? "Disease scan saved — syncing now."
          : "Saved offline — will sync automatically once you're back online."
      );
    } catch (err) {
      console.error(
        "Failed to save disease report:",
        err
      );

      setError(
        "Unable to save disease scan."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * CONFIDENCE DISPLAY
   * ---------------------------------------------------------
   */

  const confidenceText =
    Number.isFinite(Number(confidence))
      ? `${Number(confidence).toFixed(1)}%`
      : "--";

  /*
   * ---------------------------------------------------------
   * READ EXPLANATION ALOUD
   * ---------------------------------------------------------
   */

  function readExplanationAloud() {
    if (
      !explanation ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        explanation
      );

    speech.lang = "hi-IN";

    window.speechSynthesis.speak(
      speech
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <Layout title="Crop Scanner">
      <h2 className="font-serif text-2xl font-bold text-[#24352a]">
        AI Crop Health Scanner
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
              Upload or Capture Leaf Photo
            </p>

            <p className="text-sm text-slate-500">
              JPG, PNG, WEBP · Max 10MB
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
              Choose Photo
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>

            </div>
          )}

          {/* TIPS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <p className="flex items-center gap-2 font-bold text-[#24352a]">
              <Eye size={16} />
              Tips for Best Results
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

                  {tip}
                </li>
              ))}

            </ul>

          </div>

        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-5">

          {/* IMAGE / ANALYSIS */}

          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-[#e5dfd2]">

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
                  disabled={
                    !modelReady ||
                    modelLoading ||
                    analyzing
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1f5b3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#173b27] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {analyzing ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Analyzing Leaf...
                    </>
                  ) : modelLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Loading AI Model...
                    </>
                  ) : (
                    <>
                      <ScanSearch size={17} />

                      Analyze Leaf
                    </>
                  )}

                </button>

              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1e7] text-slate-400">
                  <Leaf size={22} />
                </div>

                <p className="font-bold text-[#24352a]">
                  No photo uploaded yet
                </p>

                <p className="text-sm text-slate-500">
                  Upload a leaf photo to get instant disease analysis
                </p>
              </>
            )}

            {modelLoading && (
              <p className="text-xs text-slate-500">
                Loading disease detection model...
              </p>
            )}

          </div>

          {/* RESULT */}

          {disease && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-[#2f7357]">
                    AI Diagnosis
                  </p>

                  <h3 className="mt-1 font-serif text-xl font-bold text-[#24352a]">
                    {disease}
                  </h3>

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

              <div className="mt-4 rounded-xl bg-[#f4f8ef] p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Confidence
                </p>

                <p className="mt-1 text-2xl font-bold text-[#2f7357]">
                  {confidenceText}
                </p>

              </div>

              {disease !== "Unknown" && (
                <button
                  type="button"
                  onClick={savePrediction}
                  disabled={saving}
                  className="mt-4 flex items-center gap-2 rounded-full bg-[#2f7357] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#245d46] disabled:opacity-60"
                >

                  {saving ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={14} />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Scan"}

                </button>
              )}

              {explanation && (
                <div className="mt-4">

                  <div className="flex items-center gap-2">

                    <Leaf
                      size={16}
                      className="text-[#2f7357]"
                    />

                    <p className="font-bold text-[#24352a]">
                      AI Explanation
                    </p>

                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3d4d40]">
                    {explanation}
                  </p>

                  <button
                    type="button"
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#2f7357]"
                    onClick={readExplanationAloud}
                  >
                    <Volume2 size={14} />
                    Read explanation aloud
                  </button>

                </div>
              )}

            </div>
          )}

          {/* MESSAGE */}

          {message && (
            <p className="text-xs font-medium text-[#2f7357]">
              {message}
            </p>
          )}

          {/* RECENT SCANS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <p className="font-bold text-[#24352a]">
              Recent Scans
            </p>

            <div className="mt-3 space-y-1">

              {recentScans.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No saved scans yet.
                </p>
              ) : (
                recentScans.map((scan) => {

                  const scanConfidence =
                    parseConfidenceFromNotes(
                      scan.notes
                    );

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
                            {scan.crop_name || "Crop"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {new Date(
                              scan.created_at
                            ).toLocaleDateString()}
                          </p>

                        </div>

                      </div>

                      {scanConfidence !== null && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            scanConfidence >= 80
                              ? SEVERITY_THEME.Mild
                              : scanConfidence >= 60
                              ? SEVERITY_THEME.Moderate
                              : SEVERITY_THEME.Severe
                          }`}
                        >
                          {scanConfidence}%
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

