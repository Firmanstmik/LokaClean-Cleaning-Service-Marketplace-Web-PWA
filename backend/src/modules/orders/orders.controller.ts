/**
 * Pesanan (order) controllers for both USER and ADMIN flows.
 *
 * We keep the logic here small and push validations/state rules into helpers so that:
 * - the API is easy to read
 * - the state transitions are explicit
 */

import type { Request, Response } from "express";
import type { Pesanan } from "@prisma/client";
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { parseId } from "../../utils/parseId";
import { fileToPublicPath } from "../../middleware/upload";
import { sendPushToUser, sendPushToAllAdmins } from "../push/push.controller";
import { checkServiceArea, findNearestCleaners } from "../geo/geo.service";
import { getIO } from "../../socket";
import { normalizeWhatsAppPhone } from "../../utils/phone";
import {
  adminUpdateStatusSchema,
  createOrderInputSchema,
  createGuestOrderInputSchema,
  createRatingSchema,
  createTipSchema,
  updatePaymentMethodSchema
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
  name_en: true,
  description: true,
  description_en: true,
  price: true,
  estimated_duration: true,
  image: true,
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

async function findOrCreateGuestUser(fullName: string, phoneNumber: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phoneNumber);
  if (!normalizedPhone) {
    throw new HttpError(400, "Nomor WhatsApp tidak valid");
  }

  const existingUser = await prisma.user.findFirst({
    where: { phone_number: normalizedPhone }
  });

  if (existingUser) {
    return existingUser.id;
  }

  const digits = normalizedPhone.replace(/[^\d]/g, "");
  const email = `guest.${digits || Date.now()}@guest.lokaclean.app`;

  const user = await prisma.user.create({
    data: {
      full_name: fullName,
      email,
      phone_number: normalizedPhone,
      role: Role.USER
    }
  });

  return user.id;
}

/**
 * Resolve Shadow Admin ID for a User (Cleaner or Admin).
 * If not exists, create a shadow admin record for FK linkage.
 */
