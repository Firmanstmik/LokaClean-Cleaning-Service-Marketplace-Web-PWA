/**
 * Typed environment variables using Zod.
 *
 * This prevents "undefined" config values from creeping into runtime behavior.
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  BASE_URL: z.string().url().default("http://localhost:4000"),
  UPLOAD_DIR: z.string().min(1).default("uploads"),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),

  // Optional: reverse geocoding (OpenStreetMap Nominatim).
  // In production you may want to use your own Nominatim instance or a paid geocoding provider.
  NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  NOMINATIM_USER_AGENT: z.string().min(1).default("LokaClean"),
  NOMINATIM_EMAIL: z.string().min(1).optional(),

  // Midtrans payment gateway configuration
  // IMPORTANT: Use SANDBOX credentials for development, PRODUCTION for live payments
  // Optional: Payment features will be disabled if not provided
  MIDTRANS_SERVER_KEY: z.string().min(1).optional(),
  MIDTRANS_CLIENT_KEY: z.string().min(1).optional(),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false) // false = sandbox, true = production
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;


