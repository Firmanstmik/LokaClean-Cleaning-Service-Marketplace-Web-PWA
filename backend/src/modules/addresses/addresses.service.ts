import { prisma } from "../../db/prisma";
import { HttpError } from "../../utils/httpError";

interface AddressData {
  label: string;
  address: string;
  lat: number;
  lng: number;
  is_primary?: boolean;
  notes?: string;
  floor_number?: string;
  building_name?: string;
  gate_photo_url?: string;
}

export async function saveAddress(userId: number, data: AddressData) {
  return await prisma.$transaction(async (tx) => {
    // If setting as primary, unset others first
    if (data.is_primary) {
      await tx.savedAddress.updateMany({
        where: { user_id: userId },
        data: { is_primary: false }
      });
    }

    // Use raw query for PostGIS insert
    // Note: We can't easily mix Prisma $transaction with $queryRaw if we want atomic rollback for everything,
    // but Prisma Client Extensions or raw SQL is needed for geography.
    // For now, we'll do the updateMany above (Prisma) and then the raw insert.
    // If the insert fails, the updateMany committed (if not wrapped properly).
    // Ideally, we should do everything in raw SQL or use Prisma's unsupported features carefully.
    
    // However, since we are inside a transaction, `tx.$queryRaw` works!
    
    const result = await tx.$queryRaw`
      INSERT INTO "SavedAddress" (
        user_id, label, address, latitude, longitude, 
        is_primary, notes, floor_number, building_name, gate_photo_url,
        location, created_at, updated_at
      )
      VALUES (
        ${userId}, ${data.label}, ${data.address}, ${data.lat}, ${data.lng}, 
        ${data.is_primary || false}, ${data.notes || null}, ${data.floor_number || null}, ${data.building_name || null}, ${data.gate_photo_url || null},
        ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326), 
        NOW(), NOW()
      )
      RETURNING id, label, address, latitude, longitude, is_primary, notes, floor_number, building_name, gate_photo_url
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
    // For simplicity, if lat/lng changes, we need raw query to update location.
    // If only metadata changes, we can use Prisma update.
    
    const hasLocationUpdate = (data.lat !== undefined && data.lng !== undefined);

    if (hasLocationUpdate) {
       const result = await tx.$queryRaw`
        UPDATE "SavedAddress"
        SET 
          label = COALESCE(${data.label}, label),
          address = COALESCE(${data.address}, address),
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
        RETURNING id, label, address, latitude, longitude, is_primary, notes
      `;
      return Array.isArray(result) ? result[0] : result;
    } else {
      // Regular Prisma update
      return await tx.savedAddress.update({
        where: { id: addressId },
        data: {
          label: data.label,
          address: data.address,
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
  return prisma.savedAddress.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_primary: 'desc' }, // Primary first
      { created_at: 'desc' }
    ],
    select: {
      id: true,
      label: true,
      address: true,
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
