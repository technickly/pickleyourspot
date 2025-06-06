/*
  Warnings:

  - You are about to drop the `PaymentStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentStatus" DROP CONSTRAINT "PaymentStatus_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentStatus" DROP CONSTRAINT "PaymentStatus_userId_fkey";

-- DropTable
DROP TABLE "PaymentStatus";

-- CreateTable
CREATE TABLE "paymentStatus" (
    "id" TEXT NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,

    CONSTRAINT "paymentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paymentStatus_userId_reservationId_key" ON "paymentStatus"("userId", "reservationId");

-- AddForeignKey
ALTER TABLE "paymentStatus" ADD CONSTRAINT "paymentStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentStatus" ADD CONSTRAINT "paymentStatus_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
