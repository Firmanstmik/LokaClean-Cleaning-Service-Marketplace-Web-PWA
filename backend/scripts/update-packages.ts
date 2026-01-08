/**
 * Script to update existing cleaning packages with new pricing.
 * 
 * Run from backend directory:
 *   npx tsx scripts/update-packages.ts
 * 
 * Or from project root:
 *   npx tsx backend/scripts/update-packages.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const newPackages = [
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
];

async function main() {
  console.log("🔄 Updating cleaning packages...\n");

  // Get all existing packages
  const existingPackages = await prisma.paketCleaning.findMany();
  console.log(`📦 Found ${existingPackages.length} existing package(s)\n`);

  // Update or create packages
  for (const newPkg of newPackages) {
    const existing = existingPackages.find(p => p.name === newPkg.name);
    
    if (existing) {
      // Update existing package
      await prisma.paketCleaning.update({
        where: { id: existing.id },
        data: {
          name: newPkg.name,
          description: newPkg.description,
          price: newPkg.price,
          estimated_duration: newPkg.estimated_duration
        }
      });
      console.log(`✅ Updated: ${newPkg.name} - Rp ${newPkg.price.toLocaleString("id-ID")}`);
    } else {
      // Create new package
      await prisma.paketCleaning.create({
        data: newPkg
      });
      console.log(`✨ Created: ${newPkg.name} - Rp ${newPkg.price.toLocaleString("id-ID")}`);
    }
  }

  console.log("\n✨ Package update completed!");
}

main()
  .catch((err) => {
    console.error("❌ Error updating packages:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

