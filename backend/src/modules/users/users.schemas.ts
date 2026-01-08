/**
 * Zod schemas for User profile endpoints.
 */

import { z } from "zod";

const optionalNumber = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().optional());

export const updateMeSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone_number: z.string().min(6).optional(),
  password: z.string().min(6).optional(),
  default_latitude: optionalNumber,
  default_longitude: optionalNumber
});

export const deleteMeSchema = z.object({
  email_or_phone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required")
});


