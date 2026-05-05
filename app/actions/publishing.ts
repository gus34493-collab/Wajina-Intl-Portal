"use server";

import prisma from "@/lib/prisma";
import { sealInstitutionalRecord } from "@/lib/signature-api";
import { withTenantContext } from "@/lib/prisma-extension";
import { generateReportCards } from "@/lib/generate-report-cards";

/**
 * PUBLISH ACADEMIC RESULTS
 * This action seals the gradebook for a specific Class-Arm and Session.
 * Only Principals (Secondary) or Head Teachers (Primary) can invoke this.
 */
export async function signAndPublishResults({
  armId,
  termId,
  sessionId,
  user,
  signatureData
}: {
  armId: string;
  termId: string;
  sessionId: string;
  user: { id: string; role: string; campus: string };
  signatureData: string;
}) {
  if (!['PRINCIPAL', 'HEAD_TEACHER', 'DIRECTOR'].includes(user.role)) {
    throw new Error("Unauthorized: Only academic leadership can sign and publish results.");
  }

  const sealResult = await withTenantContext(prisma, user, async () => {
    const grades = await prisma.grade.findMany({
      where: {
        termId,
        sessionId,
        student: { armId }
      },
      include: { student: true, subject: true }
    });

    if (grades.length === 0) {
      throw new Error("No results found to publish for this arm.");
    }

    const results = await Promise.all(grades.map(async (grade) => {
      const seal = await sealInstitutionalRecord({
        entityId: grade.id,
        entityType: 'RESULT',
        content: {
          studentName: grade.student.name,
          subject: grade.subject.name,
          total: grade.total,
          grade: grade.grade,
          termId,
        },
        signerId: user.id,
        manualSignatureData: signatureData
      });

      return prisma.grade.update({
        where: { id: grade.id },
        data: {
          status: 'ISSUED',
          signatureId: seal.id
        }
      });
    }));

    return {
      success: true,
      count: results.length,
      timestamp: new Date().toISOString()
    };
  });

  // PDF generation is best-effort — the cryptographic seal above is the
  // authoritative record. If PDF upload fails, the grades remain ISSUED and
  // a re-publish will regenerate the PDFs via the upsert.
  try {
    await generateReportCards({
      armId,
      termId,
      sessionId,
      publisherId: user.id,
      campus: user.campus,
      signatureData,
    });
  } catch (err) {
    console.error("[ReportCards] PDF generation failed — grades remain sealed:", err);
  }

  return sealResult;
}
