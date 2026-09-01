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
} from "lucide-react";

import Layout from "./Layout.jsx";

import {
  loadDiseaseModel,
  detectDisease,
} from "./services/diseaseDetection";

import { getDiseaseExplanation } from "./services/gemini.js";

import { supabase } from "./lib/supabase";

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

export default function CropScannerPage() {
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageElement, setImageElement] = useState(null);

  const [disease, setDisease] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const [explanation, setExplanation] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");

  const [farmId, setFarmId] = useState(null);

  const [modelLoading, setModelLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [recentScans, setRecentScans] = useState([]);

  /*
   * ---------------------------------------------------------
   * LOAD DISEASE MODEL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function initializeModel() {
      try {
        setModelLoading(true);
        await loadDiseaseModel();
      } catch (error) {
        console.error("Disease model failed to load:", error);
      } finally {
        setModelLoading(false);
      }
    }

    initializeModel();
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

        if (userError) throw userError;

        if (!user) return;

        const { data: farm, error: farmError } = await supabase
          .from("farms")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (farmError) throw farmError;

        if (!farm) return;

        setFarmId(farm.id);

        const { data: cropData, error: cropError } = await supabase
          .from("crops")
          .select("name")
          .eq("farm_id", farm.id)
          .limit(1)
          .maybeSingle();

        if (cropError) throw cropError;

        if (cropData) {
          setSelectedCrop(cropData.name);
        }

        const { data: scans, error: scansError } = await supabase
          .from("disease_predictions")
          .select(
            "id, crop, disease_name, confidence, model_version, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (scansError) throw scansError;

        setRecentScans(scans || []);
      } catch (error) {
        console.error("Failed to load scanner data:", error);
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

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 10MB.");
      return;
    }

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);
    setDisease(null);
    setConfidence(null);
    setExplanation("");
    setMessage("");
  }

  /*
   * ---------------------------------------------------------
   * ANALYZE IMAGE
   * ---------------------------------------------------------
   */

  async function analyzeImage() {
    if (!previewUrl) return;

    try {
      setAnalyzing(true);
      setMessage("");

      const image = new Image();

      image.onload = async () => {
        try {
          setImageElement(image);

          const result = await detectDisease(image);

          setDisease(result.diseaseName);
          setConfidence(result.confidence);

          if (result.diseaseName === "Unknown") {
            setExplanation(
              "Unable to confidently identify this disease. Please upload a clearer leaf photo."
            );
            return;
          }

          /*
           * Gemini is only used for explanation.
           * Disease classification itself already happened locally.
           */

          try {
            const text = await getDiseaseExplanation(
              result.diseaseName,
              selectedCrop
            );

            setExplanation(text);
          } catch (error) {
            console.error("Gemini explanation failed:", error);

            setExplanation(
              "AI explanation unavailable offline. Connect to the internet to get treatment and prevention guidance."
            );
          }
        } catch (error) {
          console.error("Disease detection failed:", error);
          setMessage("Unable to analyze this image.");
        } finally {
          setAnalyzing(false);
        }
      };

      image.onerror = () => {
        setAnalyzing(false);
        setMessage("Unable to load the selected image.");
      };

      image.src = previewUrl;
    } catch (error) {
      console.error(error);
      setAnalyzing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SAVE DISEASE RESULT
   * ---------------------------------------------------------
   */

  async function savePrediction() {
    try {
      setSaving(true);
      setMessage("");

      if (!disease || disease === "Unknown") {
        setMessage("There is no confident disease result to save.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setMessage("Please log in first.");
        return;
      }

      const { data, error } = await supabase
        .from("disease_predictions")
        .insert({
          user_id: user.id,
          farm_id: farmId,
          crop: selectedCrop || null,
          disease_name: disease,
          confidence,
          model_version: "disease-v1",
        })
        .select()
        .single();

      if (error) throw error;

      setRecentScans((prev) => [data, ...prev].slice(0, 5));

      setMessage("Disease scan saved successfully.");
    } catch (error) {
      console.error("Failed to save disease prediction:", error);
      setMessage("Unable to save disease scan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Crop Scanner">
      <h2 className="font-serif text-2xl font-bold text-[#24352a]">
        AI Crop Health Scanner
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* LEFT COLUMN */}
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
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center gap-2 rounded-full bg-[#f0a664] px-5 py-2.5 text-sm font-semibold text-[#4a2e10] shadow-sm hover:bg-[#e5924a]"
            >
              <Upload size={16} />
              Choose Photo
            </button>
          </div>

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

          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-[#e5dfd2]">

            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Uploaded leaf"
                  className="max-h-56 w-full rounded-xl object-cover"
                />

                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={modelLoading || analyzing}
                  className="flex items-center gap-2 rounded-full bg-[#2f7357] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#245d46] disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Leaf size={16} />
                      Analyze Leaf
                    </>
                  )}
                </button>

                {modelLoading && (
                  <p className="text-xs text-slate-500">
                    Loading disease model...
                  </p>
                )}
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

            {disease && (
              <div className="mt-3 w-full rounded-2xl bg-[#f4f1e7] p-4 text-left">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Detection Result
                </p>

                <p className="mt-1 text-lg font-bold text-[#24352a]">
                  {disease}
                </p>

                {confidence !== null && (
                  <p className="mt-1 text-sm text-slate-500">
                    Confidence: {confidence}%
                  </p>
                )}

                {disease !== "Unknown" && (
                  <button
                    type="button"
                    onClick={savePrediction}
                    disabled={saving}
                    className="mt-3 flex items-center gap-2 rounded-full bg-[#2f7357] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Scan
                  </button>
                )}
              </div>
            )}

            {explanation && (
              <div className="mt-2 w-full rounded-2xl bg-white p-4 text-left ring-1 ring-[#e5dfd2]">
                <div className="flex items-center gap-2">
                  <Leaf size={16} className="text-[#2f7357]" />

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
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      window.speechSynthesis.cancel();

                      const speech = new SpeechSynthesisUtterance(
                        explanation
                      );

                      speech.lang = "hi-IN";
                      window.speechSynthesis.speak(speech);
                    }
                  }}
                >
                  <Volume2 size={14} />
                  Read explanation aloud
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
              Recent Scans
            </p>

            <div className="mt-3 space-y-1">

              {recentScans.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No saved scans yet.
                </p>
              ) : (
                recentScans.map((scan) => (
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
                          {scan.crop || "Crop"} — {scan.disease_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        Number(scan.confidence) >= 80
                          ? SEVERITY_THEME.Mild
                          : Number(scan.confidence) >= 60
                          ? SEVERITY_THEME.Moderate
                          : SEVERITY_THEME.Severe
                      }`}
                    >
                      {scan.confidence}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}