async function resolveAdminId(input: { id: number; origin?: "USER" | "ADMIN"; actor?: string }) {
  // If origin is ADMIN or undefined (assuming non-USER context), return ID directly
  if (input.origin !== "USER") return input.id;
  
  // Find the User
  const user = await prisma.user.findUnique({ where: { id: input.id } });
  if (!user) throw new HttpError(404, "User not found");

  // Find corresponding Admin by email
  let admin = await prisma.admin.findUnique({ where: { email: user.email } });
  
  if (!admin) {
    // Determine role based on User's role
    const adminRole = user.role === Role.ADMIN ? Role.ADMIN : Role.CLEANER;

    // Create Shadow Admin
    admin = await prisma.admin.create({
      data: {
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number, 
        password: user.password_hash || "$2b$10$placeholderhashforcleanershadowadmin", 
        role: adminRole
      }
    });
  }
  return admin.id;
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
  const files = (req.files as Express.Multer.File[]) || [];

  const input = createOrderInputSchema.parse(req.body);

  // 1. Check Service Area (Lombok)
  const serviceArea = await checkServiceArea(input.location_latitude, input.location_longitude);
  if (!serviceArea) {
    throw new HttpError(400, "Maaf, lokasi ini belum terjangkau layanan LokaClean (Hanya area Lombok).");
  }

  // Convert all files to public paths and store as JSON array
  const beforePhotos = files.map(file => fileToPublicPath(file));
  const beforePhotosJson = JSON.stringify(beforePhotos);

  const paket = await prisma.paketCleaning.findUnique({
    where: { id: input.paket_id },
    select: { id: true, price: true }
  });
  if (!paket) throw new HttpError(404, "PaketCleaning not found");

  // 2. Smart Dispatch: Find nearest cleaner
  // We prioritize cleaners who are active, nearby, and have good ratings.
  let cleaners: any[] = [];
  try {
    cleaners = await findNearestCleaners(input.location_latitude, input.location_longitude, 1);
  } catch (err) {
    console.warn("[createOrder] Failed to find nearest cleaners (likely missing PostGIS column):", err);
    // Continue without assigning a cleaner automatically
  }
  
  let assignedAdminId: number | null = null;
  let distanceMeters = 0;
  
  if (cleaners.length > 0) {
    const bestCleaner = cleaners[0];
    // Resolve Shadow Admin ID for the cleaner (User -> Admin)
    assignedAdminId = await resolveAdminId({ 
      id: bestCleaner.user_id, 
      origin: "USER", 
      actor: "SYSTEM_DISPATCH" 
    });
    distanceMeters = bestCleaner.distance_meters;
  }

  // 3. Pricing Engine
  const DISTANCE_RATE_PER_KM = 2000; // Rp 2.000 per km
  const distancePrice = Math.ceil(distanceMeters / 1000) * DISTANCE_RATE_PER_KM;
  const surgeMultiplier = 1.0; // Placeholder for future logic
  const basePrice = paket.price;
  
  // Calculate Extra Services Price
  const extraServices = input.extras || [];
  const extraPrice = extraServices.reduce((sum, item) => sum + item.price, 0);

  const totalPrice = Math.ceil((basePrice + distancePrice + extraPrice) * surgeMultiplier);
  
  // ETA: Assume 30km/h average speed in city = 500 meters/minute
  const estimatedEta = distanceMeters > 0 ? Math.ceil(distanceMeters / 500) : 30; // Default 30 mins if unknown

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
      admin_id: assignedAdminId, // Assigned Cleaner (Shadow Admin)
      paket_id: input.paket_id,
      status: OrderStatus.PENDING,
      room_photo_before: beforePhotosJson,
      room_photo_after: null,
      location_latitude: input.location_latitude,
      location_longitude: input.location_longitude,
      address: input.address,
      scheduled_date: input.scheduled_date,
      
      // Pricing fields
      base_price: basePrice,
      distance_price: distancePrice,
      extra_price: extraPrice,
      surge_multiplier: surgeMultiplier,
      total_price: totalPrice,
      estimated_eta: estimatedEta,
      
      extra_services: extraServices,

      pembayaran: {
        create: {
          method: input.payment_method as PaymentMethod,
          amount: totalPrice,
          status: PaymentStatus.PENDING
          // midtrans_order_id will be set when frontend requests Snap token (NON-CASH only)
        }
      }
    },
    include: orderInclude
  });

  // 4. Update PostGIS Location
  try {
    await prisma.$executeRaw`
      UPDATE "Pesanan"
      SET location = ST_SetSRID(ST_MakePoint(${input.location_longitude}, ${input.location_latitude}), 4326)
      WHERE id = ${order.id}
    `;
  } catch (err) {
    console.warn("[createOrder] Failed to update order location (likely missing PostGIS column):", err);
    // Ignore error so order creation succeeds
  }

  // 5. Realtime Notification
  try {
    const io = getIO();
    
    // Notify the assigned cleaner (Shadow Admin)
    if (assignedAdminId) {
      io.to(`admin_${assignedAdminId}`).emit("admin_new_order", { order });
    }
    
    // Notify global admin dashboard (for monitoring)
    io.to("admin_dashboard").emit("admin_new_order", { order });

    // Notify user
    io.to(`user_${req.auth.id}`).emit("order_created", { order });
  } catch (err) {
    console.warn("[createOrder] Failed to emit socket event:", err);
    // Don't fail the request just because socket failed
  }

  try {
    const userName = order.user?.full_name ?? "Customer";
    const paketName = order.paket?.name ?? "Paket Cleaning";
    await sendPushToAllAdmins({
      title: "Pesanan Baru Masuk",
      message: `Order #${order.order_number} dari ${userName} untuk ${paketName}`,
      url: `/admin/orders/${order.id}`,
      tag: `admin-order-${order.id}`
    });
  } catch (err) {
    console.warn("[createOrder] Failed to send admin push notification:", err);
  }

  // For NON-CASH payments, create a notification reminding user to pay.
  if (order.pembayaran?.method && order.pembayaran.method !== PaymentMethod.CASH) {
    await prisma.notification.create({
      data: {
        user_id: order.user_id,
        pesanan_id: order.id,
        title: "Segera Lakukan Pembayaran",
        message:
          "Kamu memilih metode pembayaran non-tunai. Segera selesaikan pembayaran dalam 1 jam agar pesanan bisa diproses. Pesanan akan dibatalkan otomatis jika belum dibayar."
      }
    });
  }

  // Notify Cleaner if assigned
  if (assignedAdminId && cleaners.length > 0) {
    const cleanerUserId = cleaners[0].user_id;
    await prisma.notification.create({
      data: {
        user_id: cleanerUserId,
        pesanan_id: order.id,
        title: "Pesanan Baru Masuk!",
        message: `Order #${order.order_number} baru saja masuk di dekatmu (${(cleaners[0].distance_meters/1000).toFixed(1)} km).`
      }
    });

    // Emit Socket Event
    try {
      getIO().to(`user_${cleanerUserId}`).emit("new_order", {
        order_id: order.id,
        order_number: order.order_number,
        distance_km: (cleaners[0].distance_meters/1000).toFixed(1)
      });
    } catch (err) {
      console.error("[Socket] Failed to emit new_order:", err);
    }
  }

  return created(res, { order });
});

