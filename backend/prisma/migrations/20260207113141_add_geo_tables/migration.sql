/*
  Warnings:

  - A unique constraint covering the columns `[phone_number]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `total_price` to the `Pesanan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- AlterEnum
-- ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- ALTER TYPE "Role" ADD VALUE 'CLEANER';

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "phone_number" TEXT;

-- AlterTable
ALTER TABLE "PaketCleaning" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'SERVICE',
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "name_en" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Pesanan" ADD COLUMN     "base_price" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "distance_price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_eta" INTEGER,
ADD COLUMN     "surge_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "total_price" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "CleanerProfile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "active_orders" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_user_id_key" ON "CleanerProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_user_id_idx" ON "PushSubscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phone_number_key" ON "Admin"("phone_number");

-- AddForeignKey
ALTER TABLE "CleanerProfile" ADD CONSTRAINT "CleanerProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
