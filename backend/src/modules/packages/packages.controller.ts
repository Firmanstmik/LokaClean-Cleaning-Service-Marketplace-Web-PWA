/**
 * PaketCleaning controllers.
 */

import type { Request, Response } from "express";
import translate from "google-translate-api-x";
import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { fileToPublicPath } from "../../middleware/upload";
import { createPackageSchema, updatePackageSchema } from "./packages.schemas";

const packageSelect = {
  id: true,
  name: true,
  name_en: true,
  description: true,
  description_en: true,
  base_price: true,
  discount_percentage: true,
  final_price: true,
  pricing_note: true,
  estimated_duration: true,
  image: true,
  category: true,
  stock: true,
  created_at: true,
  updated_at: true
};

async function getDiscountEditionMap(ids: number[]) {
  if (!ids.length) return new Map<number, string | null>();
  try {
    const rows = await prisma.$queryRaw<Array<{ id: number; discount_edition: string | null }>>(
      Prisma.sql`SELECT id, discount_edition FROM "PaketCleaning" WHERE id IN (${Prisma.join(ids)})`
    );
    return new Map(rows.map((r) => [r.id, r.discount_edition]));
  } catch (error) {
    console.error(`[getDiscountEditionMap] Failed for ids ${ids}:`, error);
    return new Map<number, string | null>();
  }
}

async function setDiscountEdition(id: number, value: string | null) {
  try {
    const result = await prisma.$executeRaw(
      Prisma.sql`UPDATE "PaketCleaning" SET discount_edition = ${value} WHERE id = ${id}`
    );
    console.log(`[setDiscountEdition] Updated id ${id} to ${value}, result: ${result}`);
  } catch (error) {
    console.error(`[setDiscountEdition] Failed for id ${id}:`, error);
    return;
  }
}

export const listPackagesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const items: any[] = await (prisma as any).paketCleaning.findMany({
    orderBy: { created_at: "desc" },
    select: packageSelect
  });

  // Get ratings for each package
  const packageIds = items.map(p => p.id);
  const discountEditionMap = await getDiscountEditionMap(packageIds);
  for (const pkg of items) {
    pkg.discount_edition = discountEditionMap.get(pkg.id) ?? null;
  }
  const ratings = await prisma.rating.findMany({
    where: {
      pesanan: {
        paket_id: { in: packageIds }
      }
    },
    select: {
      rating_value: true,
      pesanan: {
        select: {
          paket_id: true
        }
      }
    }
  });

  // Calculate average rating and review count per package
  const ratingsByPackage = items.map(pkg => {
    const pkgRatings = ratings.filter(r => r.pesanan.paket_id === pkg.id);
    const totalRatings = pkgRatings.length;
    
    if (totalRatings === 0) {
      return {
        ...pkg,
        averageRating: null,
        totalReviews: 0
      };
    }

    const sum = pkgRatings.reduce((acc, r) => acc + r.rating_value, 0);
    const averageRating = Math.round((sum / totalRatings) * 10) / 10; // Round to 1 decimal

    return {
      ...pkg,
      averageRating,
      totalReviews: totalRatings
    };
  });

  return ok(res, { items: ratingsByPackage });
});

function computeFinalPrice(basePrice: number, discountPercentage: number) {
  const base = Number.isFinite(basePrice) ? basePrice : 0;
  const discount = Number.isFinite(discountPercentage) ? discountPercentage : 0;
  const final = Math.round(base - (base * discount) / 100);
  return Math.max(0, final);
}

export const createPackageHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createPackageSchema.parse(req.body);

  // Handle image upload if provided
  const imagePath = req.file ? fileToPublicPath(req.file) : null;
  const basePrice = typeof data.base_price === "number" ? data.base_price : 0;
  const discountPercentage =
    typeof data.discount_percentage === "number" ? data.discount_percentage : 0;
  const pricingNote = typeof data.pricing_note === "string" ? data.pricing_note.trim() : "";
  const discountEdition =
    typeof data.discount_edition === "string" ? data.discount_edition.trim() : "";
  const estimatedDuration = typeof data.estimated_duration === "number" ? data.estimated_duration : 60;

  const resolvedDiscount = basePrice > 0 ? discountPercentage : 0;
  const finalPrice = basePrice > 0 ? computeFinalPrice(basePrice, resolvedDiscount) : 0;

  const item = await (prisma as any).paketCleaning.create({ 
    data: {
      name: data.name,
      name_en: data.name_en,
      description: data.description,
      description_en: data.description_en,
      base_price: basePrice,
      discount_percentage: resolvedDiscount,
      final_price: finalPrice,
      pricing_note: pricingNote.length ? pricingNote : null,
      estimated_duration: estimatedDuration,
      image: imagePath
    }, 
    select: packageSelect 
  });
  const resolvedEdition = discountEdition.length ? discountEdition : null;
  await setDiscountEdition(item.id, resolvedEdition);
  item.discount_edition = resolvedEdition;
  return created(res, { item });
});

