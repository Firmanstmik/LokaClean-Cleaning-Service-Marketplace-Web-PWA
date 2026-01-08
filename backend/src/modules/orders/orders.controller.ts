/**
 * Pesanan (order) controllers for both USER and ADMIN flows.
 *
 * We keep the logic here small and push validations/state rules into helpers so that:
 * - the API is easy to read
 * - the state transitions are explicit
 */

import type { Request, Response } from "express";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { parseId } from "../../utils/parseId";
import { fileToPublicPath } from "../../middleware/upload";
import {
  adminUpdateStatusSchema,
  createOrderInputSchema,
  createRatingSchema,
  createTipSchema
} from "./orders.schemas";

const userSelect = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true,
  profile_photo: true,
  default_latitude: true,
  default_longitude: true,
  role: true,
  created_at: true,
  updated_at: true
};

const adminSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  created_at: true
};

const packageSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  estimated_duration: true,
  created_at: true,
  updated_at: true
};

const orderInclude = {
  user: { select: userSelect },
  admin: { select: adminSelect },
  paket: { select: packageSelect },
  pembayaran: {
    select: { id: true, method: true, amount: true, status: true, created_at: true }
  },
  rating: true,
  tip: true
} as const;

async function getOrderForUserOrThrow(orderId: number, userId: number) {
  const order = await prisma.pesanan.findFirst({
    where: { id: orderId, user_id: userId },
    include: orderInclude
  });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

async function getOrderOrThrow(orderId: number) {
  const order = await prisma.pesanan.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}


/**
 * USER: Create a new order (with room photo BEFORE + selected package + payment method).
 *
 * PAYMENT HANDLING:
 * ================
 * - CASH: Payment status remains PENDING. Admin must manually mark as PAID.
 * - NON-CASH (QRIS/DANA/TRANSFER): Payment status starts as PENDING.
 *   After order creation, frontend should call POST /payments/snap-token
 *   to get Midtrans Snap token. Payment status will be updated via webhook
 *   when user completes payment on Midtrans.
 *
 * IMPORTANT: Frontend cannot confirm payment success. Only webhook can update status.
 */
export const createOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new HttpError(400, "room_photo_before is required (at least 1 photo)");

  const input = createOrderInputSchema.parse(req.body);
  // Convert all files to public paths and store as JSON array
  const beforePhotos = files.map(file => fileToPublicPath(file));
  const beforePhotosJson = JSON.stringify(beforePhotos);

  const paket = await prisma.paketCleaning.findUnique({
    where: { id: input.paket_id },
    select: { id: true, price: true }
  });
  if (!paket) throw new HttpError(404, "PaketCleaning not found");

  // Generate sequential order_number (1, 2, 3, ...) that stays consistent even if orders are deleted
  // Get the maximum order_number and add 1, or start at 1 if no orders exist
  const maxOrder = await prisma.pesanan.findFirst({
    orderBy: { order_number: 'desc' },
    select: { order_number: true }
  });
  const nextOrderNumber = maxOrder ? maxOrder.order_number + 1 : 1;

  const order = await prisma.pesanan.create({
    data: {
      order_number: nextOrderNumber,
      user_id: req.auth.id,
      paket_id: input.paket_id,
      status: OrderStatus.PENDING,
      room_photo_before: beforePhotosJson,
      room_photo_after: null,
      location_latitude: input.location_latitude,
      location_longitude: input.location_longitude,
      address: input.address,
      scheduled_date: input.scheduled_date,
      pembayaran: {
        create: {
          method: input.payment_method as PaymentMethod,
          amount: paket.price,
          status: PaymentStatus.PENDING
          // midtrans_order_id will be set when frontend requests Snap token (NON-CASH only)
        }
      }
    },
    include: orderInclude
  });

  return created(res, { order });
});

/**
 * USER: View my orders.
 * Supports pagination and filtering by status.
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 7, max: 50)
 * - status: filter by status - 'pending' (PENDING), 'in_progress' (IN_PROGRESS), 'completed' (COMPLETED)
 */
export const listMyOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 7));
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status as string | undefined;

  // Build where clause
  const where: any = { user_id: req.auth.id };
  
  if (statusFilter === 'pending') {
    // Belum dikonfirmasi: PENDING
    where.status = OrderStatus.PENDING;
  } else if (statusFilter === 'in_progress') {
    // In Progress: IN_PROGRESS
    where.status = OrderStatus.IN_PROGRESS;
  } else if (statusFilter === 'completed') {
    // Complete: COMPLETED
    where.status = OrderStatus.COMPLETED;
  }
  // If statusFilter is undefined or 'all', show all orders

  const [items, total] = await Promise.all([
    prisma.pesanan.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: orderInclude,
      skip,
      take: limit
    }),
    prisma.pesanan.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;

  return ok(res, { 
    items, 
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext
    }
  });
});

