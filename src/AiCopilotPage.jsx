import React, {
  useEffect,
  useState,
} from "react";

import {
  Mic,
  Volume2,
  Send,
  Star,
  Square,
  Loader2,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import Layout from "./Layout.jsx";

import {
  getChatResponse,
} from "./services/gemini.js";

import {
  startListening,
  stopListening,
  speakResponse,
  stopSpeaking,
} from "./services/voiceAssistant";

import {
  getCurrentLocation,
} from "./services/location.js";


import {
  getWeather,
} from "./services/weatherApi.js";

import {
  getMandiPrices,
} from "./services/mandiApi.js";

// =============================================================
// QUICK QUESTIONS
// =============================================================

const QUICK_CHIPS = [
  {
    label: "🌾 गेहूं की बुवाई",
    question: "गेहूं की बुवाई कब और कैसे करें?",
    language: "Hindi",
  },
  {
    label: "🐛 Bollworm",
    question: "How can I control bollworm in my crop?",
    language: "English",
  },
  {
    label: "💧 पानी प्रबंधन",
    question: "फसल में पानी कब देना चाहिए?",
    language: "Hindi",
  },
  {
    label: "🌱 Soil health",
    question: "How can I improve my soil health?",
    language: "English",
  },
];

// =============================================================
// SAMPLE QUESTIONS
// =============================================================

const SAMPLE_QUESTIONS = [
  {
    question:
      "मेरी फसल में कीड़े लग गए हैं, क्या करूं?",
    language: "Hindi",
  },
  {
    question:
      "गेहूं की बुवाई के लिए सबसे अच्छा समय क्या है?",
    language: "Hindi",
  },
  {
    question:
      "How can I control bollworm in my crop?",
    language: "English",
  },
  {
    question:
      "What fertilizer should I use for rice?",
    language: "English",
  },
];

// =============================================================
// LANGUAGES
// =============================================================

const SUPPORTED_LANGUAGES = [
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Punjabi",
  "Bengali",
  "Odia",
  "Gujarati",
  "Malayalam",
  "English",
];

const LANGUAGE_CODES = {
  Hindi: "hi-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Punjabi: "pa-IN",
  Bengali: "bn-IN",
  Odia: "or-IN",
  Gujarati: "gu-IN",
  Malayalam: "ml-IN",
  English: "en-IN",
};

const LANGUAGE_PROMPT_CODES = {
  Hindi: "hi",
  Marathi: "mr",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Punjabi: "pa",
  Bengali: "bn",
  Odia: "or",
  Gujarati: "gu",
  Malayalam: "ml",
  English: "en",
};

const LANGUAGE_NAMES = {
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  pa: "Punjabi",
  bn: "Bengali",
  or: "Odia",
  gu: "Gujarati",
  ml: "Malayalam",
  en: "English",
};

// =============================================================
// COMMODITY DETECTION
// =============================================================

function detectCommodity(question) {
  const text = String(question || "").toLowerCase();

  const commodities = [
    {
      names: [
        "onion",
        "प्याज",
        "कांदा",
      ],
      value: "Onion",
    },
    {
      names: [
        "tomato",
        "टमाटर",
        "टोमॅटो",
      ],
      value: "Tomato",
    },
    {
      names: [
        "wheat",
        "गेहूं",
        "गहू",
      ],
      value: "Wheat",
    },
    {
      names: [
        "rice",
        "धान",
        "चावल",
        "तांदूळ",
      ],
      value: "Rice",
    },
    {
      names: [
        "cotton",
        "कपास",
        "कापूस",
      ],
      value: "Cotton",
    },
    {
      names: [
        "potato",
        "आलू",
        "बटाटा",
      ],
      value: "Potato",
    },
    {
      names: [
        "soybean",
        "सोयाबीन",
      ],
      value: "Soybean",
    },
    {
      names: [
        "maize",
        "corn",
        "मक्का",
      ],
      value: "Maize",
    },
    {
      names: [
        "sugarcane",
        "गन्ना",
      ],
      value: "Sugarcane",
    },
    {
      names: [
        "mustard",
        "सरसों",
      ],
      value: "Mustard",
    },
  ];

  for (const commodity of commodities) {
    if (
      commodity.names.some((name) =>
        text.includes(name)
      )
    ) {
      return commodity.value;
    }
  }

  return null;
}

// =============================================================
// CHECK WHETHER QUESTION NEEDS MANDI DATA
// =============================================================

function needsMandiData(question) {
  const text = String(question || "").toLowerCase();

  const mandiKeywords = [
    "mandi",
    "market",
    "price",
    "prices",
    "rate",
    "sell",
    "selling",
    "बेचना",
    "बेचें",
    "बेच",
    "भाव",
    "कीमत",
    "मंडी",
    "बाजार",
    "दर",
  ];

  const hasMandiKeyword =
    mandiKeywords.some((keyword) =>
      text.includes(keyword)
    );

  const commodity = detectCommodity(question);

  return (
    hasMandiKeyword ||
    Boolean(commodity)
  );
}

// =============================================================
// FETCH MANDI DATA
// =============================================================

async function fetchRelevantMandiData(
  question,
  location
) {
  if (!needsMandiData(question)) {
    return null;
  }

  const commodity = detectCommodity(question);

  if (!commodity) {
    return null;
  }

  const state =
    location?.state || "";

  const district =
    location?.district || "";

  try {
    // ---------------------------------------------------------
    // First: district + state + commodity
    // ---------------------------------------------------------

    let data =
      await getMandiPrices({
        state,
        district,
        commodity,
        limit: 30,
      });

    if (
      Array.isArray(data?.records) &&
      data.records.length > 0
    ) {
      return data;
    }

    // ---------------------------------------------------------
    // Second: state + commodity
    // ---------------------------------------------------------

    data =
      await getMandiPrices({
        state,
        commodity,
        limit: 30,
      });

    if (
      Array.isArray(data?.records) &&
      data.records.length > 0
    ) {
      return data;
    }

    // ---------------------------------------------------------
    // Third: commodity only
    // ---------------------------------------------------------

    data =
      await getMandiPrices({
        commodity,
        limit: 30,
      });

    return data;
  } catch (error) {
    console.error(
      "Mandi lookup failed:",
      error
    );

    return null;
  }
}

// =============================================================
// COMPONENT
// =============================================================

export default function AiCopilotPage() {
  const routerLocation = useLocation();

  // ===========================================================
  // CHAT STATE
  // ===========================================================

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "नमस्ते! I'm KrishiSahayak AI. Ask me anything about your crops, weather, pests, or market prices — in Hindi, Marathi, Tamil, Telugu, or English.",
      time: "Now",
    },
  ]);

  const [input, setInput] = useState("");

  // ===========================================================
  // VOICE STATE
  // ===========================================================

  const [isListening, setIsListening] =
    useState(false);

  const [isThinking, setIsThinking] =
    useState(false);

  const [voiceError, setVoiceError] =
    useState("");

  // ===========================================================
  // LANGUAGE
  // ===========================================================

  const [selectedLanguage, setSelectedLanguage] =
    useState("English");

  // ===========================================================
  // LIVE FARMER CONTEXT
  // ===========================================================

  const [farmerContext, setFarmerContext] =
    useState({
      location: null,
      weather: null,
      mandi: null,
    });

  const [contextLoading, setContextLoading] =
    useState(true);

  // ===========================================================
  // LOAD LOCATION + WEATHER
  // ===========================================================

  async function loadFarmerContext() {
    try {
      setContextLoading(true);

      const coordinates =
        await getCurrentLocation();

      const [
        weather,
        locationName,
      ] = await Promise.all([
        getWeather(
          coordinates.latitude,
          coordinates.longitude
        ),
        getLocationName(
          coordinates.latitude,
          coordinates.longitude
        ),
      ]);

      const context = {
        location: {
          latitude:
            coordinates.latitude,

          longitude:
            coordinates.longitude,

          accuracy:
            coordinates.accuracy,

          ...locationName,
        },

        weather,

        mandi: null,
      };

      setFarmerContext(context);

      console.log(
        "Farmer context loaded:",
        context
      );

      return context;
    } catch (error) {
      console.error(
        "Failed to load farmer context:",
        error
      );

      return {
        location: null,
        weather: null,
        mandi: null,
      };
    } finally {
      setContextLoading(false);
    }
  }

  // ===========================================================
  // INITIAL CONTEXT LOAD
  // ===========================================================

  useEffect(() => {
    loadFarmerContext();
  }, []);

  // ===========================================================
  // SEND MESSAGE
  // ===========================================================

  async function sendMessage(
    messageOverride = null
  ) {
    const trimmed =
      typeof messageOverride === "string"
        ? messageOverride.trim()
        : input.trim();

    if (
      !trimmed ||
      isThinking
    ) {
      return;
    }

    console.log(
      "Sending message:",
      trimmed
    );

    console.log(
      "Selected language:",
      selectedLanguage
    );

    // ---------------------------------------------------------
    // Add user message
    // ---------------------------------------------------------

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
      // -------------------------------------------------------
      // Ensure location/weather are available
      // -------------------------------------------------------

      let context = farmerContext;

      if (
        !context?.location ||
        !context?.weather
      ) {
        context =
          await loadFarmerContext();
      }

      // -------------------------------------------------------
      // Fetch mandi data only when needed
      // -------------------------------------------------------

      const mandiData =
        await fetchRelevantMandiData(
          trimmed,
          context?.location
        );

      const finalContext = {
        ...context,
        mandi: mandiData,
      };

      setFarmerContext(
        finalContext
      );

      console.log(
        "AI context for question:",
        finalContext
      );

      // -------------------------------------------------------
      // Ask Gemini
      // -------------------------------------------------------

      const languageCode =
        LANGUAGE_PROMPT_CODES[
          selectedLanguage
        ] || "en";

      console.log(
        "Sending question to Gemini with language:",
        languageCode
      );

      const answer =
        await getChatResponse(
          trimmed,
          languageCode,
          finalContext
        );

      const safeAnswer =
        typeof answer === "string" &&
        answer.trim()
          ? answer.trim()
          : "Sorry, I could not generate an answer right now.";

      console.log(
        "Gemini response:",
        safeAnswer
      );

      // -------------------------------------------------------
      // Add AI response
      // -------------------------------------------------------

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: safeAnswer,
          time: "Now",
        },
      ]);

      // -------------------------------------------------------
      // Text-to-speech
      // -------------------------------------------------------

      try {
        const speechLanguage =
          LANGUAGE_CODES[
            selectedLanguage
          ] || "en-IN";

        console.log(
          "Speaking response in:",
          speechLanguage
        );

        speakResponse(
          safeAnswer,
          speechLanguage
        );
      } catch (speechError) {
        console.warn(
          "Text-to-speech failed:",
          speechError
        );
      }
    } catch (error) {
      console.error(
        "AI assistant error:",
        error
      );

      let errorMessage =
        "Sorry, I couldn't process your question right now.";

      if (error?.message) {
        errorMessage =
          `AI assistant error: ${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: errorMessage,
          time: "Now",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  // ===========================================================
  // DASHBOARD → COPILOT PROMPT
  // ===========================================================

  useEffect(() => {
    const prompt =
      routerLocation.state?.prompt;

    if (!prompt) {
      return;
    }

    console.log(
      "Received dashboard prompt:",
      prompt
    );

    // Clear navigation state so the same
    // prompt does not execute again.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    sendMessage(prompt);

    // This effect intentionally responds
    // to navigation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.state?.prompt]);

  // ===========================================================
  // MICROPHONE
  // ===========================================================

  const handleMicClick = () => {
    // ---------------------------------------------------------
    // Stop current listening
    // ---------------------------------------------------------

    if (isListening) {
      console.log(
        "Stopping speech recognition..."
      );

      stopListening();
      setIsListening(false);
      return;
    }

    // ---------------------------------------------------------
    // Clear old voice error
    // ---------------------------------------------------------

    setVoiceError("");

    // ---------------------------------------------------------
    // Select browser language
    // ---------------------------------------------------------

    const speechLanguage =
      LANGUAGE_CODES[
        selectedLanguage
      ] || "en-IN";

    console.log(
      "Starting speech recognition with language:",
      speechLanguage
    );

    console.log(
      "Listening in:",
      selectedLanguage
    );

    // ---------------------------------------------------------
    // Start recognition
    // ---------------------------------------------------------

    startListening({
      language: speechLanguage,

      // -------------------------------------------------------
      // Recognition started
      // -------------------------------------------------------

      onStart: () => {
        console.log(
          "Speech recognition started:",
          speechLanguage
        );

        setVoiceError("");
        setIsListening(true);
      },

      // -------------------------------------------------------
      // Transcript received
      // -------------------------------------------------------

      onResult: (spokenText) => {
        const text =
          typeof spokenText === "string"
            ? spokenText.trim()
            : "";

        console.log(
          "Speech transcript received:",
          text
        );

        if (!text) {
          console.warn(
            "Speech recognition returned an empty transcript."
          );
          return;
        }

        // Show transcript in the input.
        setInput(text);

        // IMPORTANT:
        // Send transcript directly rather than
        // calling sendMessage() with React state,
        // because state updates are asynchronous.
        sendMessage(text);
      },

      // -------------------------------------------------------
      // Recognition ended
      // -------------------------------------------------------

      onEnd: () => {
        console.log(
          "Speech recognition ended."
        );

        setIsListening(false);
      },

      // -------------------------------------------------------
      // Recognition error
      // -------------------------------------------------------

      onError: (errorMessage) => {
        console.error(
          "Voice input error:",
          errorMessage
        );

        setIsListening(false);

        if (
          typeof errorMessage === "string" &&
          errorMessage
            .toLowerCase()
            .includes("network")
        ) {
          setVoiceError(
            "Voice input could not connect to the browser speech service. Check your internet connection and try again."
          );
        } else {
          setVoiceError(
            errorMessage ||
              "Voice input is unavailable. Please try again."
          );
        }
      },
    });
  };

  // ===========================================================
  // SPEAK INDIVIDUAL AI MESSAGE
  // ===========================================================

  const handleSpeak = (text) => {
    if (!text) {
      return;
    }

    try {
      const speechLanguage =
        LANGUAGE_CODES[
          selectedLanguage
        ] || "en-IN";

      console.log(
        "Speaking selected message in:",
        speechLanguage
      );

      speakResponse(
        text,
        speechLanguage
      );
    } catch (error) {
      console.error(
        "Failed to speak message:",
        error
      );
    }
  };

  // ===========================================================
  // LANGUAGE CHANGE
  // ===========================================================

  const handleLanguageChange = (event) => {
    const newLanguage =
      event.target.value;

    console.log(
      "Changing Copilot language to:",
      newLanguage
    );

    // Stop current TTS
    stopSpeaking();

    // Stop recognition if active
    if (isListening) {
      stopListening();
      setIsListening(false);
    }

    setVoiceError("");
    setSelectedLanguage(newLanguage);
  };

  // ===========================================================
  // ENTER KEY
  // ===========================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ===========================================================
  // GET LANGUAGE NAME
  // ===========================================================

  const getLanguageName = (code) => {
    return (
      LANGUAGE_NAMES[code] ||
      code
    );
  };

  // ===========================================================
  // UI
  // ===========================================================

  return (
    <Layout title="AI Copilot">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

        {/* ===================================================
            MAIN COPILOT AREA
        =================================================== */}

        <div>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="rounded-2xl bg-[#f4f1e7] p-5 sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

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
                    AI assistant · Multilingual
                  </p>

                </div>

              </div>

              {/* LANGUAGE SELECTOR */}

              <div className="flex items-center gap-2">

                <label
                  htmlFor="copilot-language"
                  className="text-sm font-medium text-slate-500"
                >
                  Language
                </label>

                <select
                  id="copilot-language"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="rounded-full border border-[#e5dfd2] bg-white px-3 py-2 text-sm font-medium text-[#24352a] outline-none focus:border-[#2f7357]"
                >
                  {SUPPORTED_LANGUAGES.map(
                    (language) => (
                      <option
                        key={language}
                        value={language}
                      >
                        {language}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>

            {/* =================================================
                LIVE CONTEXT STATUS
            ================================================= */}

            <div className="mt-3 text-xs text-slate-400">

              {contextLoading
                ? "Loading your location and live weather..."
                : farmerContext?.location
                  ? `Using live data for ${
                      farmerContext.location.city ||
                      farmerContext.location.state ||
                      "your location"
                    }`
                  : "Live location unavailable"}

            </div>

          </div>

          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <div className="mt-4 rounded-xl border border-[#e5dfd2] bg-[#f7f5ee] px-4 py-3 text-xs leading-5 text-slate-500">

            <span className="font-semibold text-[#59645c]">
              Disclaimer:
            </span>{" "}

            AI-generated guidance is for informational purposes
            only. Please do not follow recommendations blindly;
            consult a qualified agricultural expert or relevant
            professional before taking major farming decisions.

          </div>

          {/* =================================================
              QUICK CHIPS
          ================================================= */}

          <div className="mt-5 flex flex-wrap gap-2">

            {QUICK_CHIPS.map(
              (chip) => (
                <button
                  key={chip.question}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(
                      chip.language
                    );

                    sendMessage(
                      chip.question
                    );
                  }}
                  disabled={isThinking}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#24352a] shadow-sm ring-1 ring-[#e5dfd2] transition hover:bg-[#e7edda] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chip.label}
                </button>
              )
            )}

          </div>

          {/* =================================================
              CHAT CONTAINER
          ================================================= */}

          <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e5dfd2]">

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div className="min-h-[420px] space-y-5 p-4 sm:p-6">

              {messages.map(
                (message, index) => {
                  const isUser =
                    message.sender === "user";

                  return (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`flex ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      {isUser ? (

                        <div className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#214d34] px-4 py-3 text-sm text-white shadow-sm">
                          {message.text}
                        </div>

                      ) : (

                        <div className="flex items-start gap-2.5">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f5b3d] text-white">
                            <Mic size={14} />
                          </div>

                          <div>

                            <div className="max-w-xl whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-900">
                              {message.text}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">

                              <span>
                                {message.time}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleSpeak(
                                    message.text
                                  )
                                }
                                className="flex items-center gap-1 hover:text-[#1f5b3d]"
                              >
                                <Volume2 size={12} />
                                Listen
                              </button>

                            </div>

                          </div>

                        </div>

                      )}

                    </div>
                  );
                }
              )}

              {/* =================================================
                  THINKING
              ================================================= */}

              {isThinking && (

                <div className="flex items-start gap-2.5">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5b3d] text-white">
                    <Mic size={14} />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-600">

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    <span>
                      Checking live data and thinking...
                    </span>

                  </div>

                </div>

              )}

            </div>

            {/* =================================================
                VOICE ERROR
            ================================================= */}

            {voiceError && (

              <div className="border-t border-gray-100 bg-red-50 px-4 py-3 sm:px-6">

                <div className="flex items-start justify-between gap-3">

                  <p className="text-sm text-red-700">
                    {voiceError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setVoiceError("")
                    }
                    className="text-xs font-medium text-red-700 hover:text-red-900"
                  >
                    Dismiss
                  </button>

                </div>

              </div>

            )}

            {/* =================================================
                INPUT AREA
            ================================================= */}

            <div className="border-t border-gray-100 p-4 sm:p-6">

              <div className="flex flex-col gap-3">

                {/* TEXT INPUT */}

                <div className="flex items-end gap-2">

                  <textarea
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask KrishiSahayak in ${selectedLanguage}...`}
                    rows={2}
                    disabled={isThinking}
                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage()
                    }
                    disabled={
                      !input.trim() ||
                      isThinking
                    }
                    className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Send message"
                  >
                    <Send size={20} />
                  </button>

                </div>

                {/* =================================================
                    MICROPHONE
                ================================================= */}

                <div className="flex flex-wrap items-center gap-3">

                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isThinking}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isListening
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={
                      isListening
                        ? "Stop recording"
                        : "Speak your question"
                    }
                  >

                    {isListening ? (
                      <>
                        <Square size={17} />
                        Stop recording
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        Speak
                      </>
                    )}

                  </button>

                  {isListening && (

                    <span className="text-sm text-red-600">
                      Listening... speak now
                    </span>

                  )}

                  {!isListening &&
                    !voiceError && (

                      <span className="text-xs text-gray-500">
                        Tap Speak and ask your farming question.
                      </span>

                  )}

                </div>

                {/* STOP TTS */}

                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="self-start text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Stop voice response
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT SIDEBAR
        =================================================== */}

        <div className="space-y-5">

          {/* =================================================
              SAMPLE QUESTIONS
          ================================================= */}

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

              {SAMPLE_QUESTIONS.map(
                (item) => (
                  <button
                    key={item.question}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(
                        item.language
                      );

                      sendMessage(
                        item.question
                      );
                    }}
                    disabled={isThinking}
                    className="block w-full rounded-xl bg-[#f7f5ee] px-3 py-2.5 text-left text-sm text-[#24352a] hover:bg-[#e7edda] disabled:opacity-60"
                  >

                    <span className="mb-1 block text-xs font-medium text-[#2f7357]">
                      {item.language}
                    </span>

                    {item.question}

                  </button>
                )
              )}

            </div>

          </div>

          {/* =================================================
              SUPPORTED LANGUAGES
          ================================================= */}

          <div className="rounded-2xl bg-[#e7edda] p-5">

            <p className="font-serif text-base font-bold text-[#24352a]">
              Supported Languages
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {SUPPORTED_LANGUAGES.map(
                (lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#24352a] shadow-sm"
                  >
                    {lang}
                  </span>
                )
              )}

            </div>

            <p className="mt-3 text-xs text-slate-500">
              Current language:{" "}
              {getLanguageName(
                LANGUAGE_PROMPT_CODES[
                  selectedLanguage
                ]
              )}
            </p>

          </div>

        </div>

      </div>
    </Layout>
  );
}