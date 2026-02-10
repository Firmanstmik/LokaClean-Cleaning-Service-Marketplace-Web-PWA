/*
  Warnings:

  - You are about to drop the column `area` on the `ServiceArea` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
EXCEPTION
  WHEN duplicate_object THEN null;
END;

-- AlterEnum
BEGIN;
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLEANER';
EXCEPTION
  WHEN duplicate_object THEN null;
END;

-- DropIndex
DROP INDEX "cleaner_location_idx";

-- DropIndex
DROP INDEX "service_area_idx";

-- AlterTable
ALTER TABLE "Pesanan" ADD COLUMN     "extra_price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extra_services" JSONB;

-- AlterTable
ALTER TABLE "ServiceArea" DROP COLUMN "area";

-- CreateTable
CREATE TABLE "SavedAddress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "street" TEXT,
    "village" TEXT,
    "district" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "floor_number" TEXT,
    "building_name" TEXT,
    "gate_photo_url" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedAddress_user_id_idx" ON "SavedAddress"("user_id");

-- AddForeignKey
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
