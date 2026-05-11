-- Add AttendanceSession enum
CREATE TYPE "AttendanceSession" AS ENUM ('MORNING', 'CLOSING');

-- Add LATE to AttendanceStatus (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LATE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AttendanceStatus')) THEN
    ALTER TYPE "AttendanceStatus" ADD VALUE 'LATE';
  END IF;
END$$;

-- Add session column with default MORNING (existing records all become MORNING)
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "session" "AttendanceSession" NOT NULL DEFAULT 'MORNING';

-- Drop old unique constraint
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_studentId_date_key";

-- Add new unique constraint that allows one record per student per day per session
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_date_session_key" UNIQUE ("studentId", "date", "session");

-- Add composite index for arm-level session queries
CREATE INDEX IF NOT EXISTS "Attendance_armId_date_session_idx" ON "Attendance"("armId", "date", "session");
