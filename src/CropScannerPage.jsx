import React, { useRef, useState } from "react";
import { Camera, Upload, Leaf, CheckCircle2, Eye } from "lucide-react";
import Layout from "./Layout.jsx";

import {
  loadDiseaseModel,
  detectDisease
} from "./services/diseasedetection.js";

import {
  getDiseaseExplanation
} from "./services/gemini";

const TIPS = [
  "Take photo in natural daylight",
  "Focus on the affected leaf clearly",
  "Include both healthy and diseased parts",
  "Avoid blurry or dark photos",
  "Capture a single leaf close-up",
];

const RECENT_SCANS = [
  { crop: "Cotton", disease: "Bacterial Blight", time: "Yesterday", severity: "Mild" },
  { crop: "Tomato", disease: "Early Blight", time: "3 days ago", severity: "Moderate" },
];

// Full colour classes spelled out (Tailwind can't build "bg-{x}-100" from a
// variable at build time -- see the ALERT_THEMES note in the dashboard file
// for the full explanation).
const SEVERITY_THEME = {
  Mild: "bg-yellow-100 text-yellow-800",
  Moderate: "bg-orange-100 text-orange-700",
  Severe: "bg-red-100 text-red-700",
};

export default function CropScannerPage() {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <Layout title="Crop Scanner">
      <h2 className="font-serif text-2xl font-bold text-[#24352a]">
        AI Crop Health Scanner
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e8c9a0] bg-[#fbeee0] p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3d9b8] text-[#b5651d]">
              <Camera size={26} />
            </div>
            <p className="text-lg font-bold text-[#24352a]">
              Upload or Capture Leaf Photo
            </p>
            <p className="text-sm text-slate-500">JPG, PNG, WEBP \u00B7 Max 10MB</p>

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
              <Upload size={16} /> Choose Photo
            </button>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <p className="flex items-center gap-2 font-bold text-[#24352a]">
              <Eye size={16} /> Tips for Best Results
            </p>
            <ul className="mt-3 space-y-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-center gap-2 text-sm text-[#3d4d40]">
                  <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-[#e5dfd2]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded leaf"
                className="max-h-56 w-full rounded-xl object-cover"
              />
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1e7] text-slate-400">
                  <Leaf size={22} />
                </div>
                <p className="font-bold text-[#24352a]">No photo uploaded yet</p>
                <p className="text-sm text-slate-500">
                  Upload a leaf photo to get instant disease analysis
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <p className="font-bold text-[#24352a]">Recent Scans</p>
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
                        {scan.crop} \u2014 {scan.disease}
                      </p>
                      <p className="text-xs text-slate-500">{scan.time}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_THEME[scan.severity]
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