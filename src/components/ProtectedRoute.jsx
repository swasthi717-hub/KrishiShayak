import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        setOnboardingDone(null);
        return;
      }

      setCheckingOnboarding(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("ProtectedRoute profile error:", error);

        setOnboardingDone(false);
        setCheckingOnboarding(false);
        return;
      }

      console.log(
        "ProtectedRoute onboarding status:",
        data?.onboarding_completed
      );

      setOnboardingDone(data?.onboarding_completed === true);
      setCheckingOnboarding(false);
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  if (loading || checkingOnboarding) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User has not completed onboarding.
  // They are allowed to stay on the onboarding page.
  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // User has completed onboarding.
  // Don't allow them to return to onboarding.
  if (onboardingDone && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;