import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import ResetPassword from "./ResetPassword";
import LandingPage from "./KrishiSahayakLanding.jsx";
import OnboardingPage from "./OnboardingPage.jsx";
import KrishiSahayakDashboard from "./KrishiSahayakDashboard.jsx";
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
      <AuthProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Onboarding Page */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Home / Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <KrishiSahayakDashboard />
              </ProtectedRoute>
            }
          />

          {/* AI Copilot */}
          <Route
            path="/ai-copilot"
            element={
              <ProtectedRoute>
                <AiCopilotPage />
              </ProtectedRoute>
            }
          />

          {/* Weather */}
          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <WeatherPage />
              </ProtectedRoute>
            }
          />

          {/* Crop Scanner */}
          <Route
            path="/crop-scanner"
            element={
              <ProtectedRoute>
                <CropScannerPage />
              </ProtectedRoute>
            }
          />

          {/* Mandi Market */}
          <Route
            path="/mandi-market"
            element={
              <ProtectedRoute>
                <MandiMarketPage />
              </ProtectedRoute>
            }
          />

          {/* Farm Dashboard */}
          <Route
            path="/farm-dashboard"
            element={
              <ProtectedRoute>
                <FarmDashboard />
              </ProtectedRoute>
            }
          />

          {/* Smart Alerts */}
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <SmartAlertsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Reset Password */}
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
