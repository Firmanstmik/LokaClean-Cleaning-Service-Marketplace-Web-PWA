/**
 * ADMIN Rating controllers.
 */

import type { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";

/**
 * ADMIN: List all ratings with filters and sorting.
 * 
 * Query params:
 * - package_id: Filter by package
 * - rating_value: Filter by rating (1-5)
 * - start_date: Filter by start date (ISO string)
 * - end_date: Filter by end date (ISO string)
 * - sort: Sort by (highest, lowest, recent)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export const listRatingsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const {
    package_id,
    rating_value,
    start_date,
    end_date,
    sort = "recent",
    page = "1",
    limit = "20"
  } = req.query;

  // Build where clause
  const where: any = {};

  if (package_id) {
    where.pesanan = {
      paket_id: parseInt(package_id as string, 10)
    };
  }

  if (rating_value) {
    where.rating_value = parseInt(rating_value as string, 10);
  }

  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) {
      where.created_at.gte = new Date(start_date as string);
    }
    if (end_date) {
      where.created_at.lte = new Date(end_date as string);
    }
  }

  // Build orderBy clause
  let orderBy: any = { created_at: "desc" }; // Default: most recent
  if (sort === "highest") {
    orderBy = { rating_value: "desc" };
  } else if (sort === "lowest") {
    orderBy = { rating_value: "asc" };
  } else if (sort === "recent") {
    orderBy = { created_at: "desc" };
  }

  // Pagination
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Fetch ratings with related data
  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        pesanan: {
          include: {
            paket: {
              select: {
                id: true,
                name: true
              }
            },
            user: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        }
      }
    }),
    prisma.rating.count({ where })
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return ok(res, {
    ratings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});

/**
 * ADMIN: Get rating summary statistics.
 * 
 * Returns:
 * - average_rating: Average of all ratings
 * - total_ratings: Total number of ratings
 * - five_star_percentage: Percentage of 5-star ratings
 * - distribution: Count of ratings by value (1-5)
 */
export const getRatingsSummaryAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  // Get all ratings
  const ratings = await prisma.rating.findMany({
    select: {
      rating_value: true
    }
  });

  const totalRatings = ratings.length;

  if (totalRatings === 0) {
    return ok(res, {
      average_rating: 0,
      total_ratings: 0,
      five_star_percentage: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    });
  }

  // Calculate average
  const sum = ratings.reduce((acc, r) => acc + r.rating_value, 0);
  const averageRating = sum / totalRatings;

  // Calculate distribution
  const distribution = {
    5: ratings.filter(r => r.rating_value === 5).length,
    4: ratings.filter(r => r.rating_value === 4).length,
    3: ratings.filter(r => r.rating_value === 3).length,
    2: ratings.filter(r => r.rating_value === 2).length,
    1: ratings.filter(r => r.rating_value === 1).length
  };

  // Calculate 5-star percentage
  const fiveStarPercentage = (distribution[5] / totalRatings) * 100;

  return ok(res, {
    average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    total_ratings: totalRatings,
    five_star_percentage: Math.round(fiveStarPercentage * 10) / 10, // Round to 1 decimal
    distribution
  });
});

