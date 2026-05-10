-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FORM_APPROVED', 'PRINCIPAL_APPROVED', 'RETURNED', 'ISSUED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'APPROVED', 'ISSUED');

-- CreateEnum
CREATE TYPE "ReportCardStatus" AS ENUM ('SEALED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('NEW', 'TRANSFER');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING_FEE', 'APPLIED', 'EXAM_DETAILS_SENT', 'QUALIFIED', 'OFFERED', 'FEE_CONFIRMED', 'ENROLLED', 'REJECTED', 'SCHOLARSHIP_REVIEW');

-- CreateEnum
CREATE TYPE "ComplaintTargetRole" AS ENUM ('ADMIN', 'DIRECTOR', 'VP_ADMIN', 'PRINCIPAL', 'HEAD_TEACHER', 'TEACHER', 'ACADEMIC_STAFF', 'FORM_TEACHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('TUITION', 'EXAM_FEE', 'PTA_LEVY', 'UNIFORM', 'TRANSPORT', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('DIRECTOR', 'PRINCIPAL', 'VP_ADMIN', 'VP_ACADEMICS', 'HOD', 'HEAD_TEACHER', 'ASST_HEAD_TEACHER', 'HR', 'DEAN', 'BURSAR', 'ACCOUNTS_OFFICER', 'FORM_TEACHER', 'TEACHER', 'PARENT', 'STUDENT');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_termId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_parentId_fkey";

-- AlterTable
ALTER TABLE "AcademicSession" ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "termWeights" JSONB,
ADD COLUMN     "totalWeeks" INTEGER NOT NULL DEFAULT 36,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "armId" TEXT,
ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "markedById" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "termId" TEXT,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BehaviourRecord" ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY';

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "promotionCutoff" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "showPosition" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ClassArm" ADD COLUMN     "timetableUrl" TEXT;

-- AlterTable
ALTER TABLE "GlobalConfig" ADD COLUMN     "admissionExamLogistics" TEXT;

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "average",
DROP COLUMN "isAdminApproved",
DROP COLUMN "isSubmittedToForm",
ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fifthCA" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fourthCA" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "position" INTEGER,
ADD COLUMN     "principalRemark" TEXT,
ADD COLUMN     "returnReason" TEXT,
ADD COLUMN     "signatureId" TEXT,
ADD COLUMN     "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "teacherComment" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "termId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "category" "FeeCategory" NOT NULL DEFAULT 'TUITION',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "category" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "studentId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
ADD COLUMN     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "parentId",
ALTER COLUMN "passwordExpiresAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationshipType" "GuardianType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canAuthorisePayment" BOOLEAN NOT NULL DEFAULT false,
    "canPickup" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByIp" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL,
    "hodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAppraisal" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "termId" TEXT,
    "sessionId" TEXT,
    "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
    "punctuality" INTEGER NOT NULL DEFAULT 0,
    "lessonPlanning" INTEGER NOT NULL DEFAULT 0,
    "studentEngagement" INTEGER NOT NULL DEFAULT 0,
    "professionalism" INTEGER NOT NULL DEFAULT 0,
    "comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeConfig" (
    "id" TEXT NOT NULL,
    "category" "FeeCategory" NOT NULL DEFAULT 'TUITION',
    "amount" DOUBLE PRECISION NOT NULL,
    "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
    "classId" TEXT,
    "termId" TEXT,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL,
    "category" "FeeCategory" NOT NULL,
    "feeConfigId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "targetRole" "ComplaintTargetRole" NOT NULL,
    "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
    "resolvedBy" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalRisk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'LOW',
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "campus" "SchoolCampus" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL,
    "targetClass" TEXT NOT NULL,
    "type" "AdmissionType" NOT NULL DEFAULT 'NEW',
    "status" "AdmissionStatus" NOT NULL DEFAULT 'APPLIED',
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "notes" TEXT,
    "sessionId" TEXT,
    "armId" TEXT,
    "classId" TEXT,
    "entranceScore" DOUBLE PRECISION,
    "isScholarshipEligible" BOOLEAN NOT NULL DEFAULT false,
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionConfig" (
    "id" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL,
    "entranceFee" DOUBLE PRECISION NOT NULL DEFAULT 25000,
    "deadline" TIMESTAMP(3),
    "cutoffScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "scholarshipScore" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "campus" "SchoolCampus" NOT NULL,
    "signatureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "campus" "SchoolCampus" NOT NULL,
    "signatureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalSignature" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "signatureData" TEXT,
    "campus" "SchoolCampus" NOT NULL DEFAULT 'PRIMARY',
    "signerId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "campus" "SchoolCampus" NOT NULL,
    "spacesKey" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReportCardStatus" NOT NULL DEFAULT 'SEALED',

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentParent_studentId_idx" ON "StudentParent"("studentId");

-- CreateIndex
CREATE INDEX "StudentParent_parentId_idx" ON "StudentParent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_usedAt_idx" ON "PasswordResetToken"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hodId_key" ON "Department"("hodId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_campus_key" ON "Department"("name", "campus");

-- CreateIndex
CREATE INDEX "TeacherAppraisal_teacherId_idx" ON "TeacherAppraisal"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAppraisal_evaluatorId_idx" ON "TeacherAppraisal"("evaluatorId");

-- CreateIndex
CREATE INDEX "TeacherAppraisal_status_idx" ON "TeacherAppraisal"("status");

-- CreateIndex
CREATE INDEX "TeacherAppraisal_campus_idx" ON "TeacherAppraisal"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "FeeConfig_category_campus_classId_termId_sessionId_key" ON "FeeConfig"("category", "campus", "classId", "termId", "sessionId");

-- CreateIndex
CREATE INDEX "Invoice_studentId_termId_idx" ON "Invoice"("studentId", "termId");

-- CreateIndex
CREATE INDEX "Invoice_studentId_status_idx" ON "Invoice"("studentId", "status");

-- CreateIndex
CREATE INDEX "Invoice_campus_status_idx" ON "Invoice"("campus", "status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_status_idx" ON "Invoice"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Invoice_sessionId_idx" ON "Invoice"("sessionId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_invoiceId_paymentId_key" ON "PaymentAllocation"("invoiceId", "paymentId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_targetRole_idx" ON "Complaint"("targetRole");

-- CreateIndex
CREATE INDEX "Complaint_parentId_idx" ON "Complaint"("parentId");

-- CreateIndex
CREATE INDEX "Complaint_studentId_idx" ON "Complaint"("studentId");

-- CreateIndex
CREATE INDEX "Complaint_campus_idx" ON "Complaint"("campus");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_campus_idx" ON "Task"("campus");

-- CreateIndex
CREATE INDEX "OperationalRisk_campus_idx" ON "OperationalRisk"("campus");

-- CreateIndex
CREATE INDEX "OperationalRisk_severity_idx" ON "OperationalRisk"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_paymentRef_key" ON "Admission"("paymentRef");

-- CreateIndex
CREATE INDEX "Admission_status_idx" ON "Admission"("status");

-- CreateIndex
CREATE INDEX "Admission_campus_idx" ON "Admission"("campus");

-- CreateIndex
CREATE INDEX "Admission_sessionId_idx" ON "Admission"("sessionId");

-- CreateIndex
CREATE INDEX "Admission_type_idx" ON "Admission"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionConfig_campus_key" ON "AdmissionConfig"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "Attestation_signatureId_key" ON "Attestation"("signatureId");

-- CreateIndex
CREATE INDEX "Attestation_studentId_idx" ON "Attestation"("studentId");

-- CreateIndex
CREATE INDEX "Attestation_campus_idx" ON "Attestation"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_signatureId_key" ON "Testimonial"("signatureId");

-- CreateIndex
CREATE INDEX "Testimonial_studentId_idx" ON "Testimonial"("studentId");

-- CreateIndex
CREATE INDEX "Testimonial_campus_idx" ON "Testimonial"("campus");

-- CreateIndex
CREATE INDEX "DigitalSignature_signerId_idx" ON "DigitalSignature"("signerId");

-- CreateIndex
CREATE INDEX "DigitalSignature_entityId_idx" ON "DigitalSignature"("entityId");

-- CreateIndex
CREATE INDEX "DigitalSignature_campus_idx" ON "DigitalSignature"("campus");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_idx" ON "ReportCard"("studentId");

-- CreateIndex
CREATE INDEX "ReportCard_termId_sessionId_idx" ON "ReportCard"("termId", "sessionId");

-- CreateIndex
CREATE INDEX "ReportCard_campus_idx" ON "ReportCard"("campus");

-- CreateIndex
CREATE INDEX "ReportCard_publishedById_idx" ON "ReportCard"("publishedById");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_termId_sessionId_key" ON "ReportCard"("studentId", "termId", "sessionId");

-- CreateIndex
CREATE INDEX "AcademicSession_status_idx" ON "AcademicSession"("status");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_termId_idx" ON "Attendance"("termId");

-- CreateIndex
CREATE INDEX "Attendance_armId_idx" ON "Attendance"("armId");

-- CreateIndex
CREATE INDEX "Attendance_markedById_idx" ON "Attendance"("markedById");

-- CreateIndex
CREATE INDEX "Attendance_armId_date_idx" ON "Attendance"("armId", "date");

-- CreateIndex
CREATE INDEX "Attendance_termId_studentId_idx" ON "Attendance"("termId", "studentId");

-- CreateIndex
CREATE INDEX "Attendance_campus_idx" ON "Attendance"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "idx_audit_campus_created" ON "AuditLog"("campus", "createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "BehaviourRecord_studentId_idx" ON "BehaviourRecord"("studentId");

-- CreateIndex
CREATE INDEX "BehaviourRecord_reporterId_idx" ON "BehaviourRecord"("reporterId");

-- CreateIndex
CREATE INDEX "BehaviourRecord_status_idx" ON "BehaviourRecord"("status");

-- CreateIndex
CREATE INDEX "BehaviourRecord_termId_idx" ON "BehaviourRecord"("termId");

-- CreateIndex
CREATE INDEX "BehaviourRecord_sessionId_idx" ON "BehaviourRecord"("sessionId");

-- CreateIndex
CREATE INDEX "BehaviourRecord_campus_idx" ON "BehaviourRecord"("campus");

-- CreateIndex
CREATE INDEX "ClassArm_teacherId_idx" ON "ClassArm"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_signatureId_key" ON "Grade"("signatureId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_subjectId_idx" ON "Grade"("subjectId");

-- CreateIndex
CREATE INDEX "Grade_studentId_termId_idx" ON "Grade"("studentId", "termId");

-- CreateIndex
CREATE INDEX "Grade_studentId_sessionId_idx" ON "Grade"("studentId", "sessionId");

-- CreateIndex
CREATE INDEX "Grade_termId_status_idx" ON "Grade"("termId", "status");

-- CreateIndex
CREATE INDEX "Grade_sessionId_status_idx" ON "Grade"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Grade_status_idx" ON "Grade"("status");

-- CreateIndex
CREATE INDEX "Grade_campus_idx" ON "Grade"("campus");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_termId_key" ON "Grade"("studentId", "subjectId", "termId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_termId_status_idx" ON "Payment"("termId", "status");

-- CreateIndex
CREATE INDEX "Payment_sessionId_status_idx" ON "Payment"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_campus_idx" ON "Payment"("campus");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Request_senderId_idx" ON "Request"("senderId");

-- CreateIndex
CREATE INDEX "Request_receiverId_idx" ON "Request"("receiverId");

-- CreateIndex
CREATE INDEX "Request_studentId_idx" ON "Request"("studentId");

-- CreateIndex
CREATE INDEX "Request_category_idx" ON "Request"("category");

-- CreateIndex
CREATE INDEX "Request_campus_idx" ON "Request"("campus");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Subject_classId_idx" ON "Subject"("classId");

-- CreateIndex
CREATE INDEX "Subject_teacherId_idx" ON "Subject"("teacherId");

-- CreateIndex
CREATE INDEX "Subject_departmentId_idx" ON "Subject"("departmentId");

-- CreateIndex
CREATE INDEX "Subject_campus_idx" ON "Subject"("campus");

-- CreateIndex
CREATE INDEX "Term_status_idx" ON "Term"("status");

-- CreateIndex
CREATE INDEX "Term_isCurrent_idx" ON "Term"("isCurrent");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_campus_idx" ON "User"("campus");

-- CreateIndex
CREATE INDEX "User_classId_idx" ON "User"("classId");

-- CreateIndex
CREATE INDEX "User_armId_idx" ON "User"("armId");

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "DigitalSignature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_armId_fkey" FOREIGN KEY ("armId") REFERENCES "ClassArm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAppraisal" ADD CONSTRAINT "TeacherAppraisal_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAppraisal" ADD CONSTRAINT "TeacherAppraisal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConfig" ADD CONSTRAINT "FeeConfig_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConfig" ADD CONSTRAINT "FeeConfig_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConfig" ADD CONSTRAINT "FeeConfig_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_feeConfigId_fkey" FOREIGN KEY ("feeConfigId") REFERENCES "FeeConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalRisk" ADD CONSTRAINT "OperationalRisk_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "DigitalSignature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "DigitalSignature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalSignature" ADD CONSTRAINT "DigitalSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

