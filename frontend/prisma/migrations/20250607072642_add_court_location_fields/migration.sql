-- AlterTable
ALTER TABLE "Court" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'San Francisco',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'San Francisco, CA',
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'California';
