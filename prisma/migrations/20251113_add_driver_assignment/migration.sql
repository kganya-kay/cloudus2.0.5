-- Add driver relationship to orders
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverId" TEXT;

CREATE INDEX IF NOT EXISTS "Order_driverId_idx" ON "Order"("driverId");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
