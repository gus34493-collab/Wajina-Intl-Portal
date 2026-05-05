"use server";

import prisma from "@/lib/prisma";
import { uploadToSpaces } from "@/lib/spaces";
import { generatePdfBuffer, ReportCardData } from "@/lib/report-card-pdf";

export async function generateReportCards({
  armId,
  termId,
  sessionId,
  publisherId,
  campus,
  signatureData,
}: {
  armId: string;
  termId: string;
  sessionId: string;
  publisherId: string;
  campus: string;
  signatureData?: string;
}): Promise<{ count: number }> {
  const grades = await prisma.grade.findMany({
    where: {
      termId,
      sessionId,
      status: "ISSUED",
      student: { armId },
    },
    include: {
      student: {
        include: { enrolledArm: { include: { class: true } } },
      },
      subject: true,
      term: { include: { session: true } },
    },
    orderBy: [{ student: { name: "asc" } }, { subject: { name: "asc" } }],
  });

  if (grades.length === 0) return { count: 0 };

  const publisher = await prisma.user.findUnique({
    where: { id: publisherId },
    select: { name: true, role: true },
  });

  const sessionName = grades[0].term.session?.name ?? sessionId;
  const termName = grades[0].term.name as string;

  // Group grades by student
  const byStudent = new Map<string, typeof grades>();
  for (const g of grades) {
    const list = byStudent.get(g.studentId) ?? [];
    list.push(g);
    byStudent.set(g.studentId, list);
  }

  const publishedAt = new Date().toISOString();

  // Process in batches to prevent memory spikes when an arm is large
  async function runBatched<T>(items: T[], fn: (item: T) => Promise<unknown>, batchSize = 10) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = await Promise.all(items.slice(i, i + batchSize).map(fn));
      results.push(...batch);
    }
    return results;
  }

  const entries = Array.from(byStudent.entries());
  await runBatched(entries, async ([studentId, sg]) => {
    const first = sg[0];
    const { student } = first;

    const data: ReportCardData = {
      studentName: student.name,
      className: student.enrolledArm?.class?.name ?? "—",
      armLabel: student.enrolledArm?.label ?? "—",
      termName,
      sessionName,
      campus,
      publishedByName: publisher?.name ?? "—",
      publishedByRole: publisher?.role ?? "—",
      publishedAt,
      signatureData: signatureData ?? null,
      formMasterRemark: sg.find((g) => g.formMasterRemark)?.formMasterRemark ?? null,
      principalRemark: sg.find((g) => g.principalRemark)?.principalRemark ?? null,
      grades: sg.map((g) => ({
        subject: g.subject.name,
        firstCA: g.firstCA,
        secondCA: g.secondCA,
        thirdCA: g.thirdCA,
        fourthCA: g.fourthCA,
        fifthCA: g.fifthCA,
        exam: g.exam,
        total: g.total,
        grade: g.grade,
        position: g.position,
        teacherComment: g.teacherComment,
      })),
    };

    const pdfBuffer = await generatePdfBuffer(data);
    const key = `report-cards/${sessionId}/${termId}/${studentId}.pdf`;
    await uploadToSpaces(key, pdfBuffer, "application/pdf");

    return prisma.reportCard.upsert({
      where: { studentId_termId_sessionId: { studentId, termId, sessionId } },
      create: {
        studentId,
        termId,
        sessionId,
        campus: first.campus,
        spacesKey: key,
        snapshotJson: data,
        publishedById: publisherId,
      },
      update: {
        spacesKey: key,
        snapshotJson: data,
        publishedById: publisherId,
        publishedAt: new Date(),
        status: "SEALED",
      },
    });
  });

  return { count: entries.length };
}
