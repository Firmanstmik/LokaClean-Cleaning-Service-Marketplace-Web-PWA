
-- Enable PostGIS if not already (just in case)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography columns
ALTER TABLE "CleanerProfile" ADD COLUMN "location" geography(Point, 4326);
ALTER TABLE "ServiceArea" ADD COLUMN "area" geography(Polygon, 4326);
ALTER TABLE "Pesanan" ADD COLUMN "location" geography(Point, 4326);

-- Create indexes
CREATE INDEX "cleaner_location_idx" ON "CleanerProfile" USING GIST ("location");
CREATE INDEX "service_area_idx" ON "ServiceArea" USING GIST ("area");

-- Insert Lombok Service Area
-- Approx polygon for Lombok Island
INSERT INTO "ServiceArea" (name, area, "updated_at")
VALUES (
  'Lombok Island',
  ST_GeographyFromText('POLYGON((115.81 -8.37, 116.85 -8.37, 116.85 -8.97, 115.81 -8.97, 115.81 -8.37))'),
  NOW()
);
