-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SKU" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
