/**
 * API entrypoint for LokaClean.
 *
 * - Loads environment variables
 * - Ensures local upload directory exists (cloud-ready: swap storage provider later)
 * - Starts the Express server
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

import { PaymentMethod, PaymentStatus } from "@prisma/client";

import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { initSocket } from "./socket";

// Ensure upload directory exists for local disk storage.
// In production you can swap this for S3/GCS by replacing the storage module,
// while keeping the DB string fields identical (ERD-compatible).
const uploadDirAbs = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirAbs)) {
  fs.mkdirSync(uploadDirAbs, { recursive: true });
}

async function runAutoCancelUnpaidOrdersJob() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  try {
    const unpaidTransfers = await prisma.pembayaran.findMany({
      where: {
        method: { not: PaymentMethod.CASH },
        status: PaymentStatus.PENDING,
        created_at: { lte: cutoff },
        pesanan: {
          // Only consider orders that are still in PENDING state.
          status: "PENDING"
        }
      },
      include: {
        pesanan: true
      }
    });

    if (unpaidTransfers.length === 0) return;

    console.info("[AutoCancel] Found unpaid transfer orders to cancel:", unpaidTransfers.length);

    for (const payment of unpaidTransfers) {
      const order = payment.pesanan;
      if (!order) continue;

      await prisma.$transaction(async (tx) => {
        // Mark order as cancelled
        await tx.pesanan.update({
          where: { id: order.id },
          data: { status: "CANCELLED" as never }
        });

        // Create notification for user
        await tx.notification.create({
          data: {
            user_id: order.user_id,
            pesanan_id: order.id,
            title: "Pesanan Dibatalkan Otomatis",
            message:
              "Pesanan kamu dibatalkan karena belum ada pembayaran dalam 1 jam. Silakan buat pesanan baru jika masih ingin menggunakan layanan LokaClean."
          }
        });
      });
    }
  } catch (err) {
    console.error("[AutoCancel] Error while cancelling unpaid transfer orders:", err);
  }
}


const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = initSocket(server);

server.listen(env.PORT, () => {
  console.log(`[lokaclean-api] listening on :${env.PORT} (${env.NODE_ENV})`);

  // Start background job to auto-cancel unpaid transfer orders every 5 minutes.
  setInterval(runAutoCancelUnpaidOrdersJob, 5 * 60 * 1000);
});


