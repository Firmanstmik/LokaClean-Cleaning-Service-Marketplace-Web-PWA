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


