/**
 * Zod schemas for Payment endpoints.
 */

import { z } from "zod";

const intField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return val;
  const num = Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().int());

export const snapTokenRequestSchema = z.object({
  order_id: intField
});

