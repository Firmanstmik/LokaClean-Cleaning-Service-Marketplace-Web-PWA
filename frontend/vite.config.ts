/**
 * Vite config for LokaClean frontend.
 *
 * Mobile-first web app that can be wrapped as a PWA/Hybrid shell later.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
// import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  plugins: [
    react(),
    // ViteImageOptimizer({
    //   exclude: ['**/maskot_fixed.jpg', '**/Logo_LokaClean_fixed.jpg', '**/logo*.jpg', '**/*.png'], 
    //   png: {
    //     quality: 80,
    //   },
    //   jpeg: {
    //     quality: 80,
    //   },
    //   jpg: {
    //     quality: 80,
    //   },
    //   webp: {
    //     lossless: true,
    //   },
    // }),
    // "PWA-ready" foundation: installable web app + offline caching can be enabled gradually.
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "LokaClean",
        short_name: "LokaClean",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0F172A",
        theme_color: "#0F766E",
        description: "Layanan Kebersihan Profesional di Lombok",
        icons: [
          {
            src: "/img/Logo_LokaClean_fixed.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any maskable"
          },
          {
            src: "/img/Logo_LokaClean.jpg",
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
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "es2015"
  }
});


