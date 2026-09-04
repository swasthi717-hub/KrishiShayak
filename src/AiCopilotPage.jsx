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

import { useLanguage } from "./context/LanguageContext";
import { translateTexts } from "./services/translation";

/* ============================================================
   SUPPORTED LANGUAGES
============================================================ */

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

/* ============================================================
   VOICE LANGUAGE CODES
============================================================ */

const LANGUAGE_VOICE_CODES = {
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  pa: "pa-IN",
  bn: "bn-IN",
  or: "or-IN",
  gu: "gu-IN",
  ml: "ml-IN",
  en: "en-IN",
};

/* ============================================================
   GEMINI LANGUAGE CODES
============================================================ */

const LANGUAGE_PROMPT_CODES = {
  hi: "hi",
  mr: "mr",
  ta: "ta",
  te: "te",
  kn: "kn",
  pa: "pa",
  bn: "bn",
  or: "or",
  gu: "gu",
  ml: "ml",
  en: "en",
};

/* ============================================================
   ENGLISH SOURCE TEXT
============================================================ */

const ENGLISH_TEXTS = {
  copilotTitle: "AI Farming Copilot",
  copilotSubtitle: "Online · Multilingual",
  voiceLanguage: "Voice language:",

  quickPest: "Pest control",
  quickRain: "Weather advice",
  quickSell: "Sell today?",
  quickIrrigation: "When to irrigate?",

  initialGreeting:
    "नमस्ते! I'm KrishiShayak AI. Ask me anything about your crops, weather, pests, or market prices — in Hindi, Marathi, Tamil, Telugu, or English.",

  listen: "Listen",
  thinking: "AI is thinking...",

  inputPlaceholder:
    "Type or speak in any language...",

  stopVoiceResponse: "Stop voice response",

  sampleQuestions: "Sample Questions",

  questionDisease:
    "Which disease is affecting my cotton?",
  questionRain:
    "What should I do after tomorrow's rain?",
  questionTomato:
    "Is it a good time to sell tomatoes today?",
  questionWheat:
    "When should I irrigate wheat?",
  questionPesticide:
    "Which pesticide is suitable for bollworm?",
  questionMandi:
    "Which is the best mandi for onion today?",

  supportedLanguages: "Supported Languages",

  micPermission:
    "Microphone permission was denied. Please allow microphone access in your browser.",

  micError:
    "I couldn't hear that clearly. Please try speaking again.",

  aiError:
    "Unable to connect to the AI assistant.",

  translating: "Translating...",
};

/* ============================================================
   QUICK QUESTIONS
============================================================ */

const QUICK_QUESTIONS = [
  {
    key: "quickPest",
    english: "Pest control",
  },
  {
    key: "quickRain",
    english: "Weather advice",
  },
  {
    key: "quickSell",
    english: "Sell today?",
  },
  {
    key: "quickIrrigation",
    english: "When to irrigate?",
  },
];

/* ============================================================
   SAMPLE QUESTIONS
============================================================ */

