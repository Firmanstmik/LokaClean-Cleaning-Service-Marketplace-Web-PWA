/*
  Warnings:

  - You are about to drop the column `area` on the `ServiceArea` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "cleaner_location_idx";

-- DropIndex
DROP INDEX "service_area_idx";

-- AlterTable
ALTER TABLE "ServiceArea" DROP COLUMN "area";
