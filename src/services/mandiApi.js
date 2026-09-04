const MANDI_API_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const MANDI_API_KEY =
  import.meta.env.VITE_MANDI_API_KEY;

export async function getMandiPrices({
  state,
  district,
  market,
  commodity,
  variety,
  grade,
  limit = 50,
  offset = 0,
} = {}) {
  try {
    if (!MANDI_API_KEY) {
      throw new Error(
        "Mandi API key is missing. Add VITE_MANDI_API_KEY to your .env file."
      );
    }

    const url = new URL(MANDI_API_URL);

    url.searchParams.set(
      "api-key",
      MANDI_API_KEY
    );

    url.searchParams.set("format", "json");
    url.searchParams.set(
      "limit",
      String(limit)
    );
    url.searchParams.set(
      "offset",
      String(offset)
    );

    if (state) {
      url.searchParams.set(
        "filters[state.keyword]",
        state
      );
    }

    if (district) {
      url.searchParams.set(
        "filters[district]",
        district
      );
    }

    if (market) {
      url.searchParams.set(
        "filters[market]",
        market
      );
    }

    if (commodity) {
      url.searchParams.set(
        "filters[commodity]",
        commodity
      );
    }

    if (variety) {
      url.searchParams.set(
        "filters[variety]",
        variety
      );
    }

    if (grade) {
      url.searchParams.set(
        "filters[grade]",
        grade
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Mandi API error: ${response.status}`
      );
    }

    const data = await response.json();

    console.log(
      "Mandi API response:",
      data
    );

    return data;
  } catch (error) {
    console.error(
      "Failed to fetch mandi prices:",
      error
    );

    throw error;
  }
}