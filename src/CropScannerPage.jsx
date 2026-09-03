import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Leaf,
  CheckCircle2,
  Eye,
  ScanSearch,
  Loader2,
  AlertCircle,
} from "lucide-react";

import Layout from "./Layout.jsx";

import {
  loadDiseaseModel,
  detectDisease,
} from "./services/diseasedetection.js";

import {
  getDiseaseExplanation,
} from "./services/gemini.js";

const TIPS = [
  "Take photo in natural daylight",
  "Focus on the affected leaf clearly",
  "Include both healthy and diseased parts",
  "Avoid blurry or dark photos",
  "Capture a single leaf close-up",
];

const RECENT_SCANS = [
  {
    crop: "Cotton",
    disease: "Bacterial Blight",
    time: "Yesterday",
    severity: "Mild",
  },
  {
    crop: "Tomato",
    disease: "Early Blight",
    time: "3 days ago",
    severity: "Moderate",
  },
];

const SEVERITY_THEME = {
  Mild: "bg-yellow-100 text-yellow-800",
  Moderate: "bg-orange-100 text-orange-700",
  Severe: "bg-red-100 text-red-700",
};

export default function CropScannerPage() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  const [isAnalysing, setIsAnalysing] = useState(false);

  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState("");

  const [error, setError] = useState("");

  // -----------------------------------------------------------
  // LOAD DISEASE MODEL
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // FILE
  // -----------------------------------------------------------

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
    setResult(null);
    setExplanation("");
    setError("");
  }

  // -----------------------------------------------------------
  // CLEAN PREVIEW URL
  // -----------------------------------------------------------

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // -----------------------------------------------------------
  // ANALYSE
  // -----------------------------------------------------------

  async function handleAnalyse() {
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

    setIsAnalysing(true);
    setError("");
    setResult(null);
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

      setResult(detection);

      // Supports the new ONNX response as well as
      // the previous response field names.
      const diseaseName =
        detection.diseaseName ||
        detection.disease ||
        detection.label ||
        detection.name ||
        "Unknown disease";

      try {
        const explanationText =
          await getDiseaseExplanation(
            diseaseName,
            "Unknown",
            "en"
          );

        setExplanation(explanationText);
      } catch (geminiError) {
        console.error(
          "Disease explanation failed:",
          geminiError
        );

        setExplanation(
          "The disease was detected, but the detailed AI explanation is currently unavailable."
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
      setIsAnalysing(false);
    }
  }

  // -----------------------------------------------------------
  // RESULT DATA
  // -----------------------------------------------------------

  const diseaseName =
    result?.diseaseName ||
    result?.disease ||
    result?.label ||
    result?.name ||
    "";

  const confidence = Number(result?.confidence);

  // ONNX disease service returns confidence already
  // as a percentage, e.g. 85.42 → "85.4%".
  const confidenceText = Number.isFinite(confidence)
    ? `${confidence.toFixed(1)}%`
    : result?.confidenceText || "--";

  const severity =
    result?.severity || "Moderate";

  return (
    <Layout title="Crop Scanner">
      <h2 className="font-serif text-2xl font-bold text-[#24352a]">
        AI Crop Health Scanner
      </h2>

      {/* =======================================================
          DISCLAIMER
      ======================================================= */}

      <div className="mt-3 rounded-xl border border-[#e5dfd2] bg-[#f7f5ee] px-4 py-3 text-xs leading-5 text-slate-500">
        <span className="font-semibold text-[#59645c]">
          Disclaimer:
        </span>{" "}
        AI-generated disease assessments and recommendations are
        for informational purposes only. Please do not rely on
        them blindly; consult a qualified agricultural expert or
        relevant professional before taking major treatment or
        crop-management decisions.
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* LEFT */}

        <div className="space-y-5">

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

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

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

        {/* RIGHT */}

        <div className="space-y-5">

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
                  onClick={handleAnalyse}
                  disabled={
                    !modelReady ||
                    modelLoading ||
                    isAnalysing
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1f5b3d] px-5 py-3 text-sm font-bold text-white hover:bg-[#173b27] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalysing ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Analysing Leaf...
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
                      Analyse Leaf
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

          </div>

          {/* RESULT */}

          {result && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

              <div className="flex items-start justify-between gap-3">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#2f7357]">
                    AI Diagnosis
                  </p>

                  <h3 className="mt-1 font-serif text-xl font-bold text-[#24352a]">
                    {diseaseName}
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

              {explanation && (
                <div className="mt-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-[#2f7357]">
                    AI Explanation
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3d4d40]">
                    {explanation}
                  </p>

                </div>
              )}

            </div>
          )}

          {/* RECENT */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <p className="font-bold text-[#24352a]">
              Recent Scans
            </p>

            <div className="mt-3 space-y-1">
              {RECENT_SCANS.map((scan) => (
                <div
                  key={`${scan.crop}-${scan.disease}`}
                  className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-[#f7f5ee]"
                >
                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f1e7] text-[#1f5b3d]">
                      <Leaf size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#24352a]">
                        {scan.crop} — {scan.disease}
                      </p>

                      <p className="text-xs text-slate-500">
                        {scan.time}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_THEME[
                        scan.severity
                      ] || ""
                    }`}
                  >
                    {scan.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}