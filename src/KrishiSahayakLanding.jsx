import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "./services/auth";
import {
  Leaf,
  Sparkles,
  Mic,
  CloudRain,
  Camera,
  TrendingUp,
  Sprout,
  Bell,
  MapPin,
  ArrowRight,
  X,
} from "lucide-react";

import { supabase } from "./lib/supabase";

/* ---------------------------------------------------------
   KrishiSahayak — Landing Page
--------------------------------------------------------- */

const COLORS = {
  green: "#145a3f",
  deep: "#0c3d2b",
  gold: "#e7ad32",
  cream: "#f8f3e7",
  paper: "#fffdf8",
  muted: "#647067",
  line: "#dfd8c8",
  ink: "#183128",
};

const FEATURES = [
  {
    icon: Mic,
    title: "AI Farming Copilot",
    desc: "Ask questions by text or voice and get guidance in regional languages.",
  },
  {
    icon: CloudRain,
    title: "Weather & Alerts",
    desc: "Stay prepared with local weather insights and proactive farm alerts.",
  },
  {
    icon: Camera,
    title: "Crop Health Scanner",
    desc: "Scan crop images for quick disease detection and helpful next steps.",
  },
  {
    icon: TrendingUp,
    title: "Mandi Market",
    desc: "Compare crop prices and market trends to make better selling decisions.",
  },
  {
    icon: Sprout,
    title: "Farm Dashboard",
    desc: "Track yield, farm health, and key insights in one personalised view.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Receive timely updates about weather, pests, disease, and market changes.",
  },
];

const TICKER_ITEMS = [
  { crop: "Tomato", price: "₹1,960/Q", change: "12.4%" },
  { crop: "Onion", price: "₹2,240/Q", change: null },
  { crop: "Cotton", price: "₹6,920/Q", change: "5.8%" },
  { crop: "Wheat", price: "₹2,380/Q", change: null },
];

function TickerContent() {
  return (
    <>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 700,
          color: "#f1c558",
          paddingLeft: 40,
          flexShrink: 0,
        }}
      >
        <MapPin size={14} /> LIVE MANDI PRICES
      </span>

      {TICKER_ITEMS.map((t, i) => (
        <span key={i} style={{ flexShrink: 0, marginLeft: 32 }}>
          {t.crop} {t.price}{" "}
          {t.change && (
            <b style={{ color: "#9be0a8" }}>▲ {t.change}</b>
          )}
        </span>
      ))}
    </>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        padding: 26,
        boxShadow: "0 8px 25px rgba(34,50,41,.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   AUTH MODAL
========================================================= */

