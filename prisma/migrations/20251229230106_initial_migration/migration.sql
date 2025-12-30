-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('VALID', 'EXPIRED', 'USED');

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsEntry" (
    "id" TEXT NOT NULL,
    "residentName" TEXT NOT NULL,
    "vendorCompany" TEXT NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "natureOfGoods" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT NOT NULL,
    "qrCode" TEXT,
    "passStatus" "PassStatus" NOT NULL DEFAULT 'VALID',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleTypeId" INTEGER NOT NULL,

    CONSTRAINT "GoodsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" SERIAL NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "goodsEntryId" TEXT NOT NULL,
    "securityAgent" TEXT NOT NULL,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_name_key" ON "VehicleType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsEntry_paymentReference_key" ON "GoodsEntry"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsEntry_qrCode_key" ON "GoodsEntry"("qrCode");

-- AddForeignKey
ALTER TABLE "GoodsEntry" ADD CONSTRAINT "GoodsEntry_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_goodsEntryId_fkey" FOREIGN KEY ("goodsEntryId") REFERENCES "GoodsEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
