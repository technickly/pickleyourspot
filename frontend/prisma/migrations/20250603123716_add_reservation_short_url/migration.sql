/*
  Warnings:

  - A unique constraint covering the columns `[shortUrl]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - The required column `shortUrl` was added to the `Reservation` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- Add the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add the column with a default UUID value
ALTER TABLE "Reservation" ADD COLUMN "shortUrl" TEXT NOT NULL DEFAULT uuid_generate_v4();

-- Create the unique constraint
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_shortUrl_key" UNIQUE ("shortUrl");

-- Remove the default after all existing rows have been populated
ALTER TABLE "Reservation" ALTER COLUMN "shortUrl" DROP DEFAULT;
