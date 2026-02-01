/**
 * Payment service for Midtrans integration.
 *
 * Contains business logic for Midtrans API calls and webhook processing.
 */

import crypto from "node:crypto";
import * as midtransClient from "midtrans-client";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../utils/httpError";

/**
 * Generate Snap token for order payment.
 * Validates order, payment, and calls Midtrans API.
 */
export async function generateSnapToken(orderId: number, userId: number): Promise<string> {
  // Check if Midtrans is configured
  if (!env.MIDTRANS_SERVER_KEY) {
    throw new HttpError(503, "Payment gateway is not configured");
  }

  // Fetch order with payment and user data
  const order = await prisma.pesanan.findFirst({
    where: { id: orderId, user_id: userId },
    include: {
      pembayaran: true,
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true
        }
      }
    }
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  if (!order.pembayaran) {
    throw new HttpError(404, "Payment not found");
  }

  const payment = order.pembayaran;
  const user = order.user;

  // Validate payment method is NON-CASH
  if (payment.method === PaymentMethod.CASH) {
    throw new HttpError(400, "Cannot generate payment token for CASH payment method");
  }

  // Validate payment status is PENDING
  if (payment.status !== PaymentStatus.PENDING) {
    throw new HttpError(400, "Payment is already processed");
  }

  // Generate unique Midtrans order_id
  const timestamp = Date.now();
  const midtransOrderId = `ORDER-${orderId}-${timestamp}`;

  // Initialize Midtrans Snap client
  const snap = new midtransClient.Snap({
    // Still enforced as SANDBOX for this endpoint via ensureSandboxOnly(),
    // but we respect the env flag so the same service can be reused if needed.
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY
  });

  // Split full_name into first_name and last_name
  // If full_name contains space, split it; otherwise use full_name as first_name
  const nameParts = user.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || user.full_name;
  const lastName = nameParts.slice(1).join(" ") || "";

  // Prepare transaction parameters
  const parameter = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: payment.amount
    },
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone: user.phone_number
    }
  };

  // Create transaction with Midtrans
  let transactionToken: string;
  try {
    const transaction = await snap.createTransaction(parameter);
    transactionToken = transaction.token;
  } catch (error) {
    console.error("Midtrans API error:", error);
    throw new HttpError(502, "Failed to create payment transaction");
  }

  // Update midtrans_order_id in database
  await prisma.pembayaran.update({
    where: { id: payment.id },
    data: { midtrans_order_id: midtransOrderId }
  });

  console.info("[Payments] Snap token generated (service)", {
    orderId,
    userId,
    paymentId: payment.id,
    midtransOrderId,
    amount: payment.amount
  });

  return transactionToken;
}

/**
 * Handle Midtrans webhook notification.
 * Verifies signature, processes notification, and updates payment status.
 * Always returns success (never throws) to satisfy Midtrans requirements.
 */
export async function handleWebhookNotification(notificationJson: unknown): Promise<void> {
  // Check if Midtrans is configured
  if (!env.MIDTRANS_SERVER_KEY) {
    console.error("Webhook: Midtrans server key not configured");
    return;
  }

  try {
    // Type guard for notification object
    if (!notificationJson || typeof notificationJson !== "object") {
      console.error("Webhook: Invalid notification format");
      return;
    }

    const notification = notificationJson as Record<string, unknown>;
    const orderId = String(notification.order_id || "");
    const statusCode = String(notification.status_code || "");
    const grossAmount = String(notification.gross_amount || "");
    const signatureKey = String(notification.signature_key || "");

    console.info("[Payments] Webhook received", {
      orderId,
      statusCode,
      grossAmount
    });

    // Verify signature
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(orderId + statusCode + grossAmount + env.MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (signatureKey !== calculatedSignature) {
      console.error("Webhook: Invalid signature for order_id:", orderId);
      return; // Still return success (200 OK)
    }

    // Initialize Midtrans Snap client (webhook must follow the actual env flag)
    const apiClient = new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY
    });

    // Process notification using SDK
    const statusResponse = await apiClient.transaction.notification(notificationJson);

    const midtransOrderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.info("[Payments] Webhook status", {
      orderId: midtransOrderId,
      transactionStatus,
      fraudStatus
    });

    // Find payment by midtrans_order_id
    const payment = await prisma.pembayaran.findFirst({
      where: { midtrans_order_id: midtransOrderId },
      include: {
        pesanan: {
          select: {
            id: true,
            user_id: true
          }
        }
      }
    });

    if (!payment) {
      console.warn("Webhook: Payment not found for midtrans_order_id:", midtransOrderId);
      return; // Still return success (200 OK)
    }

    // Idempotent check: if already PAID, do nothing
    if (payment.status === PaymentStatus.PAID) {
      return; // Already processed
    }

    // Handle transaction status
    const shouldMarkAsPaid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept");

    if (shouldMarkAsPaid) {
      // Update payment status to PAID and create notification in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.pembayaran.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAID }
        });

        await tx.notification.create({
          data: {
            user_id: payment.pesanan.user_id,
            pesanan_id: payment.pesanan.id,
            title: "Pembayaran Berhasil",
            message: `Pembayaran untuk pesanan #${payment.pesanan.id} telah berhasil. Terima kasih!`
          }
        });
      });

      console.info("[Payments] Payment marked as PAID", {
        paymentId: payment.id,
        pesananId: payment.pesanan.id,
        midtransOrderId,
        transactionStatus,
        fraudStatus
      });
    }
    // For pending, deny, cancel, expire: keep status as PENDING (no action needed)
  } catch (error) {
    // Log error but never throw - always return success
    console.error("Webhook: Error processing notification:", error);
  }
}
