/*
  Warnings:

  - The values [DOCTOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `doctorId` on the `Payout` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mechanicId` to the `Payout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('GENERAL', 'PAID', 'MAJOR');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- AlterEnum
ALTER TYPE "BookingRequestStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE 'FAILED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'MONTHLY_ALLOCATION';
ALTER TYPE "TransactionType" ADD VALUE 'SERVICE_BOOKING';
ALTER TYPE "TransactionType" ADD VALUE 'SERVICE_EARNING';
ALTER TYPE "TransactionType" ADD VALUE 'MANUAL_REFUND';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'MECHANIC', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_doctorId_fkey";

-- DropIndex
DROP INDEX "Payout_doctorId_status_idx";

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "doctorId",
ADD COLUMN     "mechanicId" TEXT NOT NULL,
ALTER COLUMN "paypalEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "category" "ServiceCategory" NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRecord" ADD COLUMN     "partsUsed" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "mileage" INTEGER;

-- CreateTable
CREATE TABLE "MechanicAttendance" (
    "id" TEXT NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechanicAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MechanicAttendance_date_status_idx" ON "MechanicAttendance"("date", "status");

-- CreateIndex
CREATE INDEX "MechanicAttendance_mechanicId_date_idx" ON "MechanicAttendance"("mechanicId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MechanicAttendance_mechanicId_date_key" ON "MechanicAttendance"("mechanicId", "date");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_mechanicId_idx" ON "Booking"("mechanicId");

-- CreateIndex
CREATE INDEX "BookingRequest_phone_idx" ON "BookingRequest"("phone");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payout_mechanicId_status_idx" ON "Payout"("mechanicId", "status");

-- CreateIndex
CREATE INDEX "Service_category_isActive_idx" ON "Service"("category", "isActive");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "User"("verificationStatus");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_registrationNo_idx" ON "Vehicle"("registrationNo");

-- AddForeignKey
ALTER TABLE "MechanicAttendance" ADD CONSTRAINT "MechanicAttendance_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
