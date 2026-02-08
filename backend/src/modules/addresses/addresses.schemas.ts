import { z } from "zod";

export const saveAddressSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
  floor_number: z.string().optional(),
  building_name: z.string().optional(),
  gate_photo_url: z.string().optional(),
});

export const updateAddressSchema = saveAddressSchema.partial();
