-- Add driver location tracking fields
ALTER TABLE "Driver"
  ADD COLUMN "lastLocationLat" DOUBLE PRECISION,
  ADD COLUMN "lastLocationLng" DOUBLE PRECISION,
  ADD COLUMN "lastLocationAccuracy" DOUBLE PRECISION,
  ADD COLUMN "lastLocationAt" TIMESTAMP(3);
