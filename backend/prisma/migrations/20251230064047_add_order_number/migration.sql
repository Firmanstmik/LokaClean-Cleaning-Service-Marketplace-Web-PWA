-- Step 1: Add order_number column as nullable first
ALTER TABLE "Pesanan" ADD COLUMN "order_number" INTEGER;

-- Step 2: Populate order_number for existing rows based on created_at order (1, 2, 3, ...)
-- This uses ROW_NUMBER() to assign sequential numbers based on creation time
UPDATE "Pesanan" 
SET "order_number" = subquery.row_num
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC) AS row_num
  FROM "Pesanan"
) AS subquery
WHERE "Pesanan"."id" = subquery.id;

-- Step 3: Set column to NOT NULL and add unique constraint
ALTER TABLE "Pesanan" ALTER COLUMN "order_number" SET NOT NULL;
CREATE UNIQUE INDEX "Pesanan_order_number_key" ON "Pesanan"("order_number");

