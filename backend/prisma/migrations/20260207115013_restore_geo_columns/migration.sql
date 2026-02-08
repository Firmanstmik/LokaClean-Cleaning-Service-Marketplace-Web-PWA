
-- Add geography columns back
ALTER TABLE "CleanerProfile" ADD COLUMN "location" geography(Point, 4326);
ALTER TABLE "ServiceArea" ADD COLUMN "area" geography(Polygon, 4326);
ALTER TABLE "Pesanan" ADD COLUMN "location" geography(Point, 4326);

-- Create indexes
CREATE INDEX "cleaner_location_idx" ON "CleanerProfile" USING GIST ("location");
CREATE INDEX "service_area_idx" ON "ServiceArea" USING GIST ("area");

-- Re-insert Lombok Service Area
DELETE FROM "ServiceArea" WHERE name = 'Lombok Island';
INSERT INTO "ServiceArea" (name, area, "updated_at")
VALUES (
  'Lombok Island',
  ST_GeographyFromText('POLYGON((115.81 -8.37, 116.85 -8.37, 116.85 -8.97, 115.81 -8.97, 115.81 -8.37))'),
  NOW()
);
