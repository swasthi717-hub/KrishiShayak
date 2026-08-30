import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./pwa";
import App from "./App.jsx";
import { syncManager } from "./sync/syncManager"; // side-effect import kicks off its constructor

syncManager.trigger(); // attempt a sync immediately on app load, in case items were queued last session

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);