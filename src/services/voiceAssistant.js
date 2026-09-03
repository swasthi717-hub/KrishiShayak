// src/services/voiceAssistant.js

let recognition = null;

// ============================================================
// SPEECH RECOGNITION / STT
// ============================================================

export function startListening({
  language = "en-IN",
  onResult,
  onStart,
  onEnd,
  onError,
}) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.(
      "Voice input is not supported in this browser. Please use Chrome or Edge."
    );
    return;
  }

  if (recognition) {
    try {
      recognition.abort();
    } catch (error) {
      console.warn(
        "Could not stop previous recognition:",
        error
      );
    }

    recognition = null;
  }

  const currentRecognition =
    new SpeechRecognition();

  recognition = currentRecognition;

  currentRecognition.lang = language;
  currentRecognition.continuous = false;
  currentRecognition.interimResults = false;
  currentRecognition.maxAlternatives = 1;

  currentRecognition.onstart = () => {
    console.log(
      "Speech recognition started:",
      language
    );

    onStart?.();
  };

  currentRecognition.onaudiostart = () => {
    console.log(
      "Microphone audio started."
    );
  };

  currentRecognition.onsoundstart = () => {
    console.log(
      "Sound detected."
    );
  };

  currentRecognition.onspeechstart = () => {
    console.log(
      "Speech detected."
    );
  };

  currentRecognition.onresult = (event) => {
    console.log(
      "Speech recognition result event:",
      event
    );

    try {
      const result =
        event.results?.[0]?.[0];

      if (!result) {
        console.warn(
          "Speech recognition returned no result."
        );
        return;
      }

      const transcript =
        result.transcript?.trim();

      console.log(
        "Speech transcript:",
        transcript
      );

      if (!transcript) {
        onError?.(
          "I couldn't understand your speech. Please try again."
        );
        return;
      }

      onResult?.(transcript);
    } catch (error) {
      console.error(
        "Failed to process speech result:",
        error
      );

      onError?.(
        "I couldn't process your voice input. Please try again."
      );
    }
  };

  currentRecognition.onnomatch = () => {
    console.warn(
      "Speech recognition could not understand the speech."
    );

    onError?.(
      "I couldn't understand that. Please speak clearly and try again."
    );
  };

  currentRecognition.onspeechend = () => {
    console.log(
      "Speech ended."
    );
  };

  currentRecognition.onsoundend = () => {
    console.log(
      "Sound ended."
    );
  };

  currentRecognition.onaudioend = () => {
    console.log(
      "Microphone audio ended."
    );
  };

  currentRecognition.onerror = (event) => {
    console.error(
      "Speech recognition error:",
      event.error,
      event
    );

    if (event.error === "aborted") {
      return;
    }

    let message =
      "Voice input failed. Please try again.";

    switch (event.error) {
      case "no-speech":
        message =
          "I didn't hear any speech. Please speak again.";
        break;

      case "audio-capture":
        message =
          "I couldn't access your microphone. Please check your microphone permissions.";
        break;

      case "not-allowed":
        message =
          "Microphone permission was denied. Please allow microphone access.";
        break;

      case "network":
        message =
          "Speech recognition needs a network connection in this browser.";
        break;

      case "service-not-allowed":
        message =
          "Speech recognition service is not allowed in this browser.";
        break;

      case "language-not-supported":
        message =
          `Speech recognition does not support ${language} in this browser.`;
        break;

      default:
        break;
    }

    onError?.(message);
  };

  currentRecognition.onend = () => {
    console.log(
      "Speech recognition ended."
    );

    if (recognition === currentRecognition) {
      recognition = null;
    }

    onEnd?.();
  };

  try {
    console.log(
      "Starting speech recognition with language:",
      language
    );

    currentRecognition.start();
  } catch (error) {
    console.error(
      "Could not start speech recognition:",
      error
    );

    if (recognition === currentRecognition) {
      recognition = null;
    }

    onError?.(
      "Could not start voice input. Please try again."
    );
  }
}

// ============================================================
// STOP LISTENING
// ============================================================

export function stopListening() {
  if (!recognition) {
    return;
  }

  try {
    recognition.abort();
  } catch (error) {
    console.warn(
      "Could not stop speech recognition:",
      error
    );
  }

  recognition = null;
}

// ============================================================
// TEXT TO SPEECH / TTS
// ============================================================

export function speakResponse(
  text,
  language = "en-IN"
) {
  if (!("speechSynthesis" in window)) {
    console.warn(
      "Speech synthesis is not supported in this browser."
    );
    return;
  }

  const cleanText =
    String(text || "").trim();

  if (!cleanText) {
    console.warn(
      "No text provided for speech."
    );
    return;
  }

  window.speechSynthesis.cancel();

  const speak = () => {
    const utterance =
      new SpeechSynthesisUtterance(
        cleanText
      );

    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices =
      window.speechSynthesis.getVoices();

    const normalizedLanguage =
      String(language).toLowerCase();

    const exactVoice =
      voices.find(
        (voice) =>
          voice.lang?.toLowerCase() ===
          normalizedLanguage
      );

    const baseLanguage =
      normalizedLanguage.split("-")[0];

    const baseVoice =
      voices.find(
        (voice) =>
          voice.lang
            ?.toLowerCase()
            .startsWith(baseLanguage)
      );

    if (exactVoice) {
      utterance.voice = exactVoice;

      console.log(
        "Using TTS voice:",
        exactVoice.name,
        exactVoice.lang
      );
    } else if (baseVoice) {
      utterance.voice = baseVoice;

      console.log(
        "Using base TTS voice:",
        baseVoice.name,
        baseVoice.lang
      );
    } else {
      console.warn(
        "No matching voice found for:",
        language
      );
    }

    utterance.onstart = () => {
      console.log(
        "Speech started:",
        language
      );
    };

    utterance.onend = () => {
      console.log(
        "Speech finished."
      );
    };

    utterance.onerror = (event) => {
      console.error(
        "Speech synthesis error:",
        event.error
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  const voices =
    window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    speak();
    return;
  }

  let spoken = false;

  const speakOnce = () => {
    if (spoken) {
      return;
    }

    spoken = true;

    window.speechSynthesis.onvoiceschanged =
      null;

    speak();
  };

  window.speechSynthesis.onvoiceschanged =
    speakOnce;

  setTimeout(() => {
    speakOnce();
  }, 500);
}

// ============================================================
// STOP SPEAKING
// ============================================================

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    window.speechSynthesis.onvoiceschanged =
      null;
  }
}