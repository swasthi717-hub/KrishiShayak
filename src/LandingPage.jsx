import {
  Leaf,
  Globe,
  ChevronDown,
  ArrowRight,
  Play,
  Sun,
  CloudSun,
  Sprout,
  IndianRupee,
  Bot,
  Bell,
  BarChart3,
  MapPin,
  Droplets,
  Wind,
  Mic,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: CloudSun,
    title: "Weather Insights",
    description: "Real-time weather updates and 7-day forecasts.",
  },
  {
    icon: Sprout,
    title: "Crop Health",
    description: "Detect diseases early and get expert recommendations.",
  },
  {
    icon: IndianRupee,
    title: "Mandi Market",
    description: "Live mandi prices and market trends.",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    description: "Ask anything in your language. Get instant help.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Timely alerts for weather, pests, and market changes.",
  },
  {
    icon: BarChart3,
    title: "Farm Dashboard",
    description: "Track yields, profits and farm health in one place.",
  },
];

const prices = [
  { crop: "Tomato (Nashik)", price: "₹1,960/Q", change: "+12.4%", up: true },
  { crop: "Onion (Pune)", price: "₹2,240/Q", change: "-3.2%", up: false },
  { crop: "Cotton (Nashik)", price: "₹6,920/Q", change: "+5.8%", up: true },
  { crop: "Wheat (Nashik)", price: "₹2,380/Q", change: "Stable", up: null },
  { crop: "Soybean (Pune)", price: "₹4,920/Q", change: "-1.1%", up: false },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf7ef] text-[#24352a]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f0df]">
            <Leaf className="text-[#1f5b3d]" size={25} />
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold text-[#254a32]">
              KrishiSahayak
            </h1>
            <p className="text-xs text-gray-500">AI Farming Copilot</p>
          </div>
        </div>

        <div className="hidden items-center gap-9 text-sm text-gray-700 lg:flex">
          <a href="#features" className="hover:text-[#1f6b48]">Features</a>
          <a href="#how-it-works" className="hover:text-[#1f6b48]">How it Works</a>
          <a href="#prices" className="hover:text-[#1f6b48]">Mandi Prices</a>
          <a href="#about" className="hover:text-[#1f6b48]">About Us</a>
        </div>

        <div className="flex items-center gap-5">
          <button className="hidden items-center gap-2 text-sm md:flex">
            <Globe size={18} />
            English
            <ChevronDown size={16} />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-[#214d34] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#173b27]"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-10 pt-10 md:px-12 lg:px-20 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">

          {/* Left */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#e7edda] px-4 py-2 text-sm font-semibold text-[#496044]">
              <Leaf size={16} />
              AI-POWERED <span>•</span> FARMER-FIRST
            </div>

            <h2 className="font-serif text-5xl font-semibold leading-tight text-[#294732] md:text-6xl">
              Your AI Copilot for
              <span className="block italic text-[#527246]">
                Smarter Farming
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Real-time weather insights, crop health analysis, mandi prices
              and personalized recommendations — all in your language, all in
              one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-3 rounded-xl bg-[#28583c] px-6 py-4 font-medium text-white shadow-lg transition hover:bg-[#1d422d]"
              >
                Get Started for Free
                <ArrowRight size={18} />
              </button>

              <button className="flex items-center gap-3 rounded-xl border border-[#d9d2c3] bg-white/60 px-6 py-4 font-medium text-[#36533e] transition hover:bg-white">
                <Play size={16} fill="currentColor" />
                Watch Demo
              </button>
            </div>

            <div className="mt-9 flex items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#faf7ef] bg-[#d8c29b] text-xs"
                  >
                    🌾
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                Trusted by <span className="font-bold text-[#31583d]">10,000+</span>{" "}
                farmers across India
              </p>
            </div>
          </div>

          {/* Right Hero Visual */}
          <div className="relative">
            <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#356445] via-[#6f8b50] to-[#d7c06d] shadow-xl">

              {/* Decorative farm background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-20 top-20 h-96 w-96 rounded-full border-[35px] border-white" />
                <div className="absolute bottom-0 left-0 h-40 w-full bg-[#31543a]" />
              </div>

              {/* AI Voice Card */}
              <div className="absolute left-6 top-8 w-[75%] rounded-2xl bg-[#fffdf7]/95 p-5 shadow-lg backdrop-blur">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2c6846] text-white">
                    <Leaf size={18} />
                  </div>

                  <div>
                    <p className="font-medium text-[#253b2d]">
                      नमस्ते! मैं KrishiSahayak AI हूँ
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      आपकी फसल में कैसे मदद कर सकता हूँ?
                    </p>

                    <div className="mt-4 flex items-center gap-1">
                      {[8, 16, 11, 24, 14, 20, 9, 18, 12, 7].map((height, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-[#5c8153]"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-400">00:06</span>
                    </div>
                  </div>
                </div>

                <button className="absolute -bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#2c6846] text-white shadow-lg">
                  <Mic size={19} />
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="absolute bottom-12 left-8 grid grid-cols-2 gap-3">
                {[
                  ["🌱", "फसल पर सलाह"],
                  ["🌤️", "मौसम जानकारी"],
                  ["₹", "मंडी भाव"],
                  ["🐛", "कीट पहचान"],
                ].map(([icon, text]) => (
                  <div
                    key={text}
                    className="rounded-xl bg-white/90 px-4 py-3 text-sm font-medium text-[#35523d] shadow-md"
                  >
                    <span className="mr-2">{icon}</span>
                    {text}
                  </div>
                ))}
              </div>

              {/* Weather Card */}
              <div className="absolute bottom-7 right-6 rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center gap-3">
                  <Sun className="text-[#d79a1d]" size={28} />
                  <div>
                    <p className="text-2xl font-bold">34°C</p>
                    <p className="text-xs text-gray-500">Partly Sunny</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t pt-3 text-xs text-gray-600">
                  <p className="flex items-center gap-2">
                    <MapPin size={13} /> Nashik, Maharashtra
                  </p>
                  <p className="flex items-center gap-2">
                    <Droplets size={13} /> Humidity 68%
                  </p>
                  <p className="flex items-center gap-2">
                    <Wind size={13} /> Wind 12 km/h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Mandi Price Ticker */}
      <section id="prices" className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-2xl bg-[#1f492f] px-6 py-5 text-white lg:flex-row lg:items-center">
          <div className="flex min-w-fit items-center gap-3">
            <BarChart3 size={25} />
            <div>
              <p className="font-semibold">Live Mandi Prices</p>
              <p className="text-xs text-green-300">● Live</p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-5 md:grid-cols-5">
            {prices.map((item) => (
              <div key={item.crop} className="border-l border-white/15 pl-4">
                <p className="text-xs text-white/70">{item.crop}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-semibold">{item.price}</span>
                  {item.up === true && (
                    <TrendingUp size={13} className="text-green-300" />
                  )}
                  {item.up === false && (
                    <TrendingDown size={13} className="text-red-300" />
                  )}
                  <span className="text-xs text-white/70">{item.change}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="flex min-w-fit items-center gap-2 text-sm">
            View All Prices <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-4xl text-[#35523d]">
              Everything You Need, All in One Place
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#c9a24b]" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[#e5dfd2] bg-white/50 p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf2e7]">
                    <Icon className="text-[#396145]" size={24} />
                  </div>

                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 rounded-2xl border border-[#e5dfd2] bg-[#f4f1e7] p-8 md:grid-cols-4">
          {[
            ["10,000+", "Farmers Empowered"],
            ["50+", "Crops Supported"],
            ["500+", "Districts Covered"],
            ["95%", "Accuracy in Predictions"],
          ].map(([number, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-semibold text-[#31563c]">{number}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}