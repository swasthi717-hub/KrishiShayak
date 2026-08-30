import React from "react";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Leaf,
} from "lucide-react";

import Layout from "./Layout.jsx";

const prices = [
  {
    crop: "Tomato",
    variety: "Hybrid",
    nashik: "₹1,960",
    pune: "₹1,840",
    kolhapur: "₹1,720",
    solapur: "₹1,890",
    change: "↗ 12.4%",
    changeType: "up",
    best: "nashik",
  },
  {
    crop: "Onion",
    variety: "Red",
    nashik: "₹1,980",
    pune: "₹2,100",
    kolhapur: "₹2,240",
    solapur: "₹2,150",
    change: "↘ 3.2%",
    changeType: "down",
    best: "kolhapur",
  },
  {
    crop: "Cotton",
    variety: "Long Staple",
    nashik: "₹6,920",
    pune: "₹6,850",
    kolhapur: "₹6,780",
    solapur: "₹6,900",
    change: "↗ 5.8%",
    changeType: "up",
    best: "nashik",
  },
  {
    crop: "Wheat",
    variety: "Sharbati",
    nashik: "₹2,380",
    pune: "₹2,300",
    kolhapur: "₹2,260",
    solapur: "₹2,320",
    change: "— Stable",
    changeType: "stable",
    best: "nashik",
  },
  {
    crop: "Soybean",
    variety: "Yellow",
    nashik: "₹4,800",
    pune: "₹4,920",
    kolhapur: "₹4,750",
    solapur: "₹4,870",
    change: "↘ 1.1%",
    changeType: "down",
    best: "pune",
  },
];

const nearbyMandis = [
  {
    name: "Nashik APMC",
    distance: "8 km away",
  },
  {
    name: "Pune APMC",
    distance: "42 km away",
  },
  {
    name: "Igatpuri Mandi",
    distance: "25 km away",
  },
];

