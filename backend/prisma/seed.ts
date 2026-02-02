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

// --- Phone Utils (Copied to avoid import issues in seed) ---
function sanitizePhoneInput(raw: string) {
  const trimmed = raw.trim();
  return trimmed.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function normalizeWhatsAppPhone(raw: string, defaultCountryCode = "62") {
  const cleaned = sanitizePhoneInput(raw);
  if (!cleaned) return null;

  const cc = defaultCountryCode.replace(/[^\d]/g, "");
  let out = cleaned;

  if (out.startsWith("00")) out = `+${out.slice(2)}`;
  if (out.startsWith("+0")) out = `+${cc}${out.slice(2)}`;
  if (!out.startsWith("+") && out.startsWith("0")) out = `+${cc}${out.slice(1)}`;
  if (!out.startsWith("+")) out = `+${out}`;

  // E.164-ish: max 15 digits, cannot start with 0
  if (!/^\+[1-9]\d{5,14}$/.test(out)) return null;
  return out;
}
// ---------------------------------------------------------

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@lokaclean.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin12345";
  const adminFullName = process.env.ADMIN_SEED_FULL_NAME ?? "LokaClean Admin";
  // Default phone from user request if not in env
  const adminPhoneRaw = process.env.ADMIN_SEED_PHONE ?? "081236893055"; 
  const adminPhone = normalizeWhatsAppPhone(adminPhoneRaw);

  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    // Create new admin
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.admin.create({
      data: {
        full_name: adminFullName,
        email: adminEmail,
        phone_number: adminPhone, // Add phone
        password: passwordHash,
        role: Role.ADMIN
      }
    });
    console.log(`Seeded admin: ${adminEmail} with phone ${adminPhone}`);
  } else {
    // Update existing admin to ensure phone number is set
    // Only update if phone is missing or we want to enforce the seed phone
    // Let's enforce it so the user can login with the number they expect
    if (adminPhone && existingAdmin.phone_number !== adminPhone) {
      await prisma.admin.update({
        where: { email: adminEmail },
        data: { phone_number: adminPhone }
      });
      console.log(`Updated admin ${adminEmail} with phone ${adminPhone}`);
    } else {
      console.log(`Admin ${adminEmail} already has correct phone.`);
    }
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


