/*
  Warnings:

  - A unique constraint covering the columns `[shareSlug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_shareSlug_key" ON "Event"("shareSlug");