const SAMPLE_QUESTIONS = [
  {
    key: "questionDisease",
    english: "Which disease is affecting my cotton?",
  },
  {
    key: "questionRain",
    english: "What should I do after tomorrow's rain?",
  },
  {
    key: "questionTomato",
    english: "Is it a good time to sell tomatoes today?",
  },
  {
    key: "questionWheat",
    english: "When should I irrigate wheat?",
  },
  {
    key: "questionPesticide",
    english: "Which pesticide is suitable for bollworm?",
  },
  {
    key: "questionMandi",
    english: "Which is the best mandi for onion today?",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function AiCopilotPage() {
  const location = useLocation();

  /*
   * GLOBAL LANGUAGE
   */
  const { language } = useLanguage();

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: ENGLISH_TEXTS.initialGreeting,
      time: "Now",
    },
  ]);

  const [input, setInput] = useState("");

  /*
   * Keep the existing language selector UI from HEAD.
   * It starts with the globally selected language.
   */
  const [selectedLanguage, setSelectedLanguage] =
    useState(language || "hi");

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [translations, setTranslations] =
    useState(ENGLISH_TEXTS);
  const [isTranslating, setIsTranslating] =
    useState(false);

  /*
   * Keep the dropdown synchronized with the global language.
   */
  useEffect(() => {
    if (language) {
      setSelectedLanguage(language);
    }
  }, [language]);

  /* ==========================================================
     TRANSLATE COPILOT UI
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadTranslations() {
      if (!language || language === "en") {
        setTranslations(ENGLISH_TEXTS);
        return;
      }

      setIsTranslating(true);

      try {
        const keys = Object.keys(ENGLISH_TEXTS);
        const englishTexts = Object.values(ENGLISH_TEXTS);

        const translated = await translateTexts(
          englishTexts,
          language,
          "en"
        );

        if (cancelled) return;

        const translatedObject = {};

        keys.forEach((key, index) => {
          translatedObject[key] =
            translated[index] || ENGLISH_TEXTS[key];
        });

        setTranslations(translatedObject);
      } catch (error) {
        console.error(
          "AI Copilot translation error:",
          error
        );

        if (!cancelled) {
          setTranslations(ENGLISH_TEXTS);
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }

    loadTranslations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  /* ==========================================================
     UPDATE INITIAL GREETING
  ========================================================== */

  useEffect(() => {
    setMessages((currentMessages) => {
      if (
        currentMessages.length === 1 &&
        currentMessages[0].sender === "ai"
      ) {
        return [
          {
            sender: "ai",
            text: translations.initialGreeting,
            time: "Now",
          },
        ];
      }

      return currentMessages;
    });
  }, [translations.initialGreeting]);

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  async function sendMessage(text) {
    const trimmed = String(text || "").trim();

    if (!trimmed || isThinking) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmed,
        time: "Now",
      },
    ]);

    setInput("");
    setIsThinking(true);

    try {
      /*
       * Use the language selected in the existing dropdown.
       */
      const languageCode =
        LANGUAGE_PROMPT_CODES[selectedLanguage] || "en";

      const answer = await getChatResponse(
        trimmed,
        languageCode
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: answer,
          time: "Now",
        },
      ]);

      /*
       * Speak AI response in selected language.
       */
      speakResponse(
        answer,
        LANGUAGE_VOICE_CODES[selectedLanguage] || "en-IN"
      );
    } catch (error) {
      console.error("Gemini error:", error);

      const errorMessage =
        error?.message || translations.aiError;

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `AI assistant error: ${errorMessage}`,
          time: "Now",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  /* ==========================================================
     FARM DASHBOARD → COPILOT
  ========================================================== */

  useEffect(() => {
    const prompt = location.state?.prompt;

    if (!prompt) {
      return;
    }

    /*
     * Prevent the same prompt from being sent again on refresh.
     */
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    sendMessage(prompt);
  }, [location.state]);

  /* ==========================================================
     MICROPHONE
  ========================================================== */

  function handleMicClick() {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    startListening({
      language:
        LANGUAGE_VOICE_CODES[selectedLanguage] || "en-IN",

      onStart: () => {
        setIsListening(true);
      },

      onResult: (transcript) => {
        console.log(
          "🎤 Speech converted to:",
          transcript
        );

        setInput(transcript);

        /*
         * Automatically send exactly what was spoken.
         */
        sendMessage(transcript);
      },

      onEnd: () => {
        setIsListening(false);
      },

      onError: (error) => {
        console.error(
          "🎤 Voice input error:",
          error
        );

        setIsListening(false);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              error?.message || translations.micError,
            time: "Now",
          },
        ]);
      },
    });
  }

  /* ==========================================================
     TEXT TO SPEECH
  ========================================================== */

  function handleSpeak(text) {
    speakResponse(
      text,
      LANGUAGE_VOICE_CODES[selectedLanguage] || "en-IN"
    );
  }

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <Layout title={translations.copilotTitle}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* MAIN CHAT */}

        <div className="rounded-2xl bg-[#f4f1e7] p-5 sm:p-6">

          {/* HEADER */}

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f5b3d] text-white">
              <Mic size={22} />
            </div>

            <div>
              <h2 className="font-serif text-xl font-bold text-[#24352a]">
                {translations.copilotTitle}
              </h2>

              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {translations.copilotSubtitle}
              </p>
            </div>

          </div>

          {/* LANGUAGE SELECTOR */}

          <div className="mt-4 flex flex-wrap items-center gap-2">

            <span className="text-xs font-semibold text-slate-500">
              {translations.voiceLanguage}
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

          {/* TRANSLATION STATUS */}

          {isTranslating && (
            <p className="mt-2 text-xs text-slate-400">
              {translations.translating}
            </p>
          )}

          {/* QUICK CHIPS */}

          <div className="mt-5 flex flex-wrap gap-2">

            {QUICK_QUESTIONS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() =>
                  sendMessage(translations[chip.key])
                }
                disabled={isThinking}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#24352a] shadow-sm hover:bg-[#e7edda] disabled:opacity-60"
              >
                {translations[chip.key]}
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
                        {translations.listen}
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

            {/* THINKING */}

            {isThinking && (
              <div className="flex items-center gap-2 text-sm text-slate-500">

                <Loader2
                  size={16}
                  className="animate-spin"
                />

                {translations.thinking}

              </div>
            )}

          </div>

          {/* INPUT */}

          <div className="mt-6 flex items-center gap-2">

            <button
              type="button"
              onClick={handleMicClick}
              disabled={isThinking}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#1f5b3d] hover:bg-[#173b27]"
              } disabled:opacity-60`}
            >
              {isListening ? (
                <Square size={16} />
              ) : (
                <Mic size={18} />
              )}
            </button>

            {/* TEXT INPUT */}

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={translations.inputPlaceholder}
              className="h-11 flex-1 rounded-full border border-[#e5dfd2] bg-white px-4 text-sm text-[#24352a] outline-none placeholder:text-slate-400 focus:border-[#1f5b3d]"
            />

            {/* SEND */}

            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking}
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
            {translations.stopVoiceResponse}
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

              {translations.sampleQuestions}

            </p>

            <div className="mt-3 space-y-2">

              {SAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question.key}
                  type="button"
                  onClick={() =>
                    sendMessage(
                      translations[question.key]
                    )
                  }
                  disabled={isThinking}
                  className="block w-full rounded-xl bg-[#f7f5ee] px-3 py-2.5 text-left text-sm text-[#24352a] hover:bg-[#e7edda] disabled:opacity-60"
                >
                  {translations[question.key]}
                </button>
              ))}

            </div>

          </div>

          {/* LANGUAGE */}

          <div className="rounded-2xl bg-[#e7edda] p-5">

            <p className="font-serif text-base font-bold text-[#24352a]">
              {translations.supportedLanguages}
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