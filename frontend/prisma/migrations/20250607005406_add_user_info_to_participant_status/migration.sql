/*
  Warnings:

  - You are about to drop the `_ReservationParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paymentStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ReservationParticipants" DROP CONSTRAINT "_ReservationParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_ReservationParticipants" DROP CONSTRAINT "_ReservationParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "paymentStatus" DROP CONSTRAINT "paymentStatus_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "paymentStatus" DROP CONSTRAINT "paymentStatus_userId_fkey";

-- DropTable
DROP TABLE "_ReservationParticipants";

-- DropTable
DROP TABLE "paymentStatus";

-- CreateTable
CREATE TABLE "ParticipantStatus" (
    "id" TEXT NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "isGoing" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "userImage" TEXT,

    CONSTRAINT "ParticipantStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantStatus_userId_reservationId_key" ON "ParticipantStatus"("userId", "reservationId");

-- AddForeignKey
ALTER TABLE "ParticipantStatus" ADD CONSTRAINT "ParticipantStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantStatus" ADD CONSTRAINT "ParticipantStatus_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
