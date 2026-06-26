/*
  Warnings:

  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "host" TEXT,
ADD COLUMN     "registrationUrl" TEXT,
ADD COLUMN     "spotsLeft" INTEGER,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "venue" TEXT;
