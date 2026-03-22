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

type FlexiblePackageInput = {
  name: string;
  description: string;
  base_price: number;
  discount_percentage: number;
  final_price: number;
  estimated_duration: number;
};

const newPackages: FlexiblePackageInput[] = [
  {
    name: "Pembersihan Rumah Baru",
    description: "Pembersihan rumah baru jadi untuk siap ditempati. Termasuk pembersihan menyeluruh seluruh area rumah, dapur, kamar mandi, dan ruangan lainnya.",
    base_price: 1500000,
    discount_percentage: 0,
    final_price: 1500000,
    estimated_duration: 240
  },
  {
    name: "Pembersihan 1 Kamar",
    description: "Pembersihan dan perapian untuk 1 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang.",
    base_price: 300000,
    discount_percentage: 0,
    final_price: 300000,
    estimated_duration: 90
  },
  {
    name: "Pembersihan 2 Kamar",
    description: "Pembersihan dan perapian untuk 2 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang untuk kedua kamar.",
    base_price: 400000,
    discount_percentage: 0,
    final_price: 400000,
    estimated_duration: 150
  },
  {
    name: "Pembersihan 3 Kamar",
    description: "Pembersihan dan perapian untuk 3 kamar. Termasuk pembersihan lantai, kamar mandi, area tidur, dan penataan barang untuk ketiga kamar.",
    base_price: 500000,
    discount_percentage: 0,
    final_price: 500000,
    estimated_duration: 210
  }
];

async function main() {
  console.log("🔄 Updating cleaning packages...\n");

  // Get all existing packages
  const existingPackages: Array<{ id: number; name: string }> = await (prisma as any).paketCleaning.findMany({
    select: { id: true, name: true }
  });
  console.log(`📦 Found ${existingPackages.length} existing package(s)\n`);

  // Update or create packages
  for (const newPkg of newPackages) {
    const existing = existingPackages.find(p => p.name === newPkg.name);
    
    if (existing) {
      // Update existing package
      await (prisma as any).paketCleaning.update({
        where: { id: existing.id },
        data: {
          name: newPkg.name,
          description: newPkg.description,
          base_price: newPkg.base_price,
          discount_percentage: newPkg.discount_percentage,
          final_price: newPkg.final_price,
          estimated_duration: newPkg.estimated_duration
        }
      });
      console.log(`✅ Updated: ${newPkg.name} - Rp ${newPkg.base_price.toLocaleString("id-ID")}`);
    } else {
      // Create new package
      await (prisma as any).paketCleaning.create({ data: newPkg });
      console.log(`✨ Created: ${newPkg.name} - Rp ${newPkg.base_price.toLocaleString("id-ID")}`);
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

