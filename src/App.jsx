
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { requestAndSaveFCMToken } from "./firebase";
import ProtectedRoute from "./components/ProtectedRoute";

import ResetPassword from "./ResetPassword";
import LandingPage from "./KrishiSahayakLanding.jsx";
import KrishiShayakDashboard from "./KrishiShayakDashboard.jsx";
import AiCopilotPage from "./AiCopilotPage.jsx";
import WeatherPage from "./WeatherPage.jsx";
import CropScannerPage from "./CropScannerPage.jsx";
import MandiMarketPage from "./MandiMarketPage.jsx";
import FarmDashboard from "./FarmDashboard.jsx";
import SmartAlertsPage from "./SmartAlertsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";


/*
 * Registers the current user's device for Firebase
 * push notifications.
 */
function FCMRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    requestAndSaveFCMToken(user.id);
  }, [user?.id]);

  return null;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        {/* Register device for FCM notifications after login */}
        <FCMRegistration />

        <Routes>

          {/* Landing Page */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Home / Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <KrishiShayakDashboard />
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

