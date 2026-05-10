-- Add missing columns to User table that exist in schema but not in database
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consentDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataExportRequestedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salary" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushSubscription" JSONB;

-- Set default on campus and role columns (were missing defaults in DB)
ALTER TABLE "User" ALTER COLUMN "campus" SET DEFAULT 'PRIMARY';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- Backfill NULLs introduced before defaults were set
UPDATE "User" SET "campus" = 'PRIMARY' WHERE "campus" IS NULL;
