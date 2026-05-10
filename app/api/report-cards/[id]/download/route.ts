import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createPresignedDownloadUrl } from "@/lib/storage";
import { getAuthUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: id },
      include: { student: { select: { name: true } } },
    });
    if (!reportCard) return notFound("Report card not found.");

    if (reportCard.status === "REVOKED") {
      return NextResponse.json({ error: "This report card has been revoked." }, { status: 410 });
    }

    const role = user.role as string;
    const isOwner = role === "STUDENT" && reportCard.studentId === user.id;
    const isStaff = !["STUDENT", "PARENT"].includes(role);

    let isParentOfStudent = false;
    if (role === "PARENT") {
      const link = await prisma.studentParent.findFirst({ where: { studentId: reportCard.studentId, parentId: user.id } });
      isParentOfStudent = !!link;
    }

    if (!isOwner && !isStaff && !isParentOfStudent) return forbidden();

    const filename = `${reportCard.student.name.replace(/\s+/g, "-")}-report-card.pdf`;
    const url = await createPresignedDownloadUrl(reportCard.spacesKey, filename);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[report-cards/[id]/download GET]", err);
    return serverError();
  }
}
