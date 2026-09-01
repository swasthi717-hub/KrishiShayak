const recognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition ||
      window.webkitSpeechRecognition
    : null;

export function startListening({
  language = "hi-IN",
  onResult,
  onStart,
  onEnd,
  onError,
}) {
  if (!recognition) {
    const error = new Error(
      "Speech recognition is not supported in this browser."
    );

    if (onError) {
      onError(error);
    }

    return null;
  }

  const instance = new recognition();

  instance.lang = language;
  instance.continuous = false;
  instance.interimResults = false;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    if (onStart) onStart();
  };

  instance.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    if (onResult) {
      onResult(transcript);
    }
  };

  instance.onerror = (event) => {
    if (onError) {
      onError(event);
    }
  };

  instance.onend = () => {
    if (onEnd) onEnd();
  };

  instance.start();

  return instance;
}