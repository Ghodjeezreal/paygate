/*
  Warnings:

  - Added the required column `address` to the `GoodsEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoodsEntry" ADD COLUMN     "address" TEXT NOT NULL;
