/**
 * Request validation schemas for auth endpoints.
 */

import { z } from "zod";

export const userRegisterSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional(),
  phone_number: z.string().min(6),
  password: z.string().min(6)
});

export const userLoginSchema = z.object({
  // "login" can be an email OR a phone number (WhatsApp).
  login: z.string().min(1),
  password: z.string().min(6)
});

export const adminLoginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(6)
});


