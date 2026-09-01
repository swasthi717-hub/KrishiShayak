let recognition = null;

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

  recognition = new SpeechRecognition();

  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("🎤 Speech recognition started");
    onStart?.();
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results?.[0]?.[0]?.transcript?.trim();

    console.log("🎤 Transcript:", transcript);

    if (transcript) {
      onResult?.(transcript);
    }
  };

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

  recognition.onend = () => {
    console.log("🎤 Speech recognition ended");

    recognition = null;
    onEnd?.();
  };

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