/**
 * Prisma seed for local/dev environments.
 *
 * Creates:
 * - 1 Admin account (from env variables)
 * - A few default cleaning packages (if none exist)
 *
 * NOTE: Keep this seed minimal and deterministic. It should not create "extra" entities
 * beyond what the ERD defines.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@lokaclean.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin12345";
  const adminFullName = process.env.ADMIN_SEED_FULL_NAME ?? "LokaClean Admin";

  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.admin.create({
      data: {
        full_name: adminFullName,
        email: adminEmail,
        password: passwordHash,
        role: Role.ADMIN
      }
    });
    console.log(`Seeded admin: ${adminEmail}`);
  }

  const packageCount = await prisma.paketCleaning.count();
  if (packageCount === 0) {
    await prisma.paketCleaning.createMany({
      data: [
        {
          name: "Pembersihan Rumah Baru",
          description: "Pembersihan rumah baru jadi untuk siap ditempati. Termasuk pembersihan menyeluruh seluruh area rumah, dapur, kamar mandi, dan ruangan lainnya.",
          price: 1500000,
          estimated_duration: 240
        },
        {
          name: "Pembersihan 1 Kamar",
          description: "Pembersihan dan perapian untuk 1 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang.",
          price: 300000,
          estimated_duration: 90
        },
        {
          name: "Pembersihan 2 Kamar",
          description: "Pembersihan dan perapian untuk 2 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang untuk kedua kamar.",
          price: 400000,
          estimated_duration: 150
        },
        {
          name: "Pembersihan 3 Kamar",
          description: "Pembersihan dan perapian untuk 3 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang untuk ketiga kamar.",
          price: 500000,
          estimated_duration: 210
        }
      ]
    });
    console.log("Seeded default PaketCleaning rows.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