/**
 * USER: View a single order (must belong to the user).
 */
export const getMyOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderForUserOrThrow(id, req.auth.id);
  return ok(res, { order });
});

/**
 * USER: Upload room photo AFTER.
 * 
 * Only allowed when:
 * - Order status is IN_PROGRESS (admin has confirmed and assigned staff)
 * - Order belongs to the authenticated user
 */
export const uploadAfterPhotoUserHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new HttpError(400, "room_photo_after is required (at least 1 photo)");

  // Ensure the order belongs to the user and check status
  const order = await getOrderForUserOrThrow(id, req.auth.id);
  
  // Only allow upload when status is IN_PROGRESS (admin has confirmed)
  if (order.status !== OrderStatus.IN_PROGRESS) {
    throw new HttpError(400, `Cannot upload after photo. Order status must be IN_PROGRESS. Current status: ${order.status}`);
  }

  // Convert all files to public paths and store as JSON array
  const afterPhotos = files.map(file => fileToPublicPath(file));
  const afterPhotosJson = JSON.stringify(afterPhotos);
  
  const updated = await prisma.pesanan.update({
    where: { id },
    data: { room_photo_after: afterPhotosJson },
    include: orderInclude
  });

  return ok(res, { order: updated });
});

/**
 * USER: Verify completion (moves status IN_PROGRESS -> COMPLETED).
 * Automatically marks payment as PAID when order is completed.
 * 
 * Requirements:
 * - Order status must be IN_PROGRESS
 * - After photo must be uploaded
 * - Tip must be submitted (can be 0 for no tip)
 */
export const verifyCompletionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderForUserOrThrow(id, req.auth.id);
  if (order.status !== OrderStatus.IN_PROGRESS) {
    throw new HttpError(400, "Order must be IN_PROGRESS to verify completion");
  }
  // Check if after photo exists (supports both JSON array and single string)
  let hasAfterPhoto = false;
  if (order.room_photo_after) {
    try {
      const parsed = JSON.parse(order.room_photo_after);
      hasAfterPhoto = Array.isArray(parsed) ? parsed.length > 0 : true;
    } catch {
      hasAfterPhoto = true; // Single string format
    }
  }
  if (!hasAfterPhoto) {
    throw new HttpError(400, "room_photo_after must be uploaded before completion verification");
  }
  if (!order.tip) {
    throw new HttpError(400, "Tip must be submitted before completion verification (can be 0 for no tip)");
  }

  // Update order status to COMPLETED and payment status to PAID in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update order status
    const updatedOrder = await tx.pesanan.update({
      where: { id },
      data: { status: OrderStatus.COMPLETED },
      include: orderInclude
    });

    // Update payment status to PAID if it exists and is not already PAID
    if (updatedOrder.pembayaran && updatedOrder.pembayaran.status !== PaymentStatus.PAID) {
      await tx.pembayaran.update({
        where: { pesanan_id: id },
        data: { status: PaymentStatus.PAID }
      });
    }

    // Return order with updated payment status
    return await tx.pesanan.findUnique({
      where: { id },
      include: orderInclude
    });
  });

  if (!updated) {
    throw new HttpError(500, "Failed to update order");
  }

  return ok(res, { order: updated });
});

/**
 * USER: Submit rating (0..1 per order).
 */
export const createRatingHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderForUserOrThrow(id, req.auth.id);
  if (order.status !== OrderStatus.COMPLETED) {
    throw new HttpError(400, "Order must be COMPLETED to submit rating");
  }
  if (order.rating) throw new HttpError(409, "Rating already exists for this order");

  const input = createRatingSchema.parse(req.body);

  const rating = await prisma.rating.create({
    data: {
      pesanan_id: order.id,
      rating_value: input.rating_value,
      review: input.review
    }
  });

  return created(res, { rating });
});

/**
 * USER: Submit tip (0..1 per order).
 * 
 * Tip can be submitted when:
 * - Order status is IN_PROGRESS (after photo after is uploaded)
 * - Order status is COMPLETED (for backward compatibility)
 */
