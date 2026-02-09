/**
 * Frontend entrypoint.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import "./styles.css";

// Leaflet marker icon fix (must be imported once).
import "./lib/leaflet";

import { App } from "./App";
import { registerSW } from 'virtual:pwa-register';

// Auto-update Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, auto-updating...");
    // Force reload immediately when new content is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


