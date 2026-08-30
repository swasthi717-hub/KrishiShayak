import React, { useState } from "react";
import { Mic, Volume2, Send, Star } from "lucide-react";
import Layout from "./Layout.jsx";

const QUICK_CHIPS = [
  "\u0915\u0940\u091F \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
  "\u092C\u093E\u0930\u093F\u0936 \u0915\u0940 \u0938\u0932\u093E\u0939",
  "\u0906\u091C \u092C\u0947\u091A\u0947\u0902?",
  "\u0938\u093F\u0902\u091A\u093E\u0908 \u0915\u092C?",
  "Pest control",
  "Weather advice",
];

const SAMPLE_QUESTIONS = [
  "\u092E\u0947\u0930\u0940 \u0915\u092A\u093E\u0938 \u092E\u0947\u0902 \u0915\u094C\u0928 \u0938\u0940 \u092C\u0940\u092E\u093E\u0930\u0940 \u0939\u0948?",
  "\u0915\u0932 \u092C\u093E\u0930\u093F\u0936 \u0915\u0947 \u092C\u093E\u0926 \u0915\u094D\u092F\u093E \u0915\u0930\u0947\u0902?",
  "\u0906\u091C \u091F\u092E\u093E\u091F\u0930 \u092C\u0947\u091A\u0928\u093E \u0938\u0939\u0940 \u0939\u0948?",
  "\u0917\u0947\u0939\u0942\u0902 \u092E\u0947\u0902 \u0938\u093F\u0902\u091A\u093E\u0908 \u0915\u092C \u0926\u0947\u0902?",
  "Which pesticide for bollworm?",
  "Best mandi for onion today?",
];

const SUPPORTED_LANGUAGES = [
  "\u0939\u093F\u0902\u0926\u0940",
  "\u092E\u0930\u093E\u0920\u0940",
  "\u0924\u092E\u093F\u0934\u094D",
  "\u0924\u0947\u0932\u0941\u0917\u0941",
  "\u0915\u0928\u094D\u0928\u0921",
  "\u092A\u0902\u091C\u093E\u092C\u0940",
  "\u09AC\u09BE\u0982\u09B2\u09BE",
];

export default function AiCopilotPage() {
  // messages holds the whole chat history; each entry is { sender, text, time }
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "\u0928\u092E\u0938\u094D\u0924\u0947! I'm KrishiShayak AI. Ask me anything about your crops, weather, pests, or market prices \u2014 in Hindi, Marathi, Tamil, Telugu, or English.",
      time: "Now",
    },
  ]);
  const [input, setInput] = useState("");

  // Shared by the text box's send button, Enter key, and the quick-reply
  // chips -- all three just need to add one line to `messages`.
  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { sender: "user", text: trimmed, time: "Now" }]);
    setInput("");
  }

  return (
    <Layout title="AI Copilot">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Main chat column */}
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
                Online \u00B7 Hindi, Marathi, Tamil, Telugu, English
              </p>
            </div>
          </div>

          {/* Quick-reply chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#24352a] shadow-sm hover:bg-[#e7edda]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat history */}
          <div className="mt-5 space-y-4">
            {messages.map((msg, i) =>
              msg.sender === "ai" ? (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f5b3d] text-white">
                    <Mic size={14} />
                  </div>
                  <div>
                    <div className="max-w-xl rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-[#24352a] shadow-sm">
                      {msg.text}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      {msg.time} <Volume2 size={12} />
                    </p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-xl rounded-2xl rounded-tr-sm bg-[#214d34] px-4 py-3 text-sm text-white shadow-sm">
                    {msg.text}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Input row */}
          <div className="mt-6 flex items-center gap-2">
            <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f5b3d] text-white hover:bg-[#173b27]">
              <Mic size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type or speak in any language..."
              className="h-11 flex-1 rounded-full border border-[#e5dfd2] bg-white px-4 text-sm text-[#24352a] outline-none placeholder:text-slate-400 focus:border-[#1f5b3d]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c9d9bd] text-[#4a5c3f] disabled:opacity-60 enabled:bg-[#1f5b3d] enabled:text-white enabled:hover:bg-[#173b27]"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">
            <p className="flex items-center gap-2 font-serif text-base font-bold text-[#24352a]">
              <Star size={16} className="text-[#c9a24b]" fill="#c9a24b" />
              Sample Questions
            </p>
            <div className="mt-3 space-y-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="block w-full rounded-xl bg-[#f7f5ee] px-3 py-2.5 text-left text-sm text-[#24352a] hover:bg-[#e7edda]"
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