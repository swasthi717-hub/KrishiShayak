const REVERSE_GEOCODE_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

export async function getLocationName(latitude, longitude) {
  try {
    const url = new URL(REVERSE_GEOCODE_URL);

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Location API error: ${response.status}`
      );
    }

    const data = await response.json();

    // BigDataCloud may provide district information
    // in localityInfo.administrative.
    const administrative =
      data?.localityInfo?.administrative || [];

    const districtEntry = administrative.find((item) => {
      const description = String(
        item?.description || ""
      ).toLowerCase();

      return (
        description.includes("district") ||
        description.includes("county")
      );
    });

    return {
      city:
        data?.city ||
        data?.locality ||
        data?.localityInfo?.administrative?.[2]
          ?.name ||
        data?.principalSubdivision ||
        "Unknown Location",

      district:
        data?.district ||
        districtEntry?.name ||
        "",

      state:
        data?.principalSubdivision ||
        "",

      country:
        data?.countryName ||
        "",
    };
  } catch (error) {
    console.error(
      "Failed to get location name:",
      error
    );

    throw error;
  }
}