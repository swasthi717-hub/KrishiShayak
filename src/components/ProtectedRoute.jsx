import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (!user) {
        if (!cancelled) {
          setCheckingOnboarding(false);
          setOnboardingDone(false);
        }
        return;
      }

      setCheckingOnboarding(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error checking onboarding:", error);
        setOnboardingDone(false);
      } else {
        console.log(
          "Onboarding status:",
          data?.onboarding_completed
        );

        setOnboardingDone(
          data?.onboarding_completed === true
        );
      }

      setCheckingOnboarding(false);
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || checkingOnboarding) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User has NOT completed onboarding
  // → force them to onboarding
  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // User HAS completed onboarding
  // → don't allow them back into onboarding
  if (onboardingDone && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;