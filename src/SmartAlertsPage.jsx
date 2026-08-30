import React, { useState } from "react";

import {
  Bell,
  CloudRain,
  Bug,
  TrendingUp,
  AlertTriangle,
  Mic,
  CheckCircle2,
} from "lucide-react";

import Layout from "./Layout.jsx";

const ALERTS = [
  {
    id: 1,
    section: "action",
    title: "Pest Outbreak Warning",
    description:
      "High pink bollworm risk in cotton fields across Nashik region. Inspect field and apply recommended pesticide.",
    time: "2 hours ago",
    severity: "High",
    icon: AlertTriangle,
    unread: true,
  },
  {
    id: 2,
    section: "action",
    title: "Heavy Rain Alert",
    description:
      "Heavy rainfall expected tomorrow (80mm). Skip irrigation today. Drain excess water from paddy fields.",
    time: "4 hours ago",
    severity: "High",
    icon: CloudRain,
    unread: true,
  },
  {
    id: 3,
    section: "notification",
    title: "Tomato Price Rising",
    description:
      "Tomato prices at Nashik mandi up 12% this week (₹1,960/Q). Good time to sell your produce.",
    time: "6 hours ago",
    severity: "Medium",
    icon: TrendingUp,
    unread: true,
  },
  {
    id: 4,
    section: "notification",
    title: "Heatwave Risk Next Week",
    description:
      "Temperature forecast to exceed 40°C next Tuesday–Wednesday. Increase irrigation frequency for all crops.",
    time: "1 day ago",
    severity: "Medium",
    icon: CloudRain,
    unread: false,
  },
  {
    id: 5,
    section: "notification",
    title: "Yield Risk: Low Soil Moisture",
    description:
      "Soil moisture sensors indicate below-optimal levels in Block C. Consider targeted irrigation today.",
    time: "1 day ago",
    severity: "Low",
    icon: AlertTriangle,
    unread: false,
  },
  {
    id: 6,
    section: "notification",
    title: "Onion Price Declining",
    description:
      "Onion prices down 3.2% this week. Consider holding stock for 5–7 days for better returns.",
    time: "2 days ago",
    severity: "Low",
    icon: TrendingUp,
    unread: false,
  },
];

function getSeverityClass(severity) {
  if (severity === "High") {
    return "bg-red-100 text-red-700";
  }

  if (severity === "Medium") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-slate-100 text-slate-500";
}

function getAlertCardClass(alert, readAlerts) {
  const isRead = readAlerts.includes(alert.id);

  if (isRead) {
    return "border-[#dfe5df] bg-[#f7f7f3]";
  }

  if (alert.section === "action") {
    return "border-red-300 bg-[#fff3f3]";
  }

  if (alert.id === 3) {
    return "border-green-200 bg-[#f0fff5]";
  }

  if (alert.id === 4) {
    return "border-blue-200 bg-[#f3f8ff]";
  }

  if (alert.id === 5) {
    return "border-orange-200 bg-[#fff8ed]";
  }

  return "border-green-200 bg-[#f3fff6]";
}