export const updatePackageHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  const data = updatePackageSchema.parse(req.body);
  const existing = await (prisma as any).paketCleaning.findUnique({
    where: { id },
    select: {
      base_price: true,
      discount_percentage: true,
      pricing_note: true,
      estimated_duration: true
    }
  });
  if (!existing) throw new HttpError(404, "Package not found");
  const existingDiscountEdition = (await getDiscountEditionMap([id])).get(id) ?? null;

  // Handle image upload if provided
  const imagePath = req.file ? fileToPublicPath(req.file) : undefined;

  const nextBasePrice =
    typeof data.base_price === "number" ? data.base_price : existing.base_price;
  const nextPricingNote =
    typeof data.pricing_note === "string"
      ? data.pricing_note.trim()
      : (existing.pricing_note ?? "");
  const nextDiscountEdition =
    data.discount_edition !== undefined
      ? (typeof data.discount_edition === "string" ? data.discount_edition.trim() : "")
      : (existingDiscountEdition ?? "");
  const nextDiscountPercentage =
    nextBasePrice > 0
      ? (typeof data.discount_percentage === "number"
          ? data.discount_percentage
          : existing.discount_percentage)
      : 0;
  const nextFinalPrice =
    nextBasePrice > 0 ? computeFinalPrice(nextBasePrice, nextDiscountPercentage) : 0;
  const nextEstimatedDuration =
    typeof data.estimated_duration === "number" ? data.estimated_duration : existing.estimated_duration;

  if (nextBasePrice <= 0 && nextPricingNote.length === 0) {
    throw new HttpError(400, "base_price is required when pricing_note is empty");
  }

  const updateData: any = {
    ...data,
    base_price: nextBasePrice,
    discount_percentage: nextDiscountPercentage,
    final_price: nextFinalPrice,
    pricing_note: nextPricingNote.length ? nextPricingNote : null,
    estimated_duration: nextEstimatedDuration
  };
  delete updateData.discount_edition;
  if (imagePath !== undefined) {
    updateData.image = imagePath;
  }
  
  const item = await (prisma as any).paketCleaning.update({ 
    where: { id }, 
    data: updateData, 
    select: packageSelect 
  });
  const resolvedEdition = nextDiscountEdition.length ? nextDiscountEdition : null;
  await setDiscountEdition(id, resolvedEdition);
  
  // Re-fetch the item to make sure we have the latest from DB if possible
  // or at least manually attach the new edition
  item.discount_edition = resolvedEdition;
  return ok(res, { item });
});

export const deletePackageHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  // Check if package exists
  const packageExists = await (prisma as any).paketCleaning.findUnique({ where: { id } });
  if (!packageExists) {
    throw new HttpError(404, "Package not found");
  }

  // Check if package is used in any orders
  const ordersCount = await prisma.pesanan.count({
    where: { paket_id: id }
  });

  if (ordersCount > 0) {
    throw new HttpError(400, `Cannot delete package. It is used in ${ordersCount} order(s). Please delete or update those orders first.`);
  }

  await (prisma as any).paketCleaning.delete({ where: { id } });
  return ok(res, { deleted: true, message: "Package deleted successfully" });
});

export const translateTextHandler = asyncHandler(async (req: Request, res: Response) => {
  const { text, target } = req.body;
  if (!text || typeof text !== "string") {
    throw new HttpError(400, "Text is required and must be a string");
  }
  const translated = await autoTranslate(text, (target || "id") as string);
  return ok(res, { translated });
});


async function autoTranslate(text: string, targetLang: string = "id"): Promise<string> {
  try {
    // If target is ID, we want a more natural translation for cleaning services
    const res = await translate(text, { to: targetLang, autoCorrect: true });
    
    let result = res.text;
    
    // Simple post-processing for Indonesian to make it less stiff if needed
    if (targetLang === "id") {
      // Common stiff translations from Google Translate for cleaning services
      result = result
        .replace(/Layanan pembersihan/gi, "Jasa Bersih-bersih")
        .replace(/Pembersihan cepat per jam/gi, "Bersih Cepat Per Jam")
        .replace(/Sempurna untuk/gi, "Sangat cocok untuk")
        .replace(/Termasuk/gi, "Sudah termasuk");
    }
    
    return result;
  } catch (error) {
    console.error("Auto-translation failed:", error);
    // Fallback to original text if translation fails
    return text;
  }
}

