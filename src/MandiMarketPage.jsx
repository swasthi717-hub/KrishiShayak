import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapPin,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import Layout from "./Layout.jsx";

import { getMandiPrices } from "./services/mandiApi.js";

import { supabase } from "./lib/supabase";

import { useAuth } from "./context/AuthContext";

export default function MandiMarketPage() {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");

  // ---------------------------------------------------------
  // FARMER LOCATION FROM ONBOARDING
  // ---------------------------------------------------------

  const [farmerLocation, setFarmerLocation] = useState({
    state: "",
    district: "",
  });

  const [locationLoading, setLocationLoading] =
    useState(true);

  // ---------------------------------------------------------
  // LOAD ONBOARDING LOCATION
  // ---------------------------------------------------------

  const loadFarmerLocation = async () => {
    try {
      setLocationLoading(true);
      setError("");

      if (!user?.id) {
        throw new Error("User is not logged in.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("state, district")
          .eq("user_id", user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      setFarmerLocation({
        state: profile?.state || "",
        district: profile?.district || "",
      });

      return {
        state: profile?.state || "",
        district: profile?.district || "",
      };
    } catch (err) {
      console.error(
        "Failed to load farmer location:",
        err
      );

      setFarmerLocation({
        state: "",
        district: "",
      });

      setError(
        "Unable to load your farm location. Please check your onboarding details."
      );

      return {
        state: "",
        district: "",
      };
    } finally {
      setLocationLoading(false);
    }
  };

  // ---------------------------------------------------------
  // FETCH MANDI PRICES
  // ---------------------------------------------------------

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.id) {
        setError("You must be logged in.");
        return;
      }

      // Get state + district saved during onboarding
      const location = await loadFarmerLocation();

      if (!location.state && !location.district) {
        setRecords([]);
        setError(
          "Your state and district are not available. Please complete your onboarding details."
        );
        return;
      }

      console.log(
        "Fetching mandi prices for onboarding location:",
        location
      );

      // -------------------------------------------------------
      // First: State + District
      // -------------------------------------------------------

      let data = await getMandiPrices({
        state: location.state,
        district: location.district,
        limit: 50,
        offset: 0,
      });

      let fetchedRecords =
        data?.records || [];

      // -------------------------------------------------------
      // Fallback: State only
      //
      // Some days the API may not return records for the
      // exact district. In that case, use the farmer's state.
      // -------------------------------------------------------

      if (fetchedRecords.length === 0 && location.state) {
        console.log(
          "No district records found. Trying state only."
        );

        data = await getMandiPrices({
          state: location.state,
          limit: 50,
          offset: 0,
        });

        fetchedRecords =
          data?.records || [];
      }

      setRecords(fetchedRecords);

      if (fetchedRecords.length > 0) {
        setSelectedCrop(
          fetchedRecords[0].Commodity ||
            fetchedRecords[0].commodity ||
            ""
        );
      } else {
        setSelectedCrop("");
      }
    } catch (err) {
      console.error(
        "Mandi page error:",
        err
      );

      setRecords([]);

      setError(
        err?.message ||
          "Unable to load mandi prices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    if (user?.id) {
      fetchPrices();
    }
  }, [user?.id]);

  // ---------------------------------------------------------
  // NORMALIZE API RECORDS
  // ---------------------------------------------------------

  const normalizedRecords = useMemo(() => {
    return records.map((item) => ({
      state:
        item.State ||
        item.state ||
        "",

      district:
        item.District ||
        item.district ||
        "",

      market:
        item.Market ||
        item.market ||
        "",

      commodity:
        item.Commodity ||
        item.commodity ||
        "",

      variety:
        item.Variety ||
        item.variety ||
        "",

      grade:
        item.Grade ||
        item.grade ||
        "",

      arrivalDate:
        item.Arrival_Date ||
        item.arrival_date ||
        item["Arrival Date"] ||
        "",

      minPrice: Number(
        item.Min_Price ||
          item.min_price ||
          item["Min Price"] ||
          0
      ),

      maxPrice: Number(
        item.Max_Price ||
          item.max_price ||
          item["Max Price"] ||
          0
      ),

      modalPrice: Number(
        item.Modal_Price ||
          item.modal_price ||
          item["Modal Price"] ||
          0
      ),
    }));
  }, [records]);

  // ---------------------------------------------------------
  // UNIQUE CROPS
  // ---------------------------------------------------------

  const crops = useMemo(() => {
    return [
      ...new Set(
        normalizedRecords
          .map(
            (item) => item.commodity
          )
          .filter(Boolean)
      ),
    ];
  }, [normalizedRecords]);

  // ---------------------------------------------------------
  // SELECTED CROP RECORDS
  // ---------------------------------------------------------

  const selectedCropRecords = useMemo(() => {
    if (!selectedCrop) return [];

    return normalizedRecords.filter(
      (item) =>
        item.commodity.toLowerCase() ===
        selectedCrop.toLowerCase()
    );
  }, [
    normalizedRecords,
    selectedCrop,
  ]);

  // ---------------------------------------------------------
  // UNIQUE MARKETS
  // ---------------------------------------------------------

  const markets = useMemo(() => {
    return [
      ...new Set(
        normalizedRecords
          .map(
            (item) => item.market
          )
          .filter(Boolean)
      ),
    ].slice(0, 4);
  }, [normalizedRecords]);

  // ---------------------------------------------------------
  // TABLE DATA
  // Groups records by commodity + variety
  // ---------------------------------------------------------

  const priceRows = useMemo(() => {
    const grouped = {};

    normalizedRecords.forEach(
      (item) => {
        const key = `${item.commodity}-${item.variety}`;

        if (!grouped[key]) {
          grouped[key] = {
            commodity:
              item.commodity,

            variety:
              item.variety,

            markets: {},
          };
        }

        if (
          !grouped[key].markets[
            item.market
          ] ||
          item.modalPrice >
            grouped[key].markets[
              item.market
            ].modalPrice
        ) {
          grouped[key].markets[
            item.market
          ] = item;
        }
      }
    );

    return Object.values(
      grouped
    ).slice(0, 10);
  }, [normalizedRecords]);

  // ---------------------------------------------------------
  // BEST MARKET FOR ROW
  // ---------------------------------------------------------

  const getBestMarket = (row) => {
    let bestMarket = "";
    let bestPrice = 0;

    markets.forEach(
      (market) => {
        const record =
          row.markets[market];

        if (
          record &&
          record.modalPrice >
            bestPrice
        ) {
          bestPrice =
            record.modalPrice;

          bestMarket = market;
        }
      }
    );

    return bestMarket;
  };

  // ---------------------------------------------------------
  // SELECTED CROP MARKET COMPARISON
  // ---------------------------------------------------------

  const marketComparison =
    useMemo(() => {
      return markets
        .map((market) => {
          const recordsForMarket =
            selectedCropRecords.filter(
              (item) =>
                item.market.toLowerCase() ===
                market.toLowerCase()
            );

          if (
            !recordsForMarket.length
          ) {
            return null;
          }

          const prices =
            recordsForMarket
              .map(
                (item) =>
                  item.modalPrice
              )
              .filter(
                (price) =>
                  price > 0
              );

          if (!prices.length) {
            return null;
          }

          const average =
            prices.reduce(
              (sum, price) =>
                sum + price,
              0
            ) / prices.length;

          return {
            market,
            price: average,
          };
        })
        .filter(Boolean);
    }, [
      markets,
      selectedCropRecords,
    ]);

  // ---------------------------------------------------------
  // BEST MARKET FOR SELECTED CROP
  // ---------------------------------------------------------

  const bestMarket = useMemo(() => {
    if (
      !marketComparison.length
    ) {
      return null;
    }

    return [
      ...marketComparison,
    ].sort(
      (a, b) =>
        b.price - a.price
    )[0];
  }, [marketComparison]);

  // ---------------------------------------------------------
  // LATEST DATE
  // ---------------------------------------------------------

  const latestDate = useMemo(() => {
    const dates =
      normalizedRecords
        .map(
          (item) =>
            item.arrivalDate
        )
        .filter(Boolean);

    if (!dates.length) {
      return null;
    }

    return dates
      .sort()
      .reverse()[0];
  }, [normalizedRecords]);

  // ---------------------------------------------------------
  // FORMAT PRICE
  // ---------------------------------------------------------

  const formatPrice = (price) => {
    if (
      !price ||
      Number.isNaN(price)
    ) {
      return "—";
    }

    return `₹${Math.round(
      price
    ).toLocaleString("en-IN")}`;
  };

  // ---------------------------------------------------------
  // LOADING USER
  // ---------------------------------------------------------

  if (!user) {
    return (
      <Layout title="Mandi Market">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">
          <p className="font-serif text-lg font-bold text-[#24352a]">
            Please log in
          </p>

          <p className="mt-2 text-sm text-slate-500">
            You need to be logged in to view
            mandi prices for your location.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mandi Market">
      <div className="space-y-6">

        {/* -------------------------------------------------
            PAGE HEADING
        ------------------------------------------------- */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="font-serif text-2xl font-bold text-[#20291f]">
              Mandi Market Insights
            </h1>

            {/* ONBOARDING LOCATION */}
            {!locationLoading &&
              (farmerLocation.state ||
                farmerLocation.district) && (
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin
                    size={15}
                    className="text-[#2f7357]"
                  />

                  <span>
                    {farmerLocation.district &&
                      `${farmerLocation.district}, `}

                    {farmerLocation.state}
                  </span>
                </div>
              )}
          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              {loading
                ? "Loading live prices..."
                : `Live · ${
                    latestDate
                      ? `Updated ${latestDate}`
                      : "Latest available data"
                  }`}
            </div>

            <button
              onClick={fetchPrices}
              disabled={
                loading ||
                locationLoading
              }
              className="flex items-center gap-2 rounded-full bg-[#2f7357] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#285f49] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>
        </div>

        {/* -------------------------------------------------
            LOCATION INFORMATION
        ------------------------------------------------- */}

        {!locationLoading &&
          farmerLocation.state && (
            <div className="rounded-2xl bg-[#e7edda] px-5 py-4">

              <div className="flex items-start gap-3">

                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-[#2f7357]"
                />

                <div>
                  <p className="font-semibold text-[#24352a]">
                    Prices for your location
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Showing mandi data for{" "}
                    <strong>
                      {farmerLocation.district
                        ? `${farmerLocation.district}, `
                        : ""}
                      {farmerLocation.state}
                    </strong>
                    , based on the location you
                    provided during onboarding.
                  </p>
                </div>

              </div>

            </div>
          )}

        {/* -------------------------------------------------
            ERROR
        ------------------------------------------------- */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* -------------------------------------------------
            LOADING
        ------------------------------------------------- */}

        {(loading ||
          locationLoading) && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-[#2f7357]"
            />

            <p className="mt-4 font-medium text-[#24352a]">
              Fetching live mandi prices...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Getting the latest data from
              data.gov.in
            </p>

          </div>
        )}

        {/* -------------------------------------------------
            NO DATA
        ------------------------------------------------- */}

        {!loading &&
          !locationLoading &&
          !error &&
          normalizedRecords.length ===
            0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-[#e5dfd2]">

              <p className="font-serif text-lg font-bold text-[#24352a]">
                No mandi data available
              </p>

              <p className="mt-2 text-sm text-slate-500">
                No matching mandi records were
                found for your location. Try
                refreshing the data later.
              </p>

            </div>
          )}

        {/* -------------------------------------------------
            MAIN CONTENT
        ------------------------------------------------- */}

        {!loading &&
          !locationLoading &&
          normalizedRecords.length >
            0 && (
            <>

              {/* ------------------------------------------------
                  TODAY'S PRICES
              ------------------------------------------------ */}

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e5dfd2]">

                {/* Table heading */}

                <div className="flex flex-col gap-3 border-b border-[#e5dfd2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#24352a]">
                      Today's Prices (₹/Quintal)
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Modal prices from the latest
                      mandi records
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <MapPin size={18} />

                    {farmerLocation.district
                      ? `${farmerLocation.district}, `
                      : ""}

                    {farmerLocation.state ||
                      "Your location"}
                  </div>

                </div>

                {/* Responsive table */}

                <div className="overflow-x-auto">

                  <div className="min-w-[900px]">

                    {/* Header */}

                    <div
                      className="grid bg-[#f5f3ee] px-5 py-4 text-sm font-bold text-slate-500"
                      style={{
                        gridTemplateColumns:
                          `1.7fr repeat(${markets.length}, 1.2fr) 1fr`,
                      }}
                    >

                      <div>
                        CROP
                      </div>

                      {markets.map(
                        (market) => (
                          <div key={market}>
                            {market.toUpperCase()}
                          </div>
                        )
                      )}

                      <div>
                        BEST MARKET
                      </div>

                    </div>

                    {/* Rows */}

                    {priceRows.map(
                      (item, index) => {
                        const best =
                          getBestMarket(
                            item
                          );

                        return (
                          <div
                            key={`${item.commodity}-${item.variety}-${index}`}
                            className="grid items-center border-b border-[#e5dfd2] px-5 py-5 last:border-b-0"
                            style={{
                              gridTemplateColumns:
                                `1.7fr repeat(${markets.length}, 1.2fr) 1fr`,
                            }}
                          >

                            {/* Crop */}

                            <div>
                              <p className="font-serif text-lg font-bold text-[#24352a]">
                                {item.commodity ||
                                  "Unknown"}
                              </p>

                              <p className="text-sm text-slate-500">
                                {item.variety ||
                                  "Variety not specified"}
                              </p>
                            </div>

                            {/* Market prices */}

                            {markets.map(
                              (market) => {
                                const record =
                                  item.markets[
                                    market
                                  ];

                                const isBest =
                                  best ===
                                    market &&
                                  record;

                                return (
                                  <PriceCell
                                    key={
                                      market
                                    }
                                    price={
                                      record
                                        ? record.modalPrice
                                        : null
                                    }
                                    best={
                                      isBest
                                    }
                                  />
                                );
                              }
                            )}

                            {/* Best market */}

                            <div>
                              {best ? (
                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                  {best}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              </div>

              {/* ------------------------------------------------
                  BOTTOM SECTION
              ------------------------------------------------ */}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">

                {/* MARKET COMPARISON */}

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h2 className="font-serif text-lg font-bold text-[#24352a]">
                        Market Price Comparison
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Compare current{" "}
                        {selectedCrop ||
                          "crop"}{" "}
                        prices across
                        available markets
                      </p>
                    </div>

                    <select
                      value={
                        selectedCrop
                      }
                      onChange={(e) =>
                        setSelectedCrop(
                          e.target.value
                        )
                      }
                      className="rounded-full border-0 bg-[#ebe8e1] px-4 py-2 text-sm font-medium text-[#24352a] outline-none"
                    >
                      {crops.map(
                        (crop) => (
                          <option
                            key={crop}
                            value={crop}
                          >
                            {crop}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  {/* Comparison cards */}

                  <div className="mt-6 space-y-4">

                    {marketComparison.length ===
                      0 && (
                      <div className="rounded-2xl bg-[#f5f3ee] p-5 text-center text-sm text-slate-500">
                        No market prices
                        available for
                        this crop.
                      </div>
                    )}

                    {marketComparison.map(
                      (item) => {
                        const isBest =
                          bestMarket?.market ===
                          item.market;

                        const maxPrice =
                          Math.max(
                            ...marketComparison.map(
                              (market) =>
                                market.price
                            )
                          ) || 1;

                        const width =
                          (item.price /
                            maxPrice) *
                          100;

                        return (
                          <div
                            key={
                              item.market
                            }
                          >

                            <div className="flex items-center justify-between">

                              <div className="flex items-center gap-2">

                                <MapPin
                                  size={16}
                                  className="text-[#2f7357]"
                                />

                                <span className="font-medium text-[#24352a]">
                                  {
                                    item.market
                                  }
                                </span>

                                {isBest && (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                                    BEST
                                  </span>
                                )}

                              </div>

                              <span className="font-bold text-[#24352a]">
                                {formatPrice(
                                  item.price
                                )}
                              </span>

                            </div>

                            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ebe8e1]">

                              <div
                                className="h-full rounded-full bg-[#2f7357] transition-all"
                                style={{
                                  width: `${width}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                  {/* API information */}

                  <div className="mt-6 rounded-2xl bg-[#f5f3ee] p-4">

                    <div className="flex items-start gap-3">

                      <TrendingUp
                        size={20}
                        className="mt-0.5 text-[#2f7357]"
                      />

                      <div>

                        <p className="font-semibold text-[#24352a]">
                          Live market data
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Prices shown here
                          are based on
                          the latest mandi
                          records returned
                          by the government
                          data API. The
                          comparison uses
                          modal prices.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/* AI RECOMMENDATION + MARKETS */}

                <div className="space-y-5">

                  {/* Recommendation */}

                  <div className="rounded-3xl bg-[#2f7357] p-5">

                    <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-white">

                      <TrendingUp
                        size={20}
                        className="text-yellow-300"
                      />

                      Market Insight

                    </h2>

                    {bestMarket ? (
                      <div className="mt-4">

                        <div className="rounded-2xl bg-[#438063] px-4 py-4">

                          <p className="text-sm text-green-100">
                            Best current
                            price for
                          </p>

                          <p className="mt-1 text-xl font-bold text-white">
                            {
                              selectedCrop
                            }
                          </p>

                          <div className="mt-3 flex items-center justify-between">

                            <div>

                              <p className="text-sm text-green-100">
                                {
                                  bestMarket.market
                                }
                              </p>

                              <p className="text-lg font-bold text-white">
                                {formatPrice(
                                  bestMarket.price
                                )}

                                <span className="ml-1 text-xs font-normal">
                                  /Q
                                </span>
                              </p>

                            </div>

                            <div className="rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white">
                              Highest
                            </div>

                          </div>

                        </div>

                        <p className="mt-3 text-xs leading-5 text-green-100">
                          This is a price
                          comparison based
                          on the current
                          API data. Actual
                          selling decisions
                          should also consider
                          transport, quality,
                          demand and local
                          market conditions.
                        </p>

                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-green-100">
                        No recommendation
                        can be generated
                        because there is not
                        enough current price
                        data.
                      </p>
                    )}

                  </div>

                  {/* AVAILABLE MANDIS */}

                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

                    <h2 className="font-serif text-lg font-bold text-[#24352a]">
                      Available Mandis
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Markets returned by
                      the live API
                    </p>

                    <div className="mt-3">

                      {markets.map(
                        (market) => {

                          const marketRecords =
                            normalizedRecords.filter(
                              (item) =>
                                item.market ===
                                market
                            );

                          const districts = [
                            ...new Set(
                              marketRecords
                                .map(
                                  (item) =>
                                    item.district
                                )
                                .filter(
                                  Boolean
                                )
                            ),
                          ];

                          return (
                            <div
                              key={
                                market
                              }
                              className="flex items-center justify-between border-b border-[#e5dfd2] py-4 last:border-b-0"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3df] text-[#2f7357]">
                                  <MapPin
                                    size={19}
                                  />
                                </div>

                                <div>

                                  <p className="font-medium text-[#24352a]">
                                    {
                                      market
                                    }
                                  </p>

                                  <p className="text-sm text-slate-500">
                                    {districts.join(
                                      ", "
                                    ) ||
                                      farmerLocation.district ||
                                      farmerLocation.state ||
                                      "Location unavailable"}
                                  </p>

                                </div>

                              </div>

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                Available
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>

                </div>
              </div>
            </>
          )}

      </div>
    </Layout>
  );
}

/* -----------------------------------------
   PRICE CELL
----------------------------------------- */

function PriceCell({
  price,
  best,
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className={`text-lg font-bold ${
          best
            ? "text-[#2f7357]"
            : "text-[#20291f]"
        }`}
      >
        {price
          ? `₹${Math.round(
              price
            ).toLocaleString(
              "en-IN"
            )}`
          : "—"}
      </span>

      {best && (
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
          Best
        </span>
      )}

    </div>
  );
}