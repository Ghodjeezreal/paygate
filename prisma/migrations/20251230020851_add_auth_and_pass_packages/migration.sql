-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SECURITY');

-- AlterTable
ALTER TABLE "GoodsEntry" ADD COLUMN     "passPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entries" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "vehicleTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassPurchase" (
    "id" TEXT NOT NULL,
    "residentName" TEXT NOT NULL,
    "residentEmail" TEXT,
    "residentPhone" TEXT,
    "passPackageId" TEXT NOT NULL,
    "remainingEntries" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PassPurchase_paymentReference_key" ON "PassPurchase"("paymentReference");

-- AddForeignKey
ALTER TABLE "PassPackage" ADD CONSTRAINT "PassPackage_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassPurchase" ADD CONSTRAINT "PassPurchase_passPackageId_fkey" FOREIGN KEY ("passPackageId") REFERENCES "PassPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsEntry" ADD CONSTRAINT "GoodsEntry_passPurchaseId_fkey" FOREIGN KEY ("passPurchaseId") REFERENCES "PassPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
