import { prisma } from "../../db/prisma";
import { HttpError } from "../../utils/httpError";

interface AddressData {
  label: string;
  address: string;
  lat: number;
  lng: number;
  street?: string;
  village?: string;
  district?: string;
  city?: string;
  is_primary?: boolean;
  notes?: string;
  floor_number?: string;
  building_name?: string;
  gate_photo_url?: string;
}

export async function saveAddress(userId: number, data: AddressData) {
  return await prisma.$transaction(async (tx) => {
    // Check if user has any addresses
    const count = await tx.savedAddress.count({
      where: { user_id: userId }
    });

    // Enforce Max 3 Addresses (1 Primary + 2 Backup)
    if (count >= 3) {
      throw new HttpError(400, "Maksimal 3 alamat tersimpan (1 Utama + 2 Cadangan). Harap hapus salah satu alamat terlebih dahulu.");
    }

    // Auto-set as primary if it's the first address
    let isPrimary = data.is_primary || false;
    if (count === 0) {
      isPrimary = true;
    }

    // If setting as primary, unset others first
    if (isPrimary) {
      await tx.savedAddress.updateMany({
        where: { user_id: userId },
        data: { is_primary: false }
      });
    }

    // Use raw query for PostGIS insert
    const result = await tx.$queryRaw`
      INSERT INTO "SavedAddress" (
        user_id, label, address, latitude, longitude, 
        street, village, district, city,
        is_primary, notes, floor_number, building_name, gate_photo_url,
        location, created_at, updated_at
      )
      VALUES (
        ${userId}, ${data.label}, ${data.address}, ${data.lat}, ${data.lng}, 
        ${data.street || null}, ${data.village || null}, ${data.district || null}, ${data.city || null},
        ${isPrimary}, ${data.notes || null}, ${data.floor_number || null}, ${data.building_name || null}, ${data.gate_photo_url || null},
        ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326), 
        NOW(), NOW()
      )
      RETURNING id, label, address, street, village, district, city, latitude, longitude, is_primary, notes, floor_number, building_name, gate_photo_url
    `;
    
    return Array.isArray(result) ? result[0] : result;
  });
}

export async function updateAddress(userId: number, addressId: number, data: Partial<AddressData>) {
  return await prisma.$transaction(async (tx) => {
    // Verify ownership
    const existing = await tx.savedAddress.findUnique({ where: { id: addressId } });
    if (!existing) throw new HttpError(404, "Address not found");
    if (existing.user_id !== userId) throw new HttpError(403, "Forbidden");

    // If setting as primary, unset others
    if (data.is_primary) {
      await tx.savedAddress.updateMany({
        where: { user_id: userId, id: { not: addressId } },
        data: { is_primary: false }
      });
    }

    // Construct update data for Prisma (excluding lat/lng/location if not provided)
    const hasLocationUpdate = (data.lat !== undefined && data.lng !== undefined);

    if (hasLocationUpdate) {
       const result = await tx.$queryRaw`
        UPDATE "SavedAddress"
        SET 
          label = COALESCE(${data.label}, label),
          address = COALESCE(${data.address}, address),
          street = COALESCE(${data.street}, street),
          village = COALESCE(${data.village}, village),
          district = COALESCE(${data.district}, district),
          city = COALESCE(${data.city}, city),
          latitude = ${data.lat},
          longitude = ${data.lng},
          is_primary = COALESCE(${data.is_primary}, is_primary),
          notes = COALESCE(${data.notes}, notes),
          floor_number = COALESCE(${data.floor_number}, floor_number),
          building_name = COALESCE(${data.building_name}, building_name),
          gate_photo_url = COALESCE(${data.gate_photo_url}, gate_photo_url),
          location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
          updated_at = NOW()
        WHERE id = ${addressId} AND user_id = ${userId}
        RETURNING id, label, address, street, village, district, city, latitude, longitude, is_primary, notes, floor_number, building_name, gate_photo_url
      `;
      return Array.isArray(result) ? result[0] : result;
    } else {
      // Regular Prisma update
      return await tx.savedAddress.update({
        where: { id: addressId },
        data: {
          label: data.label,
          address: data.address,
          street: data.street,
          village: data.village,
          district: data.district,
          city: data.city,
          is_primary: data.is_primary,
          notes: data.notes,
          floor_number: data.floor_number,
          building_name: data.building_name,
          gate_photo_url: data.gate_photo_url,
        }
      });
    }
  });
}

export async function setPrimaryAddress(userId: number, addressId: number) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.savedAddress.findUnique({ where: { id: addressId } });
    if (!existing) throw new HttpError(404, "Address not found");
    if (existing.user_id !== userId) throw new HttpError(403, "Forbidden");

    // Unset all
    await tx.savedAddress.updateMany({
      where: { user_id: userId },
      data: { is_primary: false }
    });

    // Set target
    return await tx.savedAddress.update({
      where: { id: addressId },
      data: { is_primary: true }
    });
  });
}

export async function getAddresses(userId: number) {
  return await prisma.savedAddress.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_primary: "desc" },
      { created_at: "desc" }
    ],
    select: {
      id: true,
      label: true,
      address: true,
      street: true,
      village: true,
      district: true,
      city: true,
      latitude: true,
      longitude: true,
      is_primary: true,
      notes: true,
      floor_number: true,
      building_name: true,
      gate_photo_url: true
    }
  });
}

export async function deleteAddress(userId: number, addressId: number) {
  const address = await prisma.savedAddress.findUnique({
    where: { id: addressId }
  });
  
  if (!address) throw new HttpError(404, "Address not found");
  if (address.user_id !== userId) throw new HttpError(403, "Forbidden");
  
  await prisma.savedAddress.delete({
    where: { id: addressId }
  });
  
  return { success: true };
}
