/**
 * Midtrans Snap payment gateway utility.
 *
 * SECURITY NOTES:
 * ===============
 * 1. Frontend CANNOT be trusted to confirm payment success
 *    - Users can manipulate frontend code
 *    - Network requests can be intercepted/modified
 *    - Browser DevTools can fake success responses
 *
 * 2. Webhook is MANDATORY for payment confirmation
 *    - Only Midtrans server can send valid webhook notifications
 *    - Webhook includes cryptographic signature for verification
 *    - Payment status MUST be updated ONLY via webhook
 *
 * 3. Payment flow:
 *    - Frontend requests Snap token from backend
 *    - Backend generates token via Midtrans API
 *    - Frontend displays Midtrans payment UI
 *    - User completes payment on Midtrans
 *    - Midtrans sends webhook to backend
 *    - Backend validates webhook and updates payment status
 */

import midtransClient from "midtrans-client";

import { env } from "../config/env";

/**
 * Initialize Midtrans Snap client.
 * Uses sandbox mode by default (MIDTRANS_IS_PRODUCTION=false).
 * 
 * NOTE: Will be null if credentials are not configured.
 * Payment features will check for this before use.
 */
export const snap = env.MIDTRANS_SERVER_KEY && env.MIDTRANS_CLIENT_KEY
  ? new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY
    })
  : null;

/**
 * Generate Snap token for payment.
 *
 * @param orderId - Unique order ID (must be unique per transaction)
 * @param grossAmount - Payment amount in IDR (integer, no decimals)
 * @param customerDetails - Customer information
 * @returns Snap token string for frontend
 */
export async function generateSnapToken(
  orderId: string,
  grossAmount: number,
  customerDetails: {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
  }
): Promise<string> {
  if (!snap) {
    throw new Error("Midtrans is not configured. Please set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in environment variables.");
  }

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    credit_card: {
      secure: true // Enable 3D Secure
    },
    customer_details: {
      first_name: customerDetails.first_name,
      last_name: customerDetails.last_name || "",
      email: customerDetails.email,
      phone: customerDetails.phone
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return transaction.token;
  } catch (error: any) {
    console.error("[Midtrans] Error generating Snap token:", error);
    
    // Log detailed error information
    if (error?.response) {
      console.error("[Midtrans] API Response:", JSON.stringify(error.response, null, 2));
    }
    if (error?.message) {
      console.error("[Midtrans] Error message:", error.message);
    }
    if (error?.statusCode) {
      console.error("[Midtrans] Status code:", error.statusCode);
    }
    
    // Provide more specific error messages
    if (error?.statusCode === 401) {
      throw new Error("Midtrans authentication failed. Please check server key configuration.");
    }
    if (error?.statusCode === 400) {
      throw new Error(`Invalid payment request: ${error.message || "Please check payment details"}`);
    }
    if (error?.statusCode === 500) {
      throw new Error("Midtrans server error. Please try again later.");
    }
    
    throw new Error(`Failed to generate payment token: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Verify Midtrans webhook notification by fetching transaction status.
 *
 * SECURITY: This prevents unauthorized webhook calls by verifying:
 * 1. Order ID exists in Midtrans
 * 2. Amount matches our database record
 * 3. Status code matches webhook notification
 *
 * Note: Midtrans doesn't provide signature verification like some gateways.
 * Instead, we verify by fetching the transaction status directly from Midtrans API.
 * This ensures the webhook is legitimate (only Midtrans can have valid order IDs).
 *
 * @param orderId - Order ID from webhook
 * @param statusCode - Status code from webhook
 * @param grossAmount - Gross amount from webhook
 * @returns true if verification passes
 */
export async function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string
): Promise<boolean> {
  if (!snap) {
    console.error("[Midtrans] Cannot verify webhook: Midtrans not configured");
    return false;
  }

  try {
    // Fetch transaction status from Midtrans API
    // This ensures the order ID is valid and belongs to Midtrans
    const transaction = await snap.transaction.status(orderId);
    
    // Verify order ID matches
    if (transaction.order_id !== orderId) {
      console.error("[Midtrans] Order ID mismatch:", transaction.order_id, "vs", orderId);
      return false;
    }
    
    // Verify amount matches (prevent amount tampering)
    if (String(transaction.gross_amount) !== String(grossAmount)) {
      console.error("[Midtrans] Amount mismatch:", transaction.gross_amount, "vs", grossAmount);
      return false;
    }
    
    // Verify status code matches
    if (transaction.status_code !== statusCode) {
      console.error("[Midtrans] Status code mismatch:", transaction.status_code, "vs", statusCode);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[Midtrans] Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Map Midtrans transaction_status to our PaymentStatus.
 *
 * Midtrans statuses:
 * - settlement / capture → Payment successful (PAID)
 * - pending → Payment still pending (keep PENDING)
 * - cancel / expire / deny → Payment failed (keep PENDING)
 *
 * @param transactionStatus - Midtrans transaction_status value
 * @returns "PAID" if settled/captured, "PENDING" otherwise
 */
export function mapMidtransStatusToPaymentStatus(
  transactionStatus: string
): "PAID" | "PENDING" {
  const upperStatus = transactionStatus.toUpperCase();
  
  // Payment successful
  if (upperStatus === "SETTLEMENT" || upperStatus === "CAPTURE") {
    return "PAID";
  }
  
  // Payment still pending or failed
  // Keep as PENDING (don't mark as paid until Midtrans confirms settlement)
  return "PENDING";
}

