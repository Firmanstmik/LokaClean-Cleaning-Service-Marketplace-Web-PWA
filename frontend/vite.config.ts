/**
 * Vite config for LokaClean frontend.
 *
 * Mobile-first web app that can be wrapped as a PWA/Hybrid shell later.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // "PWA-ready" foundation: installable web app + offline caching can be enabled gradually.
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "LokaClean",
        short_name: "LokaClean",
        description: "Room cleaning marketplace (Phase 1)",
        theme_color: "#0ea5e9",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/img/logo.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any maskable"
          },
          {
            src: "/img/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});


