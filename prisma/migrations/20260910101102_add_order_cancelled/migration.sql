-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(6),
ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false;
