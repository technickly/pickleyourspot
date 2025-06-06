-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "paymentInfo" TEXT,
ADD COLUMN     "paymentRequired" BOOLEAN NOT NULL DEFAULT false;
