let recognition = null;

/**
 * 🎤 Start speech recognition
 */
export function startListening({
  language = "hi-IN",
  onStart,
  onResult,
  onEnd,
  onError,
}) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  // Browser does not support speech recognition
  if (!SpeechRecognition) {
    const error = new Error(
      "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
    );

    console.error(error);
    onError?.(error);
    return;
  }

  // Stop an existing recognition session
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // Ignore if already stopped
    }

    recognition = null;
  }

  // Create new recognition instance
  recognition = new SpeechRecognition();

  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // 🎤 Recognition started
  recognition.onstart = () => {
    console.log("🎤 Speech recognition started");
    onStart?.();
  };

  // 📝 Speech converted to text
  recognition.onresult = (event) => {
    const transcript =
      event.results?.[0]?.[0]?.transcript?.trim();

    console.log("🎤 Transcript:", transcript);

    if (transcript) {
      onResult?.(transcript);
    }
  };

  // ❌ Recognition error
  recognition.onerror = (event) => {
    console.error(
      "🎤 Speech recognition error:",
      event.error
    );

    let message = "Could not use the microphone.";

    if (event.error === "not-allowed") {
      message =
        "Microphone permission was denied. Please allow microphone access in your browser.";
    } else if (event.error === "no-speech") {
      message =
        "No speech was detected. Please try speaking again.";
    } else if (event.error === "audio-capture") {
      message =
        "No microphone was found. Please check your microphone.";
    } else if (event.error === "network") {
      message =
        "Speech recognition could not connect to the speech service.";
    }

    onError?.(new Error(message));
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
    try {
      recognition.stop();
    } catch {
      // Ignore if already stopped
    }

    recognition = null;
  }
}

/**
 * 🔊 Speak AI response using browser text-to-speech
 */
export function speakResponse(
  text,
  language = "hi-IN"
) {
  if (!text) return;

  // Browser does not support speech synthesis
  if (!window.speechSynthesis) {
    console.error(
      "Text-to-speech is not supported in this browser."
    );
    return;
  }

  // Stop any currently playing speech
  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = language;
  utterance.rate = 0.95;
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

/**
 * 🔇 Stop AI text-to-speech
 */
export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    console.log("🔇 AI speech stopped");
  }
}