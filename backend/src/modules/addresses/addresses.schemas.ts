import { z } from "zod";

export const saveAddressSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  street: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
  floor_number: z.string().optional(),
  building_name: z.string().optional(),
  gate_photo_url: z.string().optional(),
});

export const updateAddressSchema = saveAddressSchema.partial();
