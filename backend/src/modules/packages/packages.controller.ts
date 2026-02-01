/**
 * PaketCleaning controllers.
 */

import type { Request, Response } from "express";
import translate from "google-translate-api-x";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { fileToPublicPath } from "../../middleware/upload";
import { createPackageSchema, updatePackageSchema } from "./packages.schemas";

const packageSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  estimated_duration: true,
  image: true,
  category: true,
  stock: true,
  created_at: true,
  updated_at: true
};

export const listPackagesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const items = await prisma.paketCleaning.findMany({
    orderBy: { created_at: "desc" },
    select: packageSelect
  });

  // Get ratings for each package
  const packageIds = items.map(p => p.id);
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

export const createPackageHandler = asyncHandler(async (req: Request, res: Response) => {
  console.log("Create Package Body:", req.body);
  const data = createPackageSchema.parse(req.body);
  
  // Auto-translate if English fields are missing or empty
  if ((!data.name_en || data.name_en.trim() === "") && data.name) {
    console.log("Auto-translating name:", data.name);
    data.name_en = await autoTranslate(data.name);
    console.log("Translated name:", data.name_en);
  }
  if ((!data.description_en || data.description_en.trim() === "") && data.description) {
    console.log("Auto-translating description:", data.description);
    data.description_en = await autoTranslate(data.description);
    console.log("Translated description:", data.description_en);
  }

  // Handle image upload if provided
  const imagePath = req.file ? fileToPublicPath(req.file) : null;
  
  const item = await prisma.paketCleaning.create({ 
    data: {
      ...data,
      image: imagePath
    }, 
    select: packageSelect 
  });
  return created(res, { item });
});

export const updatePackageHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  console.log("Update Package Body:", req.body);
  const data = updatePackageSchema.parse(req.body);
  
  // Auto-translate if name/desc updated but en fields missing or empty
  if (data.name && (!data.name_en || data.name_en.trim() === "")) {
    console.log("Auto-translating name (update):", data.name);
    data.name_en = await autoTranslate(data.name);
  }
  if (data.description && (!data.description_en || data.description_en.trim() === "")) {
    console.log("Auto-translating description (update):", data.description);
    data.description_en = await autoTranslate(data.description);
  }

  // Handle image upload if provided
  const imagePath = req.file ? fileToPublicPath(req.file) : undefined;
  
  const updateData: any = { ...data };
  if (imagePath !== undefined) {
    updateData.image = imagePath;
  }
  
  const item = await prisma.paketCleaning.update({ 
    where: { id }, 
    data: updateData, 
    select: packageSelect 
  });
  return ok(res, { item });
});

export const deletePackageHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  // Check if package exists
  const packageExists = await prisma.paketCleaning.findUnique({ where: { id } });
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

  await prisma.paketCleaning.delete({ where: { id } });
  return ok(res, { deleted: true, message: "Package deleted successfully" });
});

export const translateTextHandler = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    throw new HttpError(400, "Text is required and must be a string");
  }
  const translated = await autoTranslate(text);
  return ok(res, { translated });
});


async function autoTranslate(text: string): Promise<string> {
  try {
    const res = await translate(text, { to: "en", autoCorrect: true });
    return res.text;
  } catch (error) {
    console.error("Auto-translation failed:", error);
    // Fallback to original text if translation fails
    return text;
  }
}

