
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database schema integrity...");
  try {
    await prisma.$connect();

    // 1. Check Pesanan columns
    console.log("Checking table 'Pesanan'...");
    
    // extra_price
    const checkExtraPrice = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Pesanan' AND column_name = 'extra_price';
    `;
    if (Array.isArray(checkExtraPrice) && checkExtraPrice.length === 0) {
      console.log("⚠️ Column 'extra_price' missing. Adding...");
      await prisma.$executeRawUnsafe(`ALTER TABLE "Pesanan" ADD COLUMN "extra_price" INTEGER NOT NULL DEFAULT 0;`);
      console.log("✅ Column 'extra_price' added.");
    } else {
      console.log("✅ Column 'extra_price' exists.");
    }

    // extra_services
    const checkExtraServices = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Pesanan' AND column_name = 'extra_services';
    `;
    if (Array.isArray(checkExtraServices) && checkExtraServices.length === 0) {
      console.log("⚠️ Column 'extra_services' missing. Adding...");
      await prisma.$executeRawUnsafe(`ALTER TABLE "Pesanan" ADD COLUMN "extra_services" JSONB;`);
      console.log("✅ Column 'extra_services' added.");
    } else {
      console.log("✅ Column 'extra_services' exists.");
    }

    // 2. Check Enums
    console.log("Checking Enums...");
    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';`);
        console.log("✅ Enum OrderStatus checked/updated.");
    } catch (e) {
        console.log("ℹ️ Enum OrderStatus check skipped (might not support IF NOT EXISTS on older Postgres).");
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLEANER';`);
        console.log("✅ Enum Role checked/updated.");
    } catch (e) {
        console.log("ℹ️ Enum Role check skipped.");
    }

    // 3. Check ServiceArea (drop area column if exists)
    const checkArea = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ServiceArea' AND column_name = 'area';
    `;
    if (Array.isArray(checkArea) && checkArea.length > 0) {
       console.log("⚠️ Column 'area' in ServiceArea exists (should be removed). Removing...");
       await prisma.$executeRawUnsafe(`ALTER TABLE "ServiceArea" DROP COLUMN "area";`);
       console.log("✅ Column 'area' removed.");
    }

    console.log("\n---------------------------------------------------");
    console.log("🎉 Database schema verified manually!");
    console.log("---------------------------------------------------");

  } catch (error) {
    console.error("❌ Error fixing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
