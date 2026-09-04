import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./KrishiSahayakLanding.jsx";
import OnboardingPage from "./OnboardingPage.jsx";

import KrishiShayakDashboard from "./KrishiShayakDashboard.jsx";
import AiCopilotPage from "./AiCopilotPage.jsx";
import WeatherPage from "./WeatherPage.jsx";
import CropScannerPage from "./CropScannerPage.jsx";
import MandiMarketPage from "./MandiMarketPage.jsx";
import FarmDashboard from "./FarmDashboard.jsx";
import SmartAlertsPage from "./SmartAlertsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Home / Main Dashboard */}
        <Route path="/dashboard" element={<KrishiShayakDashboard />} />

        {/* AI Copilot */}
        <Route path="/ai-copilot" element={<AiCopilotPage />} />

        {/* Weather */}
        <Route path="/weather" element={<WeatherPage />} />

        {/* Crop Scanner */}
        <Route path="/crop-scanner" element={<CropScannerPage />} />

        {/* Mandi Market */}
        <Route path="/mandi-market" element={<MandiMarketPage />} />

        {/* Farm Dashboard */}
        <Route path="/farm-dashboard" element={<FarmDashboard />} />

        {/* Smart Alerts */}
        <Route path="/alerts" element={<SmartAlertsPage />} />

        {/* Profile */}
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}