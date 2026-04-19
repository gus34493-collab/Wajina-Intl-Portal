-- CreateEnum
CREATE TYPE "BehaviourSeverity" AS ENUM ('COMMENDATION', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BehaviourStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateTable
CREATE TABLE "BehaviourRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "BehaviourSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "status" "BehaviourStatus" NOT NULL DEFAULT 'OPEN',
    "formTeacherNote" TEXT,
    "principalNote" TEXT,
    "studentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "termId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviourRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BehaviourRecord" ADD CONSTRAINT "BehaviourRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviourRecord" ADD CONSTRAINT "BehaviourRecord_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