export const createTipHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderForUserOrThrow(id, req.auth.id);
  
  // Allow tip submission when IN_PROGRESS (after photo uploaded) or COMPLETED
  if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.COMPLETED) {
    throw new HttpError(400, "Order must be IN_PROGRESS or COMPLETED to submit tip");
  }
  
  // If IN_PROGRESS, require after photo to be uploaded (supports both JSON array and single string)
  if (order.status === OrderStatus.IN_PROGRESS) {
    let hasAfterPhoto = false;
    if (order.room_photo_after) {
      try {
        const parsed = JSON.parse(order.room_photo_after);
        hasAfterPhoto = Array.isArray(parsed) ? parsed.length > 0 : true;
      } catch {
        hasAfterPhoto = true; // Single string format
      }
    }
    if (!hasAfterPhoto) {
      throw new HttpError(400, "After photo must be uploaded before submitting tip");
    }
  }
  
  if (order.tip) throw new HttpError(409, "Tip already exists for this order");

  const input = createTipSchema.parse(req.body);

  const tip = await prisma.tip.create({
    data: {
      pesanan_id: order.id,
      amount: input.amount
    }
  });

  return created(res, { tip });
});

/**
 * ADMIN: View all orders.
 */
export const listAllOrdersAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const items = await prisma.pesanan.findMany({
    orderBy: { created_at: "desc" },
    include: orderInclude
  });
  return ok(res, { items });
});

/**
 * ADMIN: Get pending orders count for notifications.
 */
export const getPendingOrdersCountHandler = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.pesanan.count({
    where: { status: OrderStatus.PENDING }
  });
  
  // Also get the latest pending order for notification
  const latestPendingOrder = await prisma.pesanan.findFirst({
    where: { status: OrderStatus.PENDING },
    orderBy: { created_at: "desc" },
    include: {
      user: {
        select: {
          id: true,
          full_name: true
        }
      },
      paket: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  return ok(res, { 
    count,
    latestOrder: latestPendingOrder ? {
      id: latestPendingOrder.id,
      user_name: latestPendingOrder.user.full_name,
      paket_name: latestPendingOrder.paket.name,
      created_at: latestPendingOrder.created_at
    } : null
  });
});

/**
 * ADMIN: View an order.
 */
export const getOrderAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const order = await getOrderOrThrow(id);
  return ok(res, { order });
});

/**
 * ADMIN: Assign order to the current admin (sets admin_id and status to IN_PROGRESS).
 * Creates notification for the user.
 */
export const assignOrderAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderOrThrow(id);
  if (order.status === OrderStatus.COMPLETED) throw new HttpError(400, "Cannot assign a COMPLETED order");
  if (order.status !== OrderStatus.PENDING) throw new HttpError(400, "Order must be PENDING to assign");

  // Update order: assign admin and set status to IN_PROGRESS
  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.pesanan.update({
      where: { id },
      data: { admin_id: req.auth.id, status: OrderStatus.IN_PROGRESS },
      include: orderInclude
    });

    // Create notification for user with friendly message
    await tx.notification.create({
      data: {
        user_id: order.user_id,
        pesanan_id: order.id,
        title: "Pesanan Dikonfirmasi",
        message: `Petugas OTW bro! Pesanan #${order.id} (${order.paket.name}) sudah dikonfirmasi dan sedang dalam proses. Ditunggu ya! 😊`
      }
    });

    return updatedOrder;
  });

  return ok(res, { order: updated });
});

/**
 * ADMIN: Update order status.
 *
 * Allowed transitions (Phase 1):
 * - PENDING -> PROCESSING
 * - PROCESSING -> IN_PROGRESS
 *
 * COMPLETED is set by the USER via verify-completion.
 */
export const updateOrderStatusAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const { status } = adminUpdateStatusSchema.parse(req.body);

  if (status === "COMPLETED") {
    throw new HttpError(400, "COMPLETED is set by the user verification step");
  }

  const order = await getOrderOrThrow(id);

  // Ensure the order is assigned to an admin before moving forward.
  const assignedAdminId = order.admin_id ?? req.auth.id;

  if (status === "PROCESSING") {
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new HttpError(400, `Cannot move from ${order.status} to PROCESSING`);
    }
  }

  if (status === "IN_PROGRESS") {
    if (order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.IN_PROGRESS) {
      throw new HttpError(400, `Cannot move from ${order.status} to IN_PROGRESS`);
    }
    if (!order.admin_id) throw new HttpError(400, "Order must be assigned before IN_PROGRESS");
    if (order.admin_id !== req.auth.id) throw new HttpError(403, "Only assigned admin can set IN_PROGRESS");
  }

  const updated = await prisma.pesanan.update({
    where: { id },
    data: { status: status as OrderStatus, admin_id: assignedAdminId },
    include: orderInclude
  });

  return ok(res, { order: updated });
});

/**
 * ADMIN: Upload room photo AFTER.
 */
