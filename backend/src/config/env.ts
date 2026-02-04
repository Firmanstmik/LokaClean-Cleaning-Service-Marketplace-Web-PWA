/**
 * Typed environment variables using Zod.
 *
 * This prevents "undefined" config values from creeping into runtime behavior.
 */

import { z } from "zod";

const envSchema = z.object({
  // =====================
  // Server
  // =====================
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // =====================
  // CORS & BASE URL
  // =====================
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  BASE_URL: z.string().url().default("http://localhost:4000"),

  // =====================
  // Upload
  // =====================
  UPLOAD_DIR: z.string().min(1).default("uploads"),

  // =====================
  // Database
  // =====================
  DATABASE_URL: z.string().min(1),

  // =====================
  // Auth (JWT)
  // =====================
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),

  // =====================
  // Optional: Reverse Geocoding
  // =====================
  NOMINATIM_BASE_URL: z
    .string()
    .url()
    .default("https://nominatim.openstreetmap.org"),
  NOMINATIM_USER_AGENT: z.string().min(1).default("LokaClean"),
  NOMINATIM_EMAIL: z.string().min(1).optional(),

  // =====================
  // Midtrans Payment Gateway
  // =====================
  // IMPORTANT:
  // - Sandbox  : MIDTRANS_IS_PRODUCTION=false
  // - Live     : MIDTRANS_IS_PRODUCTION=true
  // - Boolean ENV TIDAK boleh pakai z.coerce.boolean()
  MIDTRANS_SERVER_KEY: z.string().min(1).optional(),
  MIDTRANS_CLIENT_KEY: z.string().min(1).optional(),
  MIDTRANS_IS_PRODUCTION: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .default("false")
,

  // =====================
  // Web Push (VAPID)
  // =====================
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().min(1).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

// =====================
// Debug helper (optional)
// =====================
if (env.NODE_ENV === "development") {
  console.log("[ENV]", {
    NODE_ENV: env.NODE_ENV,
    MIDTRANS_IS_PRODUCTION: env.MIDTRANS_IS_PRODUCTION
  });
}
