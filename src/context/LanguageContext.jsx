import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user } = useAuth();

  const [language, setLanguageState] = useState(
    localStorage.getItem("krishi_language") || "en"
  );

  const [languageLoading, setLanguageLoading] = useState(true);

  // Load saved language from Supabase when user logs in
  useEffect(() => {
    const loadLanguage = async () => {
      if (!user) {
        setLanguageLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("user_id", user.id)
          .single();

        if (!error && data?.preferred_language) {
          setLanguageState(data.preferred_language);

          localStorage.setItem(
            "krishi_language",
            data.preferred_language
          );
        }
      } catch (error) {
        console.error("Failed to load language:", error);
      } finally {
        setLanguageLoading(false);
      }
    };

    loadLanguage();
  }, [user]);

  // Change language
  const setLanguage = async (newLanguage) => {
    // Update immediately in the frontend
    setLanguageState(newLanguage);

    // Save locally
    localStorage.setItem("krishi_language", newLanguage);

    // Save to Supabase if user is logged in
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_language: newLanguage,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Failed to save language preference:",
          error
        );
      }
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}