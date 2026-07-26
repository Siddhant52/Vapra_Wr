-- Remove the unused credits/payout system.
-- These were never wired into the live booking flow; see conversation history
-- for the audit that confirmed this before removal.

-- Drop foreign keys / tables that depend on User first
DROP TABLE IF EXISTS "CreditTransaction";
DROP TABLE IF EXISTS "Payout";

-- Remove the credits column from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "credits";

-- Drop now-unused enums
DROP TYPE IF EXISTS "TransactionType";
DROP TYPE IF EXISTS "PayoutStatus";
