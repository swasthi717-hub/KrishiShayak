const NOMINATIM_BASE_URL =
  "https://nominatim.openstreetmap.org";

/* ---------------- FORWARD GEOCODING ---------------- */
/*
 * Converts the state + district saved during onboarding
 * into latitude and longitude.
 *
 * state + district
 *       ↓
 * latitude + longitude
 */
export async function getCoordinatesFromLocation(
  state,
  district
) {
  try {
    const query = `${district}, ${state}, India`;

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&addressdetails=1&countrycodes=in`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Forward geocoding failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        `Could not find coordinates for ${district}, ${state}.`
      );
    }

    const result = data[0];

    return {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: result.display_name || "",
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
 * Converts latitude + longitude into a readable
 * state / district / city location.
 */
export async function reverseGeocode(
  latitude,
  longitude
) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?lat=${encodeURIComponent(
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

/* ---------------- LOCATION NAME ---------------- */
/*
 * Backward-compatible helper.
 * Returns the same location object as reverseGeocode().
 */
export async function getLocationName(
  latitude,
  longitude
) {
  return reverseGeocode(
    latitude,
    longitude
  );
}