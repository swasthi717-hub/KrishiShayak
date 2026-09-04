import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Profile is still being loaded
  if (!profile) {
    return <div>Loading...</div>;
  }

  const onboardingDone = profile.onboarding_completed === true;

  // User has not completed onboarding
  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // User has completed onboarding
  // Do not allow them to return to onboarding
  if (onboardingDone && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;