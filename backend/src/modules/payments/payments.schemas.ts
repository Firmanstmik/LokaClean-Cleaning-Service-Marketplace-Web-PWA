/**
 * Zod schemas for payment operations.
 */

import { z } from "zod";

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID"])
});

/**
 * Schema for requesting Snap token.
 * Frontend sends this after order is created with NON-CASH payment method.
 */
export const requestSnapTokenSchema = z.object({
  pesanan_id: z.coerce.number().int().positive(),
  customer_details: z.object({
    first_name: z.string().min(1),
    last_name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(1)
  })
});


