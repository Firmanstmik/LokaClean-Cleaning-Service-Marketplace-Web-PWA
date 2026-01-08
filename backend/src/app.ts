/**
 * Express app wiring (middleware, routes, error handling).
 *
 * Keep this file focused on composition. Business logic belongs in modules/services.
 */

import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Configure CORS first (needed for static files too)
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // In development, allow all localhost origins (Vite can use different ports)
      if (env.NODE_ENV === "development" && (!origin || /^http:\/\/localhost:\d+$/.test(origin))) {
        return callback(null, true);
      }
      // In production, use configured origin
      if (env.CORS_ORIGIN === origin || !origin) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  };

  app.use(cors(corsOptions));

  // Configure Helmet to allow cross-origin images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false // Allow images from different origins
    })
  );

  // Logging (dev-friendly). You can swap morgan for a structured logger later.
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // JSON parsing for most endpoints.
  app.use(express.json({ limit: "1mb" }));

  // Serve uploaded files (local dev). Stored values in DB are "/uploads/<filename>".
  // Add CORS headers explicitly for static files
  app.use(
    "/uploads",
    (req, res, next) => {
      // Set CORS headers for static files
      const origin = req.headers.origin;
      if (env.NODE_ENV === "development" && (!origin || /^http:\/\/localhost:\d+$/.test(origin))) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } else if (env.CORS_ORIGIN === origin || !origin) {
        res.setHeader("Access-Control-Allow-Origin", origin || env.CORS_ORIGIN);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR))
  );

  // API routes
  app.use("/api", apiRouter);

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}