export const uploadAfterPhotoAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!req.file) throw new HttpError(400, "room_photo_after is required");

  const afterPhoto = fileToPublicPath(req.file);
  const updated = await prisma.pesanan.update({
    where: { id },
    data: { room_photo_after: afterPhoto },
    include: orderInclude
  });

  return ok(res, { order: updated });
});

/**
 * ADMIN: Delete an order.
 * When an order is deleted, all orders with order_number greater than the deleted order's order_number
 * will have their order_number decreased by 1 to maintain sequential numbering.
 */
export const deleteOrderAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);

  const order = await getOrderOrThrow(id);
  const deletedOrderNumber = order.order_number;

  // Delete related records and reorder order_numbers in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete notifications related to this order
    await tx.notification.deleteMany({
      where: { pesanan_id: id }
    });

    // Delete rating (if exists)
    if (order.rating) {
      await tx.rating.delete({
        where: { pesanan_id: id }
      });
    }

    // Delete tip (if exists)
    if (order.tip) {
      await tx.tip.delete({
        where: { pesanan_id: id }
      });
    }

    // Delete payment
    if (order.pembayaran) {
      await tx.pembayaran.delete({
        where: { id: order.pembayaran.id }
      });
    }

    // Delete the order FIRST
    await tx.pesanan.delete({
      where: { id }
    });

    // Reorder: Re-sequence all order_number values to be sequential (1, 2, 3, ...)
    // Use a safe two-step approach with raw SQL to avoid unique constraint violations:
    // Step 1: Set all order_number to negative values (temporary, no conflicts)
    // Step 2: Set all order_number to correct sequential values based on created_at
    await tx.$executeRaw`
      UPDATE "Pesanan"
      SET "order_number" = -"order_number"
    `;

    // Step 2: Assign sequential numbers based on created_at order
    await tx.$executeRaw`
      WITH ordered_orders AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS new_order_number
        FROM "Pesanan"
      )
      UPDATE "Pesanan"
      SET "order_number" = ordered_orders.new_order_number
      FROM ordered_orders
      WHERE "Pesanan"."id" = ordered_orders.id
    `;
  });

  return ok(res, { message: "Order deleted successfully" });
});

/**
 * ADMIN: Delete multiple orders (bulk delete).
 * Deletes multiple orders and reorders order_numbers to maintain sequential numbering.
 */
export const deleteOrdersBulkAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new HttpError(400, "ids must be a non-empty array");
  }

  // Validate all IDs are numbers
  const orderIds = ids.map(id => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new HttpError(400, `Invalid order id: ${id}`);
    }
    return numId;
  });

  // Check if all orders exist
  const orders = await prisma.pesanan.findMany({
    where: { id: { in: orderIds } },
    include: {
      rating: true,
      tip: true,
      pembayaran: true
    }
  });

  if (orders.length !== orderIds.length) {
    throw new HttpError(404, "Some orders not found");
  }

  // Delete all related records and reorder order_numbers in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete notifications for all orders
    await tx.notification.deleteMany({
      where: { pesanan_id: { in: orderIds } }
    });

    // Delete ratings
    const ratingIds = orders.filter(o => o.rating).map(o => o.rating!.id);
    if (ratingIds.length > 0) {
      await tx.rating.deleteMany({
        where: { id: { in: ratingIds } }
      });
    }

    // Delete tips
    const tipIds = orders.filter(o => o.tip).map(o => o.tip!.id);
    if (tipIds.length > 0) {
      await tx.tip.deleteMany({
        where: { id: { in: tipIds } }
      });
    }

    // Delete payments
    const paymentIds = orders.filter(o => o.pembayaran).map(o => o.pembayaran!.id);
    if (paymentIds.length > 0) {
      await tx.pembayaran.deleteMany({
        where: { id: { in: paymentIds } }
      });
    }

    // Delete all orders
    await tx.pesanan.deleteMany({
      where: { id: { in: orderIds } }
    });

    // Reorder: Re-sequence all order_number values to be sequential (1, 2, 3, ...)
    await tx.$executeRaw`
      UPDATE "Pesanan"
      SET "order_number" = -"order_number"
    `;

    await tx.$executeRaw`
      WITH ordered_orders AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS new_order_number
        FROM "Pesanan"
      )
      UPDATE "Pesanan"
      SET "order_number" = ordered_orders.new_order_number
      FROM ordered_orders
      WHERE "Pesanan"."id" = ordered_orders.id
    `;
  });

  return ok(res, { 
    message: `Successfully deleted ${orderIds.length} order(s)`,
    deletedCount: orderIds.length
  });
});



