"use client";

import { useTransition } from "react";
import prisma from "@/lib/prisma";
import { sealInstitutionalRecord } from "@/lib/signature-api";
import { withTenantContext } from "@/lib/prisma-extension";

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
  // 1. Authorization & Role-Check
  if (!['PRINCIPAL', 'HEAD_TEACHER', 'DIRECTOR'].includes(user.role)) {
    throw new Error("Unauthorized: Only academic leadership can sign and publish results.");
  }

  // 2. Execute with Tenant Context (RLS Injection)
  return await withTenantContext(prisma, user, async () => {
    // A. Fetch all grades for this Arm/Term
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

    // B. Reconcile and Seal
    // We create a hash of the entire batch summary OR sign individual records.
    // For Wajina, we seal each individual grade record to allow granular verification.
    
    const results = await Promise.all(grades.map(async (grade) => {
      // Generate the Cryptographic Seal
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

      // Update Grade Status and link Seal
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
}
