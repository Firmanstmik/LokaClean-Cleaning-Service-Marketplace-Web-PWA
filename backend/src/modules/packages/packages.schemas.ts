/**
 * Zod schemas for PaketCleaning endpoints.
 */

import { z } from "zod";

const intField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return val;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().int().nonnegative());

export const createPackageSchema = z.object({
  name: z.string().min(1),
  name_en: z.string().optional(),
  description: z.string().min(1),
  description_en: z.string().optional(),
  price: intField,
  estimated_duration: intField
});

export const updatePackageSchema = createPackageSchema.partial();


