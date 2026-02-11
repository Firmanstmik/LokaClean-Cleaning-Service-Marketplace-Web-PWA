
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Prisma Query for Orders...");
  try {
    // 1. Connect
    await prisma.$connect();
    console.log("Connected to DB.");

    // 2. Define Include Object (copied from orders.controller.ts)
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
      description: true,
      price: true,
      estimated_duration: true,
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
    };

    // 3. Run Query
    console.log("Executing findMany with take: 1...");
    const items = await prisma.pesanan.findMany({
      take: 1,
      orderBy: { created_at: "desc" },
      include: orderInclude
    });

    console.log("Query Successful!");
    console.log("Items found:", items.length);
    if (items.length > 0) {
      console.log("First item sample:", JSON.stringify(items[0], null, 2));
    }

  } catch (error) {
    console.error("CRITICAL ERROR during query execution:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
