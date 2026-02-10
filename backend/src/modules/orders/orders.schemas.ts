/**
 * Zod schemas for Pesanan (Order) endpoints.
 */

import { z } from "zod";

const intField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return val;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().int());

const floatField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return val;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number());

export const createOrderInputSchema = z.object({
  paket_id: intField,
  payment_method: z.enum(["QRIS", "DANA", "TRANSFER", "CASH"]),
  location_latitude: floatField,
  location_longitude: floatField,
  address: z.string().min(1),
  scheduled_date: z.preprocess((val) => {
    if (typeof val === "string" || val instanceof Date) return new Date(val);
    return val;
  }, z.date()),
  extras: z.string().optional().transform((val) => {
    if (!val) return [];
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }).pipe(z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
  })).optional().default([]))
});

export const createRatingSchema = z.object({
  rating_value: intField.refine((n) => n >= 1 && n <= 5, { message: "rating_value must be 1..5" }),
  review: z.string().max(2000).optional()
});

export const createTipSchema = z.object({
  amount: intField.refine((n) => n >= 0, { message: "amount must be >= 0" })
});

export const adminUpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "IN_PROGRESS", "COMPLETED"])
});

export const updatePaymentMethodSchema = z.object({
  payment_method: z.enum(["QRIS", "DANA", "TRANSFER", "CASH"])
});


