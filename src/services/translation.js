const MYMEMORY_API =
  "https://api.mymemory.translated.net/get";

const CACHE_PREFIX = "krishi_translation_";

/**
 * Translate a single piece of text.
 */
export async function translateText(
  text,
  targetLanguage,
  sourceLanguage = "en"
) {
  if (!text || !text.trim()) {
    return text;
  }

  if (sourceLanguage === targetLanguage) {
    return text;
  }

  // Check browser cache first
  const cacheKey = `${CACHE_PREFIX}${sourceLanguage}_${targetLanguage}_${text}`;

  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLanguage}|${targetLanguage}`,
    });

    const response = await fetch(`${MYMEMORY_API}?${params}`);

    if (!response.ok) {
      throw new Error("Translation API request failed");
    }

    const data = await response.json();

    if (
      data.responseStatus !== 200 ||
      !data.responseData?.translatedText
    ) {
      throw new Error("Translation failed");
    }

    const translatedText =
      data.responseData.translatedText;

    // Save translation so we don't repeatedly call the API
    localStorage.setItem(cacheKey, translatedText);

    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);

    // Never break the application if API fails
    return text;
  }
}


/**
 * Translate multiple texts at once.
 */
export async function translateTexts(
  texts,
  targetLanguage,
  sourceLanguage = "en"
) {
  const results = await Promise.all(
    texts.map((text) =>
      translateText(
        text,
        targetLanguage,
        sourceLanguage
      )
    )
  );

  return results;
}