export default function SmartAlertsPage() {
  const [readAlerts, setReadAlerts] = useState([]);

  function markAsRead(id) {
    setReadAlerts((previous) => {
      if (previous.includes(id)) {
        return previous;
      }

      return [...previous, id];
    });
  }

  function markAllAsRead() {
    setReadAlerts(ALERTS.map((alert) => alert.id));
  }

  const unreadCount = ALERTS.filter(
    (alert) => alert.unread && !readAlerts.includes(alert.id)
  ).length;

  const actionAlerts = ALERTS.filter(
    (alert) => alert.section === "action"
  );

  const notificationAlerts = ALERTS.filter(
    (alert) => alert.section === "notification"
  );

  return (
    <Layout title="Smart Alerts">

      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2  className="font-serif text-2xl font-bold text-[#20291f]">
            Smart Alert Center
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread alerts
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="flex w-fit items-center gap-2 rounded-full bg-[#d9f4df] px-4 py-2 text-sm font-semibold text-[#2d7355] transition hover:bg-[#c9ebd1]"
        >
          <CheckCircle2 size={17} />
          Mark All Read
        </button>
      </div>

      {/* Alert Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Weather */}
        <div className="rounded-2xl bg-[#eef5ff] p-5">
          <div className="flex items-center gap-3">
            <CloudRain
              size={22}
              className="text-blue-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                2
              </p>

              <p className="text-sm text-slate-500">
                Weather
              </p>
            </div>
          </div>
        </div>

        {/* Pest */}
        <div className="rounded-2xl bg-[#fff0f1] p-5">
          <div className="flex items-center gap-3">
            <Bug
              size={22}
              className="text-red-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                1
              </p>

              <p className="text-sm text-slate-500">
                Pest & Disease
              </p>
            </div>
          </div>
        </div>

        {/* Market */}
        <div className="rounded-2xl bg-[#effbf3] p-5">
          <div className="flex items-center gap-3">
            <TrendingUp
              size={22}
              className="text-green-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                2
              </p>

              <p className="text-sm text-slate-500">
                Market Price
              </p>
            </div>
          </div>
        </div>

        {/* Yield */}
        <div className="rounded-2xl bg-[#fff7ec] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={22}
              className="text-orange-500"
            />

            <div>
              <p className="text-2xl font-bold text-[#24352a]">
                1
              </p>

              <p className="text-sm text-slate-500">
                Yield Risk
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Action Required */}
      <section className="mt-7">

        <div className="mb-4 flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-red-400" />

          <h3 className="text-lg font-bold text-red-600">
            Smart Alerts — Action Required
          </h3>

          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
            {actionAlerts.filter(
              (alert) =>
                alert.unread && !readAlerts.includes(alert.id)
            ).length}{" "}
            Unread
          </span>
        </div>

        <div className="space-y-3">
          {actionAlerts.map((alert) => {
            const Icon = alert.icon;
            const isRead = readAlerts.includes(alert.id);

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-5 transition ${getAlertCardClass(
                  alert,
                  readAlerts
                )}`}
              >
                <div className="flex gap-4">

                  <div className="shrink-0 pt-0.5">
                    <Icon
                      size={22}
                      className={
                        isRead
                          ? "text-slate-400"
                          : "text-red-500"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <h4
                        className={`text-lg font-bold ${
                          isRead
                            ? "text-slate-500"
                            : "text-red-600"
                        }`}
                      >
                        {alert.title}
                      </h4>

                      <span className="shrink-0 text-sm text-slate-500">
                        {alert.time}
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-base leading-6 ${
                        isRead
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      {alert.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4">

                      <button
                        onClick={() => {
                          alert.id === 1 && markAsRead(alert.id);
                          alert.id === 2 && markAsRead(alert.id);
                        }}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#2d7355] hover:text-[#1f5b3d]"
                      >
                        <Mic size={15} />
                        Ask AI
                      </button>

                      {!isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Mark Read
                        </button>
                      )}

                    </div>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Notifications */}
      <section className="mt-8">

        <div className="mb-4 flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-blue-400" />

          <h3 className="text-lg font-bold text-[#24352a]">
            Notifications
          </h3>

          <span className="rounded-full bg-[#e9e7df] px-2.5 py-1 text-xs font-bold text-slate-500">
            {
              notificationAlerts.filter(
                (alert) =>
                  alert.unread &&
                  !readAlerts.includes(alert.id)
              ).length
            }{" "}
            Unread
          </span>
        </div>

        <div className="space-y-3">

          {notificationAlerts.map((alert) => {
            const Icon = alert.icon;
            const isRead = readAlerts.includes(alert.id);

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-5 transition ${getAlertCardClass(
                  alert,
                  readAlerts
                )}`}
              >

                <div className="flex gap-4">

                  <div className="shrink-0 pt-0.5">
                    <Icon
                      size={22}
                      className={
                        isRead
                          ? "text-slate-400"
                          : alert.id === 3
                          ? "text-green-500"
                          : alert.id === 4
                          ? "text-blue-400"
                          : "text-orange-400"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col justify-between gap-2 sm:flex-row">

                      <h4
                        className={`text-lg font-bold ${
                          isRead
                            ? "text-slate-400"
                            : "text-[#24352a]"
                        }`}
                      >
                        {alert.title}
                      </h4>

                      <span className="shrink-0 text-sm text-slate-500">
                        {alert.time}
                      </span>

                    </div>

                    <p
                      className={`mt-2 text-base leading-6 ${
                        isRead
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      {alert.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4">

                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#2d7355] hover:text-[#1f5b3d]"
                      >
                        <Mic size={15} />
                        Ask AI
                      </button>

                      {!isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Mark Read
                        </button>
                      )}

                    </div>

                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </section>

    </Layout>
  );
}