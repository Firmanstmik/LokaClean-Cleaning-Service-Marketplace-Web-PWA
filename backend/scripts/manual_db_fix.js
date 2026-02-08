const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting manual DB fix for migration 20260207113141_add_geo_tables...');

  // 1. Create Tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS "CleanerProfile" (
        "id" SERIAL NOT NULL,
        "user_id" INTEGER NOT NULL,
        "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        "active_orders" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE TABLE IF NOT EXISTS "ServiceArea" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" SERIAL NOT NULL,
        "user_id" INTEGER NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
    );`
  ];

  for (const sql of tables) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('Table check/create success.');
    } catch (e) {
      console.error('Table creation error (ignoring if exists):', e.message);
    }
  }

  // 2. Add Columns
  const columns = [
    'ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;',
    `ALTER TABLE "PaketCleaning" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'SERVICE';`,
    'ALTER TABLE "PaketCleaning" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
    'ALTER TABLE "PaketCleaning" ADD COLUMN IF NOT EXISTS "name_en" TEXT;',
    'ALTER TABLE "PaketCleaning" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 100;',
    'ALTER TABLE "Pesanan" ADD COLUMN IF NOT EXISTS "base_price" INTEGER NOT NULL DEFAULT 50000;',
    'ALTER TABLE "Pesanan" ADD COLUMN IF NOT EXISTS "distance_price" INTEGER NOT NULL DEFAULT 0;',
    'ALTER TABLE "Pesanan" ADD COLUMN IF NOT EXISTS "estimated_eta" INTEGER;',
    'ALTER TABLE "Pesanan" ADD COLUMN IF NOT EXISTS "surge_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;',
    'ALTER TABLE "Pesanan" ADD COLUMN IF NOT EXISTS "total_price" INTEGER NOT NULL DEFAULT 0;' // Added default 0 for safety
  ];

  for (const sql of columns) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('Column check/add success.');
    } catch (e) {
      console.error('Column addition error:', e.message);
    }
  }

  // 3. Create Indexes & Constraints
  const indexes = [
    'CREATE UNIQUE INDEX IF NOT EXISTS "CleanerProfile_user_id_key" ON "CleanerProfile"("user_id");',
    'CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");',
    'CREATE INDEX IF NOT EXISTS "PushSubscription_user_id_idx" ON "PushSubscription"("user_id");',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Admin_phone_number_key" ON "Admin"("phone_number");'
  ];

  for (const sql of indexes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('Index check/create success.');
    } catch (e) {
      console.error('Index creation error:', e.message);
    }
  }

  // 4. Foreign Keys
  const fks = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CleanerProfile_user_id_fkey') THEN
         ALTER TABLE "CleanerProfile" ADD CONSTRAINT "CleanerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
       END IF;
     END $$;`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_user_id_fkey') THEN
         ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
       END IF;
     END $$;`
  ];

  for (const sql of fks) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('FK check/create success.');
    } catch (e) {
      console.error('FK creation error:', e.message);
    }
  }

  console.log('Manual DB fix finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
