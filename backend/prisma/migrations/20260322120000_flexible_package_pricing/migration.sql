-- Add flexible pricing fields for PaketCleaning.

ALTER TABLE "PaketCleaning"
  ADD COLUMN "discount_percentage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "final_price" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pricing_note" TEXT;

UPDATE "PaketCleaning"
SET
  "discount_percentage" = 0,
  "final_price" = "price"
WHERE "final_price" = 0 AND "price" > 0;

ALTER TABLE "PaketCleaning"
  ADD CONSTRAINT "PaketCleaning_discount_percentage_range"
  CHECK ("discount_percentage" >= 0 AND "discount_percentage" <= 100);

ALTER TABLE "PaketCleaning"
  ADD CONSTRAINT "PaketCleaning_final_price_nonnegative"
  CHECK ("final_price" >= 0);
