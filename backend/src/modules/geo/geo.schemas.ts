/**
 * Schemas for lightweight geo helpers (reverse geocode and forward geocode).
 */

import { z } from "zod";

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  lang: z.string().min(1).optional()
});

export const forwardGeocodeQuerySchema = z.object({
  q: z.string().min(1),
  lang: z.string().min(1).optional()
});

export const findNearestCleanersSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export const updateLocationSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number()
});
