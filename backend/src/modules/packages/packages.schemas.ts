/**
 * Zod schemas for PaketCleaning endpoints.
 */

import { z } from "zod";

const intField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return val;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().int().nonnegative());

const discountField = z
  .preprocess((val) => {
    if (val === undefined || val === null || val === "") return val;
    const num = Number(val);
    return Number.isFinite(num) ? num : val;
  }, z.number().int())
  .refine((n) => n >= 0 && n <= 100, { message: "discount_percentage must be 0..100" });

const packageBaseSchema = z.object({
  name: z.string().min(1),
  name_en: z.string().optional(),
  description: z.string().min(1),
  description_en: z.string().optional(),
  base_price: intField.optional(),
  discount_percentage: discountField.optional(),
  discount_edition: z.string().optional(),
  pricing_note: z.string().optional(),
  estimated_duration: intField.optional()
});

export const createPackageSchema = packageBaseSchema.refine((data) => {
  const base = typeof data.base_price === "number" ? data.base_price : 0;
  const note = (data.pricing_note ?? "").trim();
  return base > 0 || note.length > 0;
}, {
  message: "base_price is required when pricing_note is empty",
  path: ["base_price"]
});

export const updatePackageSchema = packageBaseSchema.partial();


