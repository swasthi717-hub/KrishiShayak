// frontend/src/services/voiceAssistant.js

let recognition = null;
/*
  Start listening to the farmer's voice.

  language:
    Hindi     -> hi-IN
    Marathi   -> mr-IN
    Tamil     -> ta-IN
    Telugu    -> te-IN
    Kannada   -> kn-IN
    Punjabi   -> pa-IN
    Bengali   -> bn-IN
    English   -> en-IN
*/
export function startListening({
  language = "hi-IN",
  onResult,
  onStart,
  onEnd,
  onError,
}) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.(
      "Voice input is not supported in this browser. Please use Chrome or Edge."
    );
    return;
  }

  // Stop an existing recognition session
  if (recognition) {
    recognition.stop();
  }

  // Create new recognition instance
  recognition = new SpeechRecognition();

  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // 🎤 Recognition started
  recognition.onstart = () => {
    onStart?.();
  };

  // 📝 Speech converted to text
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    onResult?.(transcript);
  };

  // ❌ Recognition error
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    onError?.(event.error);
  };

  // 🛑 Recognition ended
  recognition.onend = () => {
        console.log("🎤 Speech recognition ended");

    recognition = null;

    onEnd?.();
  };

  // ▶️ Start recognition
  try {
    recognition.start();
  } catch (error) {
    console.error(
      "🎤 Could not start speech recognition:",
      error
    );

    recognition = null;

    onError?.(error);
    }
  }

/**
 * 🛑 Stop speech recognition
 */
export function stopListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

/*
  Speak Gemini's response aloud.

  The language should match the farmer's language.
*/

export function speakResponse(
  text,
  language = "hi-IN"
) {
  if (!text) return;

  if (!("speechSynthesis" in window)) {
    console.warn(
      "Speech synthesis is not supported in this browser."
    );
    return;
  }

  // Stop anything currently being spoken
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = language;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    console.log("🔊 AI speech started");
  };

  utterance.onend = () => {
    console.log("🔊 AI speech ended");
  };

  utterance.onerror = (event) => {
    console.error(
      "🔊 Text-to-speech error:",
      event.error
    );
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    console.log("🔇 AI speech stopped");
  }
}