function AuthModal({
  open,
  mode,
  setMode,
  onClose,
  onSuccess,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 9,
    border: `1px solid ${COLORS.line}`,
    background: "#faf7f0",
    fontSize: 14,
    marginBottom: 10,
    fontFamily: "'Inter', Arial, sans-serif",
    boxSizing: "border-box",
    outline: "none",
  };

  const handleAuth = async () => {
    setError("");

    /* -----------------------------
       VALIDATION
    ----------------------------- */

    if (forgotPassword) {
      if (!email.trim()) {
        setError("Please enter your email address.");
        return;
      }

      try {
        setLoading(true);

        await resetPassword(email);

        alert("Password reset link has been sent to your email.");

        setForgotPassword(false);
      } catch (err) {
        setError(err.message || "Unable to send reset link.");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         SIGN UP
      ===================================================== */

      if (mode === "signup") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                phone: phone.trim(),
              },
            },
          });

        if (signUpError) {
          throw signUpError;
        }

        if (!data?.user) {
          throw new Error(
            "Account could not be created. Please try again."
          );
        }

        /*
         * IMPORTANT:
         * Signup was successful.
         * Send the new user to onboarding, NOT dashboard.
         */
        onSuccess("signup");
        return;
      }

      /* =====================================================
         SIGN IN
      ===================================================== */

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        throw signInError;
      }

      if (!data?.user) {
        throw new Error(
          "Unable to sign in. Please check your credentials."
        );
      }

      /*
       * Existing user → Dashboard
       */
      onSuccess("signin");
    } catch (err) {
      console.error("Authentication error:", err);

      let message = err?.message || "Something went wrong.";

      /*
       * Make Supabase errors a little more user-friendly.
       */
      if (
        message.toLowerCase().includes("rate limit")
      ) {
        message =
          "Too many email requests. Please wait a while and try again.";
      }

      if (
        message.toLowerCase().includes("invalid login credentials")
      ) {
        message =
          "Invalid email or password. Please check your details.";
      }

      if (
        message.toLowerCase().includes("user already registered")
      ) {
        message =
          "This email is already registered. Please sign in instead.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  if (forgotPassword) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20,
        }}
      >
        <div
          style={{
            background: COLORS.paper,
            borderRadius: 18,
            width: "100%",
            maxWidth: 420,
            padding: 28,
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: COLORS.muted,
            }}
          >
            <X size={20} />
          </button>

          <h2
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontWeight: 700,
              fontSize: 22,
              color: COLORS.deep,
              margin: "0 0 8px",
            }}
          >
            Reset your password
          </h2>

          <p
            style={{
              color: COLORS.muted,
              fontSize: 14,
              marginBottom: 18,
            }}
          >
            Enter your email and we'll send you a password reset link.
          </p>

          <input
            style={inputStyle}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p
              style={{
                color: "#b42318",
                background: "#fff0ee",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#8aa99a" : COLORS.green,
              color: "white",
              border: 0,
              padding: 13,
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            onClick={() => {
              setForgotPassword(false);
              setError("");
            }}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              border: 0,
              color: COLORS.green,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,61,43,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div
        style={{
          background: COLORS.paper,
          borderRadius: 20,
          padding: 32,
          maxWidth: 380,
          width: "100%",
          position: "relative",
          boxShadow: "0 30px 60px rgba(12,61,43,.3)",
        }}
      >
        {/* Close button */}

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: 0,
            cursor: "pointer",
            color: COLORS.muted,
          }}
        >
          <X size={18} />
        </button>

        {/* Sign In / Sign Up tabs */}

        <div
          style={{
            display: "flex",
            background: "#f3efe5",
            borderRadius: 9,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 9,
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              border: 0,
              background:
                mode === "signin"
                  ? COLORS.paper
                  : "transparent",
              color:
                mode === "signin"
                  ? COLORS.green
                  : COLORS.muted,
              boxShadow:
                mode === "signin"
                  ? "0 2px 6px rgba(0,0,0,.06)"
                  : "none",
            }}
          >
            Sign In
          </button>

          <button
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 9,
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              border: 0,
              background:
                mode === "signup"
                  ? COLORS.paper
                  : "transparent",
              color:
                mode === "signup"
                  ? COLORS.green
                  : COLORS.muted,
              boxShadow:
                mode === "signup"
                  ? "0 2px 6px rgba(0,0,0,.06)"
                  : "none",
            }}
          >
            Sign Up
          </button>
        </div>

        {/* =================================================
            SIGN IN
        ================================================= */}

        {mode === "signin" ? (
          <>
            <h2
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.deep,
                margin: "0 0 4px",
              }}
            >
              Welcome back
            </h2>

            <p
              style={{
                color: COLORS.muted,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Sign in to your farm dashboard.
            </p>

            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
            />

            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                setForgotPassword(true);
                setError("");
                setPassword("");
              }}
              style={{
                background: "none",
                border: 0,
                color: COLORS.green,
                cursor: "pointer",
                fontSize: 13,
                padding: 0,
                marginBottom: 10,
              }}
            >
              Forgot password?
            </button>
          </>
        ) : (
          /* =================================================
             SIGN UP
          ================================================= */

          <>
            <h2
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.deep,
                margin: "0 0 4px",
              }}
            >
              Create your account
            </h2>

            <p
              style={{
                color: COLORS.muted,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Get started with KrishiSahayak.
            </p>

            <input
              style={inputStyle}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />

            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
            />

            <input
              style={inputStyle}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
            />

            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
            />
          </>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fdecec",
              color: "#c62828",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* SUBMIT */}

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            width: "100%",
            background: loading
              ? "#7da995"
              : COLORS.green,
            color: "white",
            border: 0,
            padding: 13,
            borderRadius: 9,
            fontWeight: 700,
            fontSize: 14,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            marginTop: 6,
          }}
        >
          {loading
            ? mode === "signin"
              ? "Signing In..."
              : "Creating Account..."
            : mode === "signin"
            ? "Sign In"
            : "Create Account"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

export default function KrishiSahayakLanding() {
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  /* =====================================================
     AFTER AUTHENTICATION
  ===================================================== */

  const handleAuthSuccess = (mode) => {
    setAuthOpen(false);

    if (mode === "signup") {
      /*
       * NEW USER
       * Go to onboarding first.
       */
      navigate("/onboarding");
    } else {
      /*
       * EXISTING USER
       * Go directly to dashboard.
       */
      navigate("/dashboard");
    }
  };

  const h2Style = {
    fontFamily: "'Lora', Georgia, serif",
    fontWeight: 700,
    color: COLORS.deep,
    fontSize: 34,
    margin: "0 0 10px",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: COLORS.cream,
        fontFamily: "'Inter', Arial, sans-serif",
        color: COLORS.ink,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@500;600;700&display=swap');

        @keyframes ticker-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .ks-ticker-track {
          animation: ticker-scroll 22s linear infinite;
        }

        .ks-ticker-track:hover {
          animation-play-state: paused;
        }

        .ks-input:focus {
          box-shadow: 0 0 0 3px rgba(20,90,63,.15);
        }
      `}</style>

      {/* ================= NAVBAR ================= */}

      <div
        style={{
          background: "rgba(255,253,248,.95)",
          borderBottom: `1px solid ${COLORS.line}`,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: COLORS.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf
                size={19}
                color="white"
                strokeWidth={2.5}
              />
            </div>

            <span
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 700,
                fontSize: 20,
                color: COLORS.deep,
              }}
            >
              KrishiSahayak
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              fontSize: 14,
              fontWeight: 500,
              color: "#405248",
            }}
          >
            <span style={{ cursor: "pointer" }}>
              Features
            </span>

            <span style={{ cursor: "pointer" }}>
              How it works
            </span>

            <span style={{ cursor: "pointer" }}>
              About
            </span>
          </div>

          <button
            onClick={() => openAuth("signup")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.green,
              color: "white",
              border: 0,
              padding: "12px 20px",
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ================= HERO ================= */}

      <div
        style={{
          padding: "56px 7% 44px",
          position: "relative",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(rgba(248,243,231,.9),rgba(248,243,231,.95)), repeating-linear-gradient(170deg, transparent 0 34px, rgba(20,90,63,.07) 35px 37px)",
        }}
      >
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.05fr .95fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                border: "1px solid #d9c88f",
                borderRadius: 99,
                background: "#fff8dc",
                color: "#6b5519",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Sparkles size={15} />
              AI-powered support for Indian farmers
            </span>

            <h1
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 700,
                color: COLORS.deep,
                fontSize: "clamp(36px,4.5vw,58px)",
                lineHeight: 1.06,
                margin: "18px 0",
              }}
            >
              Farming guidance that speaks{" "}
              <span style={{ color: "#c58c18" }}>
                your language.
              </span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: "#526058",
                maxWidth: 560,
                marginBottom: 26,
              }}
            >
              KrishiSahayak brings weather insights, crop
              health detection, mandi prices, and
              personalised farming guidance together in
              one simple place.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => openAuth("signup")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: COLORS.green,
                  color: "white",
                  border: 0,
                  padding: "13px 22px",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Start Exploring <ArrowRight size={16} />
              </button>

              <button
                onClick={() => openAuth("signin")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: COLORS.deep,
                  border: "1px solid #bfc8bf",
                  padding: "13px 22px",
                  borderRadius: 9,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                <Mic size={16} /> Ask in your language
              </button>
            </div>
          </div>

          {/* ================= PHONE MOCKUP ================= */}

          <div
            style={{
              background: COLORS.paper,
              border: `6px solid ${COLORS.deep}`,
              borderRadius: 32,
              boxShadow:
                "0 25px 50px rgba(17,60,43,.2)",
              padding: 16,
              maxWidth: 390,
              width: "100%",
              margin: "0 auto",
              transform: "rotate(1.5deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: COLORS.deep,
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Lora', Georgia, serif",
                }}
              >
                <Leaf size={16} />
                KrishiSahayak
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  fontWeight: 500,
                }}
              >
                AI Farming Copilot
              </span>
            </div>

            <div
              style={{
                background: "#f3efe5",
                borderRadius: 15,
                padding: 15,
                marginBottom: 10,
                fontSize: 14,
                lineHeight: 1.5,
                display: "flex",
                gap: 8,
              }}
            >
              <Leaf
                size={15}
                color={COLORS.green}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <span>
                नमस्ते! मैं आपका खेती सहायक हूँ। आज मैं
                आपकी कैसे मदद कर सकता हूँ?
              </span>
            </div>

            <div
              style={{
                background: "#e3f0e8",
                borderRadius: 15,
                padding: 15,
                marginBottom: 10,
                fontSize: 14,
                lineHeight: 1.5,
                marginLeft: 35,
              }}
            >
              कल बारिश होगी क्या?
            </div>

            <div
              style={{
                background: "#f3efe5",
                borderRadius: 15,
                padding: 15,
                marginBottom: 10,
                fontSize: 14,
                lineHeight: 1.5,
                display: "flex",
                gap: 8,
              }}
            >
              <CloudRain
                size={15}
                color={COLORS.green}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <span>
                हाँ, कल बारिश की संभावना है। आज सिंचाई कम
                रखें और मौसम अपडेट देखें।
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.green,
                color: "white",
                borderRadius: 14,
                padding: 13,
                marginTop: 14,
              }}
            >
              <Mic size={18} />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 3,
                  height: 24,
                }}
              >
                {[8, 18, 24, 13, 20, 9].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{
                        width: 3,
                        borderRadius: 4,
                        background: COLORS.gold,
                        height: h,
                      }}
                    />
                  )
                )}
              </div>

              <small>Tap to speak</small>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MANDI TICKER ================= */}

      <div
        style={{
          background: COLORS.deep,
          color: "#fff",
          padding: "13px 0",
          overflow: "hidden",
          fontSize: 14,
        }}
      >
        <div
          className="ks-ticker-track"
          style={{
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            width: "max-content",
          }}
        >
          <TickerContent />
          <TickerContent />
        </div>
      </div>

      {/* ================= FEATURES ================= */}

      <div
        style={{
          padding: "56px 7%",
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 700,
            margin: "0 auto 36px",
          }}
        >
          <h2 style={h2Style}>
            Everything your farm needs, together.
          </h2>

          <p
            style={{
              color: COLORS.muted,
              lineHeight: 1.6,
            }}
          >
            Simple tools designed around everyday farming
            decisions—not complicated technology.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;

            return (
              <Card key={f.title}>
                <div
                  style={{
                    color: COLORS.green,
                    background: "#eef5ef",
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={26} />
                </div>

                <h3
                  style={{
                    fontFamily:
                      "'Lora', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 22,
                    margin: "0 0 8px",
                    color: COLORS.deep,
                  }}
                >
                  {f.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: COLORS.muted,
                    lineHeight: 1.55,
                  }}
                >
                  {f.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ================= CTA ================= */}

      <div
        style={{
          background: COLORS.green,
          color: "white",
          borderRadius: 22,
          padding: 52,
          textAlign: "center",
          margin: "0 7% 60px",
        }}
      >
        <h2
          style={{
            ...h2Style,
            color: "white",
          }}
        >
          Better decisions. Healthier crops.
        </h2>

        <p
          style={{
            color: "#d7e8dc",
            marginBottom: 22,
          }}
        >
          Your smart farming companion is ready when
          you are.
        </p>

        <button
          onClick={() => openAuth("signup")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: COLORS.gold,
            color: "#3d2d09",
            border: 0,
            borderRadius: 9,
            padding: "14px 26px",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Explore KrishiSahayak <ArrowRight size={16} />
        </button>
      </div>

      {/* ================= FOOTER ================= */}

      <div
        style={{
          textAlign: "center",
          padding: 22,
          color: "#718078",
          fontSize: 13,
          borderTop: `1px solid ${COLORS.line}`,
        }}
      >
        © 2026 KrishiSahayak · Smart farming, made
        simpler
      </div>

      {/* ================= AUTH MODAL ================= */}

      <AuthModal
        open={authOpen}
        mode={authMode}
        setMode={setAuthMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}