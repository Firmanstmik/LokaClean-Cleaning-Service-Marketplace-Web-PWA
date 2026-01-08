/**
 * Payment controllers.
 *
 * SECURITY ARCHITECTURE:
 * ======================
 * 1. Frontend CANNOT confirm payment success
 *    - Users can manipulate browser code
 *    - Network requests can be intercepted
 *    - Payment status MUST come from Midtrans webhook ONLY
 *
 * 2. Payment flow:
 *    a) User creates order with payment method (CASH or NON-CASH)
 *    b) If NON-CASH → Frontend requests Snap token from backend
 *    c) Backend generates Midtrans Snap token
 *    d) Frontend displays Midtrans payment UI
 *    e) User pays via Midtrans
 *    f) Midtrans sends webhook to backend
 *    g) Backend validates webhook and updates payment status
 *
 * 3. CASH payments:
 *    - Skip Midtrans entirely
 *    - Status remains PENDING until admin manually marks as PAID
 */

import type { Request, Response } from "express";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { updatePaymentStatusSchema, requestSnapTokenSchema } from "./payments.schemas";
import {
  generateSnapToken,
  verifyWebhookSignature,
  mapMidtransStatusToPaymentStatus
} from "../../utils/midtrans";

/**
 * ADMIN: Update payment status manually (for CASH payments or corrections).
 */
export const updatePaymentStatusAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  const { status } = updatePaymentStatusSchema.parse(req.body);

  const payment = await prisma.pembayaran.update({
    where: { id },
    data: { status: status as PaymentStatus },
    select: { id: true, method: true, amount: true, status: true, created_at: true, pesanan_id: true }
  });

  // If payment is marked as PAID, update order status to PROCESSING
  if (status === "PAID") {
    await prisma.pesanan.update({
      where: { id: payment.pesanan_id },
      data: { status: OrderStatus.PROCESSING }
    });
  }

  return ok(res, { payment });
});

/**
 * USER: Request Snap token for NON-CASH payment.
 *
 * This endpoint is called AFTER order creation when payment method is NON-CASH.
 * Frontend will use the returned token to display Midtrans payment UI.
 *
 * IMPORTANT: This does NOT confirm payment. Payment confirmation comes via webhook.
 */
export const requestSnapTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const input = requestSnapTokenSchema.parse(req.body);

  // Verify order exists and belongs to authenticated user
  const order = await prisma.pesanan.findUnique({
    where: { id: input.pesanan_id },
    include: { pembayaran: true, user: true }
  });

  if (!order) throw new HttpError(404, "Order not found");
  if (order.user_id !== req.auth.id) throw new HttpError(403, "Order does not belong to you");
  if (!order.pembayaran) throw new HttpError(400, "Order has no payment record");

  // Only generate token for NON-CASH payments
  if (order.pembayaran.method === PaymentMethod.CASH) {
    throw new HttpError(400, "CASH payments do not require Snap token");
  }

  // Check if payment already has a token (idempotency)
  if (order.pembayaran.midtrans_order_id) {
    // Regenerate token for existing Midtrans order
    const existingOrderId = order.pembayaran.midtrans_order_id;
    try {
      const token = await generateSnapToken(
        existingOrderId,
        order.pembayaran.amount,
        input.customer_details
      );
      return ok(res, { snap_token: token, order_id: existingOrderId });
    } catch (error) {
      // If regeneration fails, create new order ID
      console.error("[Payment] Failed to regenerate token, creating new order ID:", error);
      // Log the actual error for debugging
      if (error instanceof Error) {
        console.error("[Payment] Error details:", error.message, error.stack);
      }
    }
  }

  // Generate unique Midtrans order ID
  // Format: LOKACLEAN-{pesanan_id}-{timestamp}
  const midtransOrderId = `LOKACLEAN-${order.id}-${Date.now()}`;

  try {
    // Generate Snap token
    const snapToken = await generateSnapToken(
      midtransOrderId,
      order.pembayaran.amount,
      input.customer_details
    );

    // Save Midtrans order ID to payment record
    await prisma.pembayaran.update({
      where: { id: order.pembayaran.id },
      data: { midtrans_order_id: midtransOrderId }
    });

    return ok(res, { snap_token: snapToken, order_id: midtransOrderId });
  } catch (error) {
    // Log detailed error for debugging
    console.error("[Payment] Error generating Snap token:", error);
    if (error instanceof Error) {
      console.error("[Payment] Error message:", error.message);
      console.error("[Payment] Error stack:", error.stack);
      
      // Check if it's a Midtrans configuration error
      if (error.message.includes("not configured")) {
        throw new HttpError(500, "Payment gateway is not configured. Please contact administrator.");
      }
      
      // Check if it's a Midtrans API error
      if (error.message.includes("Failed to generate payment token")) {
        throw new HttpError(500, "Failed to initialize payment. Please check your payment method or try again later.");
      }
    }
    
    // Generic error
    throw new HttpError(500, "Failed to process payment request. Please try again or contact support.");
  }
});

/**
 * MIDTRANS WEBHOOK: Handle payment notification.
 *
 * This is the ONLY source of truth for payment status.
 * Frontend cannot be trusted to confirm payment success.
 *
 * Webhook flow:
 * 1. Midtrans sends POST request to this endpoint
 * 2. Backend validates webhook signature
 * 3. Backend updates payment status based on transaction_status
 * 4. If payment is PAID, update order status to PROCESSING
 *
 * IMPORTANT: Always return 200 OK to Midtrans, even on errors.
 * Midtrans will retry if we return error status.
 */
export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  // Midtrans webhook sends notification JSON
  const notification = req.body;

  // Extract required fields
  const orderId = notification.order_id;
  const transactionStatus = notification.transaction_status;
  const statusCode = notification.status_code;
  const grossAmount = notification.gross_amount;

  if (!orderId || !transactionStatus || !statusCode || !grossAmount) {
    console.error("[Payment Webhook] Missing required fields:", notification);
    return res.status(200).json({ status: "error", message: "Missing required fields" });
  }

  // Find payment by Midtrans order ID
  const payment = await prisma.pembayaran.findFirst({
    where: { midtrans_order_id: orderId },
    include: { pesanan: true }
  });

  if (!payment) {
    console.error("[Payment Webhook] Payment not found for order_id:", orderId);
    return res.status(200).json({ status: "error", message: "Payment not found" });
  }

  // Verify webhook signature (prevent unauthorized calls)
  const isValid = await verifyWebhookSignature(orderId, statusCode, String(grossAmount));
  if (!isValid) {
    console.error("[Payment Webhook] Invalid signature for order_id:", orderId);
    return res.status(200).json({ status: "error", message: "Invalid signature" });
  }

  // Map Midtrans status to our payment status
  const newPaymentStatus = mapMidtransStatusToPaymentStatus(transactionStatus);

  // Update payment status (idempotent - safe to call multiple times)
  // If status is already PAID, this won't change anything
  await prisma.pembayaran.update({
    where: { id: payment.id },
    data: { status: newPaymentStatus as PaymentStatus }
  });

  // If payment is PAID, update order status to PROCESSING
  // Only update if order is still PENDING (idempotent)
  if (newPaymentStatus === "PAID" && payment.pesanan.status === OrderStatus.PENDING) {
    await prisma.pesanan.update({
      where: { id: payment.pesanan_id },
      data: { status: OrderStatus.PROCESSING }
    });
  }

  // Always return 200 OK to Midtrans
  return res.status(200).json({ status: "ok", message: "Webhook processed" });
});
