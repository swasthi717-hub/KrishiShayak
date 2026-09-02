import React, { useEffect, useState } from "react";
import {
  Mic,
  Volume2,
  Send,
  Star,
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

const SUPPORTED_LANGUAGES = [
  "हिंदी",
  "मराठी",
  "தமிழ்",
  "తెలుగు",
  "ಕನ್ನಡ",
  "ਪੰਜਾਬੀ",
  "বাংলা",
  "ଓଡ଼ିଆ",
  "ગુજરાતી",
  "മലയാളം",
];

const LANGUAGE_CODES = {
  हिंदी: "hi-IN",
  मराठी: "mr-IN",
  தமிழ்: "ta-IN",
  తెలుగు: "te-IN",
  ಕನ್ನಡ: "kn-IN",
  ਪੰਜਾਬੀ: "pa-IN",
  বাংলা: "bn-IN",
  ଓଡ଼ିଆ: "or-IN",
  ગુજરાતી: "gu-IN",
  മലയാളം: "ml-IN",
  English: "en-IN",
};

const LANGUAGE_PROMPT_CODES = {
  हिंदी: "hi",
  मराठी: "mr",
  தமிழ்: "ta",
  తెలుగు: "te",
  ಕನ್ನಡ: "kn",
  ਪੰਜਾਬી: "pa",
  বাংলা: "bn",
  ଓଡ଼ିଆ: "or",
  ગુજરાતી: "gu",
  മലയാളം: "ml",
  English: "en",
};

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
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState("हिंदी");

  // -----------------------------------------------------------
  // SEND MESSAGE
  // -----------------------------------------------------------

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
      const languageCode =
        LANGUAGE_PROMPT_CODES[selectedLanguage] || "hi";

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

      speakResponse(
        answer,
        LANGUAGE_CODES[selectedLanguage] || "hi-IN"
      );
    } catch (error) {
      console.error("Gemini error:", error);

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
      setIsThinking(false);
    }
  }

  // -----------------------------------------------------------
  // HANDLE FARM DASHBOARD → COPILOT
  // -----------------------------------------------------------

  useEffect(() => {
    const prompt = location.state?.prompt;

    if (!prompt) {
      return;
    }

    // Clear navigation state so refreshing the page does not
    // automatically send the same prompt again.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    sendMessage(prompt);
  }, [location.state]);

  // -----------------------------------------------------------
  // MICROPHONE
  // -----------------------------------------------------------

  function handleMicClick() {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    startListening({
      language:
        LANGUAGE_CODES[selectedLanguage] || "hi-IN",

      onStart: () => {
        setIsListening(true);
      },

      onResult: (transcript) => {
        setInput(transcript);
        sendMessage(transcript);
      },

      onEnd: () => {
        setIsListening(false);
      },

      onError: (error) => {
        console.error("Voice input error:", error);

        setIsListening(false);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              error === "not-allowed"
                ? "Microphone permission was denied. Please allow microphone access in your browser."
                : "I couldn't hear that clearly. Please try speaking again.",
            time: "Now",
          },
        ]);
      },
    });
  }

  // -----------------------------------------------------------
  // SPEAK
  // -----------------------------------------------------------

  function handleSpeak(text) {
    speakResponse(
      text,
      LANGUAGE_CODES[selectedLanguage] || "hi-IN"
    );
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------

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
                AI assistant · Multilingual
              </p>
            </div>
          </div>

          {/* LANGUAGE */}

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
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}

              <option value="English">English</option>
            </select>
          </div>

          {/* QUICK CHIPS */}

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={isThinking}
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

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{msg.time}</span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSpeak(msg.text)
                        }
                        className="flex items-center gap-1 hover:text-[#1f5b3d]"
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

            {isThinking && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5b3d] text-white">
                  <Mic size={14} />
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Thinking...
                </div>
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
              title={
                isListening
                  ? "Stop listening"
                  : "Speak your question"
              }
            >
              {isListening ? (
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Type or speak in any language..."
              className="h-11 flex-1 rounded-full border border-[#e5dfd2] bg-white px-4 text-sm text-[#24352a] outline-none placeholder:text-slate-400 focus:border-[#1f5b3d]"
            />

            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c9d9bd] text-[#4a5c3f] disabled:opacity-60 enabled:bg-[#1f5b3d] enabled:text-white enabled:hover:bg-[#173b27]"
            >
              <Send size={16} />
            </button>
          </div>

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
                  disabled={isThinking}
                  className="block w-full rounded-xl bg-[#f7f5ee] px-3 py-2.5 text-left text-sm text-[#24352a] hover:bg-[#e7edda] disabled:opacity-60"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#e7edda] p-5">
            <p className="font-serif text-base font-bold text-[#24352a]">
              Supported Languages
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#24352a] shadow-sm"
                >
                  {lang}
                </span>
              ))}

              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#24352a] shadow-sm">
                English
              </span>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}