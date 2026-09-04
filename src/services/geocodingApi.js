const NOMINATIM_SEARCH_URL =
  "https://nominatim.openstreetmap.org/search";

const NOMINATIM_REVERSE_URL =
  "https://nominatim.openstreetmap.org/reverse";

/* ---------------- FORWARD GEOCODING ---------------- */
/*
 * Converts the state + district saved during onboarding
 * into latitude and longitude.
 */

export async function getCoordinatesFromLocation(
  state,
  district
) {
  try {
    const query = `${district}, ${state}, India`;

    const response = await fetch(
      `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Geocoding failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        `Could not find coordinates for ${district}, ${state}.`
      );
    }

    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      displayName: data[0].display_name || "",
    };
  } catch (error) {
    console.error(
      "Forward geocoding error:",
      error
    );

    throw error;
  }
}

/* ---------------- REVERSE GEOCODING ---------------- */
/*
 * Converts latitude + longitude into a location.
 * Keep this if another part of your project uses it.
 */

export async function reverseGeocode(
  latitude,
  longitude
) {
  try {
    const response = await fetch(
      `${NOMINATIM_REVERSE_URL}?lat=${encodeURIComponent(
        latitude
      )}&lon=${encodeURIComponent(
        longitude
      )}&format=json&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Reverse geocoding failed: ${response.status}`
      );
    }

    const data = await response.json();

    const address = data?.address || {};

    return {
      state:
        address.state ||
        address.state_district ||
        "",

      district:
        address.state_district ||
        address.district ||
        address.county ||
        "",

      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        "",

      displayName:
        data?.display_name || "",
    };
  } catch (error) {
    console.error(
      "Reverse geocoding error:",
      error
    );

    throw error;
  }
}