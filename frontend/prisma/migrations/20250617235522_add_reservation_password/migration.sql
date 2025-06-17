-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "password" TEXT,
ADD COLUMN     "passwordRequired" BOOLEAN NOT NULL DEFAULT false;