export default function MandiMarketPage() {
  return (
    <Layout title="Mandi Market">
      <div className="space-y-6">

        {/* Page heading */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-[#20291f]">
            Mandi Market Insights
          </h1>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Live · Updated 15 min ago
          </div>
        </div>

        {/* Today's Prices */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e5dfd2]">

          {/* Table heading */}
          <div className="flex items-center justify-between border-b border-[#e5dfd2] px-5 py-5">
            <h2 className="font-serif text-lg font-bold text-[#24352a]">
              Today's Prices (₹/Quintal)
            </h2>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <MapPin size={18} />
              Maharashtra
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1.7fr_repeat(4,1.2fr)_1fr] bg-[#f5f3ee] px-5 py-4 text-sm font-bold text-slate-500">

            <div>CROP</div>
            <div>NASHIK</div>
            <div>PUNE</div>
            <div>KOLHAPUR</div>
            <div>SOLAPUR</div>
            <div>CHANGE</div>

          </div>

          {/* Rows */}
          {prices.map((item) => (
            <div
              key={item.crop}
              className="grid grid-cols-[1.7fr_repeat(4,1.2fr)_1fr] items-center border-b border-[#e5dfd2] px-5 py-5 last:border-b-0"
            >

              {/* Crop */}
              <div>
                <p className="font-serif text-lg font-bold text-[#24352a]">
                  {item.crop}
                </p>
                <p className="text-sm text-slate-500">
                  {item.variety}
                </p>
              </div>

              {/* Nashik */}
              <PriceCell
                price={item.nashik}
                best={item.best === "nashik"}
              />

              {/* Pune */}
              <PriceCell
                price={item.pune}
                best={item.best === "pune"}
              />

              {/* Kolhapur */}
              <PriceCell
                price={item.kolhapur}
                best={item.best === "kolhapur"}
              />

              {/* Solapur */}
              <PriceCell
                price={item.solapur}
                best={item.best === "solapur"}
              />

              {/* Change */}
              <div>
                <span
                  className={`inline-flex min-w-[105px] justify-center rounded-full px-3 py-1 text-xs font-bold ${
                    item.changeType === "up"
                      ? "bg-green-100 text-green-700"
                      : item.changeType === "down"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.change}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">

          {/* Price Trend */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#24352a]">
                4-Week Price Trend
              </h2>

              <select className="rounded-full border-0 bg-[#ebe8e1] px-4 py-2 text-sm font-medium text-[#24352a] outline-none">
                <option>Tomato</option>
                <option>Onion</option>
                <option>Cotton</option>
                <option>Wheat</option>
              </select>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-5 text-sm text-slate-500">

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2f7357]" />
                Tomato
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400" />
                Onion
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                Cotton
              </div>

            </div>

            {/* Chart */}
            <div className="relative mt-5 h-[230px] w-full">

              {/* Horizontal grid lines */}
              <div className="absolute left-8 right-2 top-5 border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[75px] border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[130px] border-t border-slate-100" />
              <div className="absolute left-8 right-2 top-[185px] border-t border-slate-100" />

              {/* Y labels */}
              <div className="absolute left-0 top-1 text-xs text-slate-500">
                8000
              </div>
              <div className="absolute left-0 top-[57px] text-xs text-slate-500">
                6000
              </div>
              <div className="absolute left-0 top-[112px] text-xs text-slate-500">
                4000
              </div>
              <div className="absolute left-0 top-[167px] text-xs text-slate-500">
                2000
              </div>
              <div className="absolute bottom-0 left-4 text-xs text-slate-500">
                0
              </div>

              {/* SVG chart */}
              <svg
                viewBox="0 0 700 220"
                className="absolute left-8 right-0 top-0 h-[210px] w-[calc(100%-32px)]"
                preserveAspectRatio="none"
              >

                {/* Tomato */}
                <polyline
                  points="20,175 235,165 450,160 665,145"
                  fill="none"
                  stroke="#2f7357"
                  strokeWidth="3"
                />

                {/* Onion */}
                <polyline
                  points="20,115 235,117 450,120 665,123"
                  fill="none"
                  stroke="#f4a261"
                  strokeWidth="3"
                />

                {/* Cotton */}
                <polyline
                  points="20,40 235,38 450,36 665,33"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />

                {/* Tomato dots */}
                <circle cx="20" cy="175" r="5" fill="#2f7357" />
                <circle cx="235" cy="165" r="5" fill="#2f7357" />
                <circle cx="450" cy="160" r="5" fill="#2f7357" />
                <circle cx="665" cy="145" r="5" fill="#2f7357" />

                {/* Onion dots */}
                <circle cx="20" cy="115" r="5" fill="#f4a261" />
                <circle cx="235" cy="117" r="5" fill="#f4a261" />
                <circle cx="450" cy="120" r="5" fill="#f4a261" />
                <circle cx="665" cy="123" r="5" fill="#f4a261" />

                {/* Cotton dots */}
                <circle cx="20" cy="40" r="5" fill="#3b82f6" />
                <circle cx="235" cy="38" r="5" fill="#3b82f6" />
                <circle cx="450" cy="36" r="5" fill="#3b82f6" />
                <circle cx="665" cy="33" r="5" fill="#3b82f6" />

              </svg>

              {/* X labels */}
              <div className="absolute bottom-0 left-[7%] text-xs text-slate-500">
                W1
              </div>
              <div className="absolute bottom-0 left-[38%] text-xs text-slate-500">
                W2
              </div>
              <div className="absolute bottom-0 left-[68%] text-xs text-slate-500">
                W3
              </div>
              <div className="absolute bottom-0 right-[1%] text-xs text-slate-500">
                W4
              </div>

            </div>
          </div>

          {/* AI Recommendation + Nearby Mandis */}
          <div className="space-y-5">

            {/* AI Recommendation */}
            <div className="rounded-3xl bg-[#2f7357] p-5">

              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-white">
                <Zap
                  size={20}
                  className="text-yellow-300"
                  fill="currentColor"
                />
                AI Market Recommendation
              </h2>

              <div className="mt-4 space-y-3">

                {/* Tomato */}
                <Recommendation
                  icon="🍅"
                  crop="Tomato"
                  description="Nashik mandi · ₹1,960/Q"
                  action="Sell Today"
                  actionClass="bg-green-500"
                />

                {/* Onion */}
                <Recommendation
                  icon="🧅"
                  crop="Onion"
                  description="Prices likely to recover"
                  action="Wait 5–7 Days"
                  actionClass="bg-yellow-500"
                />

                {/* Cotton */}
                <Recommendation
                  icon="🌾"
                  crop="Cotton"
                  description="Nashik mandi · ₹6,920/Q"
                  action="Sell Today"
                  actionClass="bg-green-500"
                />

              </div>
            </div>

            {/* Nearby Mandis */}
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e5dfd2]">

              <h2 className="font-serif text-lg font-bold text-[#24352a]">
                Nearby Mandis
              </h2>

              <div className="mt-3">

                {nearbyMandis.map((mandi) => (
                  <div
                    key={mandi.name}
                    className="flex items-center justify-between border-b border-[#e5dfd2] py-4 last:border-b-0"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff3df] text-[#2f7357]">
                        <MapPin size={19} />
                      </div>

                      <div>
                        <p className="font-medium text-[#24352a]">
                          {mandi.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {mandi.distance}
                        </p>
                      </div>

                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      Open
                    </span>

                  </div>
                ))}

              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}


/* Price cell */
function PriceCell({ price, best }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-lg font-bold ${
          best ? "text-[#2f7357]" : "text-[#20291f]"
        }`}
      >
        {price}
      </span>

      {best && (
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
          Best
        </span>
      )}
    </div>
  );
}


/* AI recommendation row */
function Recommendation({
  icon,
  crop,
  description,
  action,
  actionClass,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#438063] px-4 py-3">

      <div className="flex items-center gap-3">

        <span className="text-2xl">
          {icon}
        </span>

        <div>
          <p className="font-bold text-white">
            {crop}
          </p>

          <p className="text-sm text-green-100">
            {description}
          </p>
        </div>

      </div>

      <button
        className={`rounded-full px-4 py-2 text-xs font-bold text-white ${actionClass}`}
      >
        {action}
      </button>

    </div>
  );
}