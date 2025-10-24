-- AlterTable
ALTER TABLE "public"."ShopItem" ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."ShopItem" ADD CONSTRAINT "ShopItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
