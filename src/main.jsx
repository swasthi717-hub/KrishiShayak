import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./pwa";

import App from "./App.jsx";
import { syncManager } from "./sync/syncManager";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

syncManager.trigger();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);