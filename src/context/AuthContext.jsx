import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { getFarmerProfile } from "../services/farmerProfile";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  // Basic profile data
  const [profile, setProfile] = useState(null);

  // Complete farmer data:
  // profile + farm + crops
  const [farmerData, setFarmerData] = useState(null);

  const [loading, setLoading] = useState(true);

  /**
   * Fetch complete farmer data from Supabase.
   *
   * Returns:
   * {
   *   profile,
   *   farm,
   *   crops
   * }
   */
  const fetchFarmerData = async (userId) => {
    if (!userId) {
      setProfile(null);
      setFarmerData(null);
      return null;
    }

    try {
      const data = await getFarmerProfile();

      setFarmerData(data);
      setProfile(data?.profile ?? null);

      return data;
    } catch (error) {
      console.error("Error fetching farmer data:", error);

      setProfile(null);
      setFarmerData(null);

      return null;
    }
  };

  /**
   * Refresh farmer data after onboarding/profile changes.
   */
  const refreshProfile = async () => {
    if (!user) {
      return null;
    }

    return await fetchFarmerData(user.id);
  };

  useEffect(() => {
    let mounted = true;

    // Get the current session when the app starts
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchFarmerData(session.user.id);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for login/logout/session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchFarmerData(session.user.id);
        } else {
          setProfile(null);
          setFarmerData(null);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        // Existing profile access
        profile,
        // New complete farmer data
        farmerData,
        loading,
        // Refresh after onboarding/profile updates
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
