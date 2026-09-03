import React, { useEffect, useState } from "react";
import {
  Mic,
  Volume2,
  Send,
  Star,
  Square,
  Loader2,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import Layout from "./Layout";
import { getChatResponse } from "./services/gemini";
import {
  startListening,
  stopListening,
  speakResponse,
  stopSpeaking,
} from "./services/voiceAssistant";

/* =========================================================
   QUICK QUESTIONS
========================================================= */

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

/* =========================================================
   SAMPLE QUESTIONS
========================================================= */

const SAMPLE_QUESTIONS = [
  {
    question: "मेरी फसल में कीड़े लग गए हैं, क्या करूं?",
    language: "Hindi",
  },
  {
    question: "गेहूं की बुवाई के लिए सबसे अच्छा समय क्या है?",
    language: "Hindi",
  },
  {
    question: "How can I control bollworm in my crop?",
    language: "English",
  },
  {
    question: "What fertilizer should I use for rice?",
    language: "English",
  },
];

/* =========================================================
   LANGUAGES
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

export default function AiCopilotPage() {
  const location = useLocation();

  /* =======================================================
     CHAT STATE
  ======================================================= */

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text:
        "नमस्ते! I'm KrishiSahayak AI. Ask me anything about your crops, weather, pests, or market prices — in Hindi, Marathi, Tamil, Telugu, or English.",
    },
  ]);

  const [input, setInput] = useState("");

  /* =======================================================
     VOICE STATE
  ======================================================= */

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [voiceError, setVoiceError] = useState("");

  /* =======================================================
     LANGUAGE
  ======================================================= */

  const [selectedLanguage, setSelectedLanguage] =
    useState("English");

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage = async (messageOverride = null) => {
    const message =
      typeof messageOverride === "string"
        ? messageOverride.trim()
        : input.trim();

    if (!message || isThinking) {
      return;
    }

    console.log("Sending message:", message);
    console.log("Selected language:", selectedLanguage);

    const userMessage = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsThinking(true);

    try {
      const languageCode =
        LANGUAGE_PROMPT_CODES[selectedLanguage] || "en";

      console.log(
        "Sending question to Gemini with language:",
        languageCode
      );

      const answer = await getChatResponse(
        message,
        languageCode
      );

      const safeAnswer =
        typeof answer === "string" && answer.trim()
          ? answer.trim()
          : "Sorry, I could not generate an answer right now.";

      console.log("Gemini response:", safeAnswer);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: safeAnswer,
        },
      ]);

      /* =====================================================
         TEXT TO SPEECH

         TTS happens only after Gemini successfully answers.
      ===================================================== */

      try {
        const speechLanguage =
          LANGUAGE_CODES[selectedLanguage] || "en-IN";

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
      console.error("AI assistant error:", error);

      let errorMessage =
        "Sorry, I couldn't process your question right now.";

      if (error?.message) {
        errorMessage = `AI assistant error: ${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: errorMessage,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  /* =======================================================
     DASHBOARD → COPILOT PROMPT
  ======================================================= */

  useEffect(() => {
    const prompt = location.state?.prompt;

    if (!prompt) {
      return;
    }

    console.log(
      "Received dashboard prompt:",
      prompt
    );

    /*
      Clear the history state so the same prompt does
      not execute again after navigation/re-render.
    */
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    sendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.prompt]);

  /* =======================================================
     MICROPHONE
  ======================================================= */

  const handleMicClick = () => {
    /* -------------------------------------------------------
       STOP CURRENT LISTENING
    ------------------------------------------------------- */

    if (isListening) {
      console.log("Stopping speech recognition...");

      stopListening();

      setIsListening(false);

      return;
    }

    /* -------------------------------------------------------
       CLEAR OLD VOICE ERROR
    ------------------------------------------------------- */

    setVoiceError("");

    /* -------------------------------------------------------
       SELECT BROWSER LANGUAGE
    ------------------------------------------------------- */

    const speechLanguage =
      LANGUAGE_CODES[selectedLanguage] || "en-IN";

    console.log(
      "Starting speech recognition with language:",
      speechLanguage
    );

    console.log(
      "Listening in:",
      selectedLanguage
    );

    /* -------------------------------------------------------
       START SPEECH RECOGNITION
    ------------------------------------------------------- */

    startListening({
      language: speechLanguage,

      /* -----------------------------------------------
         Recognition actually started
      ------------------------------------------------ */

      onStart: () => {
        console.log(
          "Speech recognition started:",
          speechLanguage
        );

        setVoiceError("");
        setIsListening(true);
      },

      /* -----------------------------------------------
         Speech transcript received
      ------------------------------------------------ */

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

        /*
          Put the transcript into the input field so the
          user can see what was understood.
        */
        setInput(text);

        /*
          IMPORTANT:

          Do NOT do:

              setInput(text);
              sendMessage();

          because React state updates are asynchronous.

          Instead send the transcript directly.
        */
        sendMessage(text);
      },

      /* -----------------------------------------------
         Recognition ended
      ------------------------------------------------ */

      onEnd: () => {
        console.log(
          "Speech recognition ended."
        );

        setIsListening(false);
      },

      /* -----------------------------------------------
         Recognition error
      ------------------------------------------------ */

      onError: (errorMessage) => {
        console.error(
          "Voice input error:",
          errorMessage
        );

        setIsListening(false);

        /*
          IMPORTANT:

          Microphone/system errors should NOT be inserted
          into the AI chat as an AI message.

          Show them separately under the microphone.
        */

        if (
          typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("network")
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

  /* =======================================================
     SPEAK INDIVIDUAL AI MESSAGE
  ======================================================= */

  const handleSpeak = (text) => {
    if (!text) {
      return;
    }

    try {
      const speechLanguage =
        LANGUAGE_CODES[selectedLanguage] || "en-IN";

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

  /* =======================================================
     LANGUAGE CHANGE
  ======================================================= */

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;

    console.log(
      "Changing Copilot language to:",
      newLanguage
    );

    /*
      Stop current TTS when changing language.
    */
    stopSpeaking();

    /*
      Stop recognition if currently active.
    */
    if (isListening) {
      stopListening();
      setIsListening(false);
    }

    setVoiceError("");

    setSelectedLanguage(newLanguage);
  };

  /* =======================================================
     ENTER KEY
  ======================================================= */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  /* =======================================================
     GET LANGUAGE NAME
  ======================================================= */

  const getLanguageName = (code) => {
    return LANGUAGE_NAMES[code] || code;
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Copilot
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Your farming assistant, available in multiple
                Indian languages.
              </p>
            </div>

            {/* LANGUAGE SELECTOR */}

            <div className="flex items-center gap-2">
              <label
                htmlFor="copilot-language"
                className="text-sm font-medium text-gray-600"
              >
                Language
              </label>

              <select
                id="copilot-language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
              DISCLAIMER
          ================================================= */}

          <div className="mb-5 rounded-xl border border-[#e5dfd2] bg-[#f7f5ee] px-4 py-3 text-xs leading-5 text-slate-500">
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

          <div className="mb-5 flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.question}
                type="button"
                onClick={() => {
                  setSelectedLanguage(
                    chip.language
                  );

                  sendMessage(chip.question);
                }}
                disabled={isThinking}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:border-green-300 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* =================================================
              CHAT CONTAINER
          ================================================= */}

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div className="min-h-[420px] space-y-5 p-4 sm:p-6">

              {messages.map(
                (message, index) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[75%] ${
                          isUser
                            ? "rounded-2xl rounded-br-md bg-green-600 text-white"
                            : "rounded-2xl rounded-bl-md bg-gray-100 text-gray-900"
                        } px-4 py-3`}
                      >

                        {/* MESSAGE */}

                        <div className="whitespace-pre-wrap text-sm leading-6">
                          {message.text}
                        </div>

                        {/* LISTEN BUTTON FOR AI */}

                        {!isUser && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleSpeak(
                                  message.text
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              <Volume2
                                size={14}
                              />
                              Listen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* =================================================
                  THINKING
              ================================================= */}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    <span>
                      KrishiSahayak is thinking...
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

                  {/* SEND */}

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

                  {/* STATUS */}

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

          {/* =================================================
              SAMPLE QUESTIONS
          ================================================= */}

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center gap-2">
              <Star
                size={18}
                className="text-yellow-500"
              />

              <h2 className="font-semibold text-gray-900">
                Try asking
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SAMPLE_QUESTIONS.map(
                (item) => (
                  <button
                    key={item.question}
                    type="button"
                    disabled={isThinking}
                    onClick={() => {
                      setSelectedLanguage(
                        item.language
                      );

                      sendMessage(
                        item.question
                      );
                    }}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left text-sm text-gray-700 transition hover:border-green-300 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-1 text-xs font-medium text-green-600">
                      {item.language}
                    </div>

                    {item.question}
                  </button>
                )
              )}
            </div>
          </div>

          {/* =================================================
              SUPPORTED LANGUAGES
          ================================================= */}

          <div className="mt-6 rounded-2xl bg-green-50 p-5">

            <h2 className="mb-3 font-semibold text-green-900">
              Supported languages
            </h2>

            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map(
                (language) => (
                  <span
                    key={language}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-green-800 shadow-sm"
                  >
                    {language}
                  </span>
                )
              )}
            </div>

            <p className="mt-3 text-xs text-green-700">
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