export const createGuestOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const input = createGuestOrderInputSchema.parse(req.body);

  const serviceArea = await checkServiceArea(input.location_latitude, input.location_longitude);
  if (!serviceArea) {
    throw new HttpError(400, "Maaf, lokasi ini belum terjangkau layanan LokaClean (Hanya area Lombok).");
  }

  const beforePhotos = files.map(file => fileToPublicPath(file));
  const beforePhotosJson = JSON.stringify(beforePhotos);

  const paket = await prisma.paketCleaning.findUnique({
    where: { id: input.paket_id },
    select: { id: true, price: true }
  });
  if (!paket) throw new HttpError(404, "PaketCleaning not found");

  let cleaners: any[] = [];
  try {
    cleaners = await findNearestCleaners(input.location_latitude, input.location_longitude, 1);
  } catch (err) {
    console.warn("[createGuestOrder] Failed to find nearest cleaners (likely missing PostGIS column):", err);
  }

  let assignedAdminId: number | null = null;
  let distanceMeters = 0;

  if (cleaners.length > 0) {
    const bestCleaner = cleaners[0];
    assignedAdminId = await resolveAdminId({
      id: bestCleaner.user_id,
      origin: "USER",
      actor: "SYSTEM_DISPATCH"
    });
    distanceMeters = bestCleaner.distance_meters;
  }

  const DISTANCE_RATE_PER_KM = 2000;
  const distancePrice = Math.ceil(distanceMeters / 1000) * DISTANCE_RATE_PER_KM;
  const surgeMultiplier = 1.0;
  const basePrice = paket.price;

  const extraServices = input.extras || [];
  const extraPrice = extraServices.reduce((sum, item) => sum + item.price, 0);

  const totalPrice = Math.ceil((basePrice + distancePrice + extraPrice) * surgeMultiplier);

  const estimatedEta = distanceMeters > 0 ? Math.ceil(distanceMeters / 500) : 30;

  const maxOrder = await prisma.pesanan.findFirst({
    orderBy: { order_number: "desc" },
    select: { order_number: true }
  });
  const nextOrderNumber = maxOrder ? maxOrder.order_number + 1 : 1;

  const userId = await findOrCreateGuestUser(input.full_name, input.phone_number);

  const order = await prisma.pesanan.create({
    data: {
      order_number: nextOrderNumber,
      user_id: userId,
      admin_id: assignedAdminId,
      paket_id: input.paket_id,
      status: OrderStatus.PENDING,
      room_photo_before: beforePhotosJson,
      room_photo_after: null,
      location_latitude: input.location_latitude,
      location_longitude: input.location_longitude,
      address: input.address,
      scheduled_date: input.scheduled_date,
      base_price: basePrice,
      distance_price: distancePrice,
      extra_price: extraPrice,
      surge_multiplier: surgeMultiplier,
      total_price: totalPrice,
      estimated_eta: estimatedEta,
      extra_services: extraServices,
      pembayaran: {
        create: {
          method: input.payment_method as PaymentMethod,
          amount: totalPrice,
          status: PaymentStatus.PENDING
        }
      }
    },
    include: orderInclude
  });

  try {
    await prisma.$executeRaw`
      UPDATE "Pesanan"
      SET location = ST_SetSRID(ST_MakePoint(${input.location_longitude}, ${input.location_latitude}), 4326)
      WHERE id = ${order.id}
    `;
  } catch (err) {
    console.warn("[createGuestOrder] Failed to update order location (likely missing PostGIS column):", err);
  }

  try {
    const io = getIO();

    if (assignedAdminId) {
      io.to(`admin_${assignedAdminId}`).emit("admin_new_order", { order });
    }

    io.to("admin_dashboard").emit("admin_new_order", { order });

    io.to(`user_${userId}`).emit("order_created", { order });
  } catch (err) {
    console.warn("[createGuestOrder] Failed to emit socket event:", err);
  }

  try {
    const userName = order.user?.full_name ?? "Customer";
    const paketName = order.paket?.name ?? "Paket Cleaning";
    await sendPushToAllAdmins({
      title: "Pesanan Baru Masuk",
      message: `Order #${order.order_number} dari ${userName} untuk ${paketName}`,
      url: `/admin/orders/${order.id}`,
      tag: `admin-order-${order.id}`
    });
  } catch (err) {
    console.warn("[createGuestOrder] Failed to send admin push notification:", err);
  }

  if (order.pembayaran?.method && order.pembayaran.method !== PaymentMethod.CASH) {
    await prisma.notification.create({
      data: {
        user_id: order.user_id,
        pesanan_id: order.id,
        title: "Segera Lakukan Pembayaran",
        message:
          "Kamu memilih metode pembayaran non-tunai. Segera selesaikan pembayaran dalam 1 jam agar pesanan bisa diproses. Pesanan akan dibatalkan otomatis jika belum dibayar."
      }
    });
  }

  if (assignedAdminId && cleaners.length > 0) {
    const cleanerUserId = cleaners[0].user_id;
    await prisma.notification.create({
      data: {
        user_id: cleanerUserId,
        pesanan_id: order.id,
        title: "Pesanan Baru Masuk!",
        message: `Order #${order.order_number} baru saja masuk di dekatmu (${(cleaners[0].distance_meters / 1000).toFixed(
          1
        )} km).`
      }
    });

    try {
      getIO().to(`user_${cleanerUserId}`).emit("new_order", {
        order_id: order.id,
        order_number: order.order_number,
        distance_km: (cleaners[0].distance_meters / 1000).toFixed(1)
      });
    } catch (err) {
      console.error("[Socket] Failed to emit new_order:", err);
    }
  }

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
  try {
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
    } else if (statusFilter === 'processing') {
      // Dikonfirmasi: PROCESSING
      where.status = OrderStatus.PROCESSING;
    } else if (statusFilter === 'in_progress') {
      // In Progress: IN_PROGRESS
      where.status = OrderStatus.IN_PROGRESS;
    } else if (statusFilter === 'rate') {
      // Rate: COMPLETED but not rated OR IN_PROGRESS and > 1 hour past schedule
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      where.OR = [
        {
          status: OrderStatus.COMPLETED,
          rating: null
        },
        {
          status: OrderStatus.IN_PROGRESS,
          scheduled_date: {
            lt: oneHourAgo
          }
        }
      ];
    } else if (statusFilter === 'completed') {
      // Complete: COMPLETED
      where.status = OrderStatus.COMPLETED;
    } else if (statusFilter === 'cancelled') {
      // Cancelled: CANCELLED
      where.status = OrderStatus.CANCELLED;
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
  } catch (err) {
    console.error("[listMyOrdersHandler] Error:", err);
    throw err;
  }
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
  // // if (!files || files.length === 0) throw new HttpError(400, "room_photo_after is required (at least 1 photo)");

  // Ensure the order belongs to the user and check status
  const order = await getOrderForUserOrThrow(id, req.auth.id);

  const scheduledMs = order.scheduled_date instanceof Date
    ? order.scheduled_date.getTime()
    : new Date(order.scheduled_date as unknown as string).getTime();
  if (Number.isFinite(scheduledMs)) {
    const graceDeadlineMs = scheduledMs + 5 * 60 * 1000;
    if (Date.now() < graceDeadlineMs) {
      throw new HttpError(400, "After photo can only be uploaded 5 minutes after the scheduled time");
    }
  }

  if (order.pembayaran) {
    if (order.pembayaran.method === PaymentMethod.CASH) {
      // Allowed without upfront payment
    } else if (order.pembayaran.status !== PaymentStatus.PAID) {
      throw new HttpError(400, "Payment must be completed before uploading after photo");
    }
  }

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

  const scheduledMs = order.scheduled_date instanceof Date
    ? order.scheduled_date.getTime()
    : new Date(order.scheduled_date as unknown as string).getTime();
  if (Number.isFinite(scheduledMs)) {
    const graceDeadlineMs = scheduledMs + 5 * 60 * 1000;
    if (Date.now() < graceDeadlineMs) {
      throw new HttpError(400, "Order can only be completed 5 minutes after the scheduled time");
    }
  }

  if (order.pembayaran) {
    if (order.pembayaran.method === PaymentMethod.CASH) {
      // Allowed without upfront payment
    } else if (order.pembayaran.status !== PaymentStatus.PAID) {
      throw new HttpError(400, "Payment must be completed before finishing the order");
    }
  }

  // After photo check removed for user convenience
  /*
  // Original check removed
  */
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
  
  // After photo check removed for user convenience
  /*
  // Original check removed
  */
  
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
 * USER: Update payment method (e.g. CASH <-> TRANSFER) while order is still pending
 * and payment has not been processed yet.
 */
export const updatePaymentMethodHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  const id = parseId(req.params.id);
  const input = updatePaymentMethodSchema.parse(req.body);

  const order = await getOrderForUserOrThrow(id, req.auth.id);

  if (order.status !== OrderStatus.PENDING) {
    throw new HttpError(400, "Payment method can only be changed while order is PENDING");
  }

  if (!order.pembayaran || order.pembayaran.status !== PaymentStatus.PENDING) {
    throw new HttpError(400, "Payment method can only be changed while payment is still PENDING");
  }

  // If method is unchanged, just return current order
  if (order.pembayaran.method === input.payment_method) {
    return ok(res, { order });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pembayaran.update({
      where: { id: order.pembayaran!.id },
      data: {
        method: input.payment_method as PaymentMethod,
        // Clear any existing Midtrans order id when changing method
        midtrans_order_id: null
      }
    });

    // Refresh order with relations
    return await tx.pesanan.findUnique({
      where: { id: order.id },
      include: orderInclude
    });
  });

  if (!updated) {
    throw new HttpError(500, "Failed to update payment method");
  }

  return ok(res, { order: updated });
});

/**
 * ADMIN: View all orders.
 * Optional query params:
 * - user_type: 'ALL' | 'REGISTERED' | 'GUEST'
 */
export const listAllOrdersAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const userType = (req.query.user_type as string | undefined)?.toUpperCase() || "ALL";

  const baseWhere = {
    OR: [
      {
        pembayaran: {
          method: PaymentMethod.CASH
        }
      },
      {
        pembayaran: {
          method: {
            not: PaymentMethod.CASH
          },
          status: PaymentStatus.PAID
        }
      }
    ]
  } as const;

  const where: any = { ...baseWhere };

  if (userType === "GUEST") {
    where.user = {
      email: {
        endsWith: "@guest.lokaclean.app"
      }
    };
  } else if (userType === "REGISTERED") {
    where.user = {
      email: {
        not: {
          endsWith: "@guest.lokaclean.app"
        }
      }
    };
  }

  const items = await prisma.pesanan.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: orderInclude
  });

  return ok(res, { items });
});

/**
 * ADMIN: Get pending orders count for notifications.
 */
export const getPendingOrdersCountHandler = asyncHandler(async (_req: Request, res: Response) => {
  const where = {
    status: OrderStatus.PENDING,
    OR: [
      // CASH orders are always visible to admin
      {
        pembayaran: {
          method: PaymentMethod.CASH
        }
      },
      // Non-CASH but already PAID (e.g. user paid quickly via Midtrans)
      {
        pembayaran: {
          method: {
            not: PaymentMethod.CASH
          },
          status: PaymentStatus.PAID
        }
      }
    ]
  };

  const count = await prisma.pesanan.count({ where });

  // Also get the latest pending order for notification
  const latestPendingOrder = (await prisma.pesanan.findFirst({
    where,
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
  })) as (Pesanan & {
    user: { full_name: string };
    paket: { name: string };
  }) | null;

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
  
  // Resolve effective Admin ID (handling User-Admin case)
  const adminId = await resolveAdminId(req.auth);

  const order = await getOrderOrThrow(id);
  if (order.status === OrderStatus.COMPLETED) throw new HttpError(400, "Cannot assign a COMPLETED order");
  if (order.status !== OrderStatus.PENDING) throw new HttpError(400, "Order must be PENDING to assign");

  // Update order: assign admin and set status to IN_PROGRESS
  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.pesanan.update({
      where: { id },
      data: { admin_id: adminId, status: OrderStatus.IN_PROGRESS },
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

  await sendPushToUser(order.user_id, {
    title: "Pesanan Dikonfirmasi",
    message: `Petugas OTW bro! Pesanan #${order.id} (${order.paket.name}) sedang diproses.`,
    url: `/orders/${order.id}`,
    tag: `order-${order.id}`
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
  const adminId = await resolveAdminId(req.auth);

  const { status } = adminUpdateStatusSchema.parse(req.body);

  if (status === "COMPLETED") {
    throw new HttpError(400, "COMPLETED is set by the user verification step");
  }

  const order = await getOrderOrThrow(id);

  // Ensure the order is assigned to an admin before moving forward.
  const assignedAdminId = order.admin_id ?? adminId;

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
    if (order.admin_id !== adminId) throw new HttpError(403, "Only assigned admin can set IN_PROGRESS");
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



