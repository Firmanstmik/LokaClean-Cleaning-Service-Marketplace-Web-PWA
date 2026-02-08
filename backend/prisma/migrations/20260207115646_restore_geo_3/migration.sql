
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CleanerProfile' AND column_name = 'location') THEN
        ALTER TABLE "CleanerProfile" ADD COLUMN "location" geography(Point, 4326);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ServiceArea' AND column_name = 'area') THEN
        ALTER TABLE "ServiceArea" ADD COLUMN "area" geography(Polygon, 4326);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pesanan' AND column_name = 'location') THEN
        ALTER TABLE "Pesanan" ADD COLUMN "location" geography(Point, 4326);
    END IF;
END $$;

-- Re-create indexes (DROP IF EXISTS first)
DROP INDEX IF EXISTS "cleaner_location_idx";
DROP INDEX IF EXISTS "service_area_idx";
CREATE INDEX "cleaner_location_idx" ON "CleanerProfile" USING GIST ("location");
CREATE INDEX "service_area_idx" ON "ServiceArea" USING GIST ("area");

-- Insert Data
DELETE FROM "ServiceArea" WHERE name = 'Lombok Island';
INSERT INTO "ServiceArea" (name, area, "updated_at")
VALUES (
  'Lombok Island',
  ST_GeographyFromText('POLYGON((115.81 -8.37, 116.85 -8.37, 116.85 -8.97, 115.81 -8.97, 115.81 -8.37))'),
  NOW()
);
