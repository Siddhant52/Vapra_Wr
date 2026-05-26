/*
  Warnings:

  - You are about to drop the column `paypalEmail` on the `Payout` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "BookingRequestStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "customerName" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "paypalEmail",
ADD COLUMN     "upiId" TEXT;

-- AlterTable
ALTER TABLE "ServiceRecord" ADD COLUMN     "title" TEXT;
