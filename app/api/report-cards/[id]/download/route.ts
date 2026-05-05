import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createPresignedDownloadUrl } from "@/lib/spaces";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_access")?.value;
    if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const role = payload.role as string;

    const reportCard = await prisma.reportCard.findUnique({
      where: { id: params.id },
      include: { student: { select: { name: true } } },
    });

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 });
    }

    if (reportCard.status === "REVOKED") {
      return NextResponse.json({ error: "This report card has been revoked" }, { status: 410 });
    }

    // Access control
    const isOwner = role === "STUDENT" && reportCard.studentId === userId;
    const isStaff = !["STUDENT", "PARENT"].includes(role);

    let isParentOfStudent = false;
    if (role === "PARENT") {
      const link = await prisma.studentParent.findUnique({
        where: {
          studentId_parentId: {
            studentId: reportCard.studentId,
            parentId: userId,
          },
        },
      });
      isParentOfStudent = !!link;
    }

    if (!isOwner && !isStaff && !isParentOfStudent) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const filename = `${reportCard.student.name.replace(/\s+/g, "-")}-report-card.pdf`;
    const url = await createPresignedDownloadUrl(reportCard.spacesKey, filename);

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[ReportCard Download]", err);
    return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
  }
}
