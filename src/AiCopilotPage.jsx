import React, { useEffect, useState } from "react";

import {
  Mic,
  Volume2,
  Send,
  Star,
  Loader2,
  Square,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import Layout from "./Layout.jsx";

import { getChatResponse } from "./services/gemini.js";

import {
  startListening,
  stopListening,
  speakResponse,
  stopSpeaking,
} from "./services/voiceAssistant.js";

import { supabase } from "./lib/supabase";

const QUICK_CHIPS = [
  "कीट नियंत्रण",
  "बारिश की सलाह",
  "आज बेचें?",
  "सिंचाई कब?",
  "Pest control",
  "Weather advice",
];

const SAMPLE_QUESTIONS = [
  "मेरी कपास में कौन सी बीमारी है?",
  "कल बारिश के बाद क्या करें?",
  "आज टमाटर बेचना सही है?",
  "गेहूं में सिंचाई कब दें?",
  "Which pesticide for bollworm?",
  "Best mandi for onion today?",
];

const LANGUAGE_CODES = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  bn: "bn-IN",
  or: "or-IN",
};

const LANGUAGE_NAMES = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  bn: "বাংলা",
  or: "ଓଡ଼ିଆ",
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES);

export default function AiCopilotPage() {
  const location = useLocation();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "नमस्ते! I'm KrishiShayak AI. Ask me anything about your crops, weather, pests, or market prices — in Hindi, Marathi, Tamil, Telugu, or English.",
      time: "Now",
    },
  ]);

  const [input, setInput] = useState("");

  // User's saved language from Supabase
  const [preferredLanguage, setPreferredLanguage] =
    useState("hi");

  // Language currently being used by the Copilot
  const [selectedLanguage, setSelectedLanguage] =
    useState("hi");

  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  /*
   * ---------------------------------------------------------
   * GET LANGUAGE FROM SUPABASE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadPreferredLanguage() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data?.preferred_language) {
          const language = data.preferred_language;

          setPreferredLanguage(language);
          setSelectedLanguage(language);
        }
      } catch (error) {
        console.error(
          "Failed to load preferred language:",
          error
        );
      }
    }

    loadPreferredLanguage();
  }, []);

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE TO GEMINI
   * ---------------------------------------------------------
   */

  async function sendMessage(text) {
    const trimmed = String(text || "").trim();

    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      sender: "user",
      text: trimmed,
      time: "Now",
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await getChatResponse(
        trimmed,
        selectedLanguage
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response,
          time: "Now",
          language: selectedLanguage,
        },
      ]);

      /*
       * Speak AI response
       */

      speakResponse(
        response,
        LANGUAGE_CODES[selectedLanguage] || "hi-IN"
      );

      /*
       * Save conversation history
       */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("ai_chat_history")
          .insert([
            {
              user_id: user.id,
              role: "user",
              message: trimmed,
              language_code: selectedLanguage,
            },
            {
              user_id: user.id,
              role: "assistant",
              message: response,
              language_code: selectedLanguage,
            },
          ]);

        if (error) {
          console.error(
            "Failed to save chat history:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Copilot request failed:",
        error
      );

      const errorMessage =
        error?.message ||
        "Unable to connect to the AI assistant.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `AI assistant error: ${errorMessage}`,
          time: "Now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * HANDLE FARM DASHBOARD → COPILOT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const prompt = location.state?.prompt;

    if (!prompt) {
      return;
    }

    // Prevent the same prompt from being sent again on refresh
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    sendMessage(prompt);
  }, [location.state]);

  /*
   * ---------------------------------------------------------
   * MICROPHONE
   * ---------------------------------------------------------
   */

  function handleVoiceInput() {
    if (loading) {
      return;
    }

    if (listening) {
      stopListening();
      setListening(false);
      return;
    }

    const language =
      LANGUAGE_CODES[selectedLanguage] || "hi-IN";

    setListening(true);

    startListening({
      language,

      onStart: () => {
        console.log(
          `🎤 Listening in ${language}`
        );

        setListening(true);
      },

      onResult: (transcript) => {
        console.log(
          "🎤 Speech converted to:",
          transcript
        );

        setInput(transcript);
        setListening(false);

        // Automatically send recognized speech
        sendMessage(transcript);
      },

      onEnd: () => {
        setListening(false);
      },

      onError: (error) => {
        console.error(
          "🎤 Voice input error:",
          error
        );

        setListening(false);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              error?.message ||
              "Microphone could not be used. Please check your microphone permission.",
            time: "Now",
          },
        ]);
      },
    });
  }

  /*
   * ---------------------------------------------------------
   * TEXT TO SPEECH
   * ---------------------------------------------------------
   */

  function handleSpeak(text) {
    speakResponse(
      text,
      LANGUAGE_CODES[selectedLanguage] || "hi-IN"
    );
  }

  /*
   * ---------------------------------------------------------
   * CLEANUP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <Layout title="AI Copilot">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* MAIN CHAT */}
        <div className="rounded-2xl bg-[#f4f1e7] p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f5b3d] text-white">
              <Mic size={22} />
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-[#24352a]">
                AI Farming Copilot
              </h2>

              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Online · Multilingual
              </p>
            </div>

          </div>

          {/* LANGUAGE SELECTOR */}

          <div className="mt-4 flex flex-wrap items-center gap-2">

            <span className="text-xs font-semibold text-slate-500">
              Voice language:
            </span>

            <select
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value)
              }
              className="rounded-full border border-[#e5dfd2] bg-white px-3 py-1.5 text-xs font-medium text-[#24352a] outline-none"
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <option
                  key={code}
                  value={code}
                >
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>

          </div>

          {/* QUICK CHIPS */}

          <div className="mt-5 flex flex-wrap gap-2">

            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={loading}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#24352a] shadow-sm hover:bg-[#e7edda] disabled:opacity-60"
              >
                {chip}
              </button>
            ))}

          </div>

          {/* CHAT */}

          <div className="mt-5 space-y-4">

            {messages.map((msg, i) =>
              msg.sender === "ai" ? (
                <div
                  key={`${msg.sender}-${i}`}
                  className="flex items-start gap-2.5"
                >

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f5b3d] text-white">
                    <Mic size={14} />
                  </div>

                  <div>

                    <div className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-[#24352a] shadow-sm">
                      {msg.text}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">

                      <span>
                        {msg.time}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSpeak(msg.text)
                        }
                        className="flex items-center gap-1 hover:text-[#2f7357]"
                      >
                        <Volume2 size={12} />
                        Listen
                      </button>

                    </div>

                  </div>

                </div>
              ) : (
                <div
                  key={`${msg.sender}-${i}`}
                  className="flex justify-end"
                >
                  <div className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#214d34] px-4 py-3 text-sm text-white shadow-sm">
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">

                <Loader2
                  size={16}
                  className="animate-spin"
                />

                AI is thinking...

              </div>
            )}

          </div>

          {/* INPUT */}

          <div className="mt-6 flex items-center gap-2">

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={loading}
              title={
                listening
                  ? "Stop listening"
                  : "Speak"
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition ${
                listening
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-[#1f5b3d] hover:bg-[#173b27]"
              } disabled:opacity-60`}
            >
              {listening ? (
                <Square size={16} />
              ) : (
                <Mic size={18} />
              )}
            </button>

            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={
                listening
                  ? "Listening..."
                  : "Type or speak in any language..."
              }
              className="h-11 flex-1 rounded-full border border-[#e5dfd2] bg-white px-4 text-sm text-[#24352a] outline-none placeholder:text-slate-400 focus:border-[#1f5b3d]"
            />

            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c9d9bd] text-[#4a5c3f] disabled:opacity-60 enabled:bg-[#1f5b3d] enabled:text-white enabled:hover:bg-[#173b27]"
            >
              <Send size={16} />
            </button>

          </div>

          {/* STOP VOICE RESPONSE */}

          <button
            type="button"
            onClick={stopSpeaking}
            className="mt-3 text-xs text-slate-400 hover:text-[#1f5b3d]"
          >
            Stop voice response
          </button>

        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-5">

          {/* SAMPLE QUESTIONS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <p className="flex items-center gap-2 font-serif text-base font-bold text-[#24352a]">

              <Star
                size={16}
                className="text-[#c9a24b]"
                fill="#c9a24b"
              />

              Sample Questions

            </p>

            <div className="mt-3 space-y-2">

              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="block w-full rounded-xl bg-[#f7f5ee] px-3 py-2.5 text-left text-sm text-[#24352a] hover:bg-[#e7edda] disabled:opacity-60"
                >
                  {q}
                </button>
              ))}

            </div>

          </div>

          {/* LANGUAGE */}

          <div className="rounded-2xl bg-[#e7edda] p-5">

            <p className="font-serif text-base font-bold text-[#24352a]">
              Your Preferred Language
            </p>

            <p className="mt-2 text-sm text-[#3d4d40]">
              {LANGUAGE_NAMES[preferredLanguage] ||
                "Hindi"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Your saved profile language is used as
              the default. You can change the voice
              language above when needed.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {SUPPORTED_LANGUAGES.map((code) => (
                <span
                  key={code}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#24352a] shadow-sm"
                >
                  {LANGUAGE_NAMES[code]}
                </span>
              ))}

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}