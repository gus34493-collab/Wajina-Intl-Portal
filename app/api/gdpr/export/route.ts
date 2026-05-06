import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const userId = user.id;

    const [userData, grades, attendance, behaviour, payments, requests, auditLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, role: true, status: true,
          phone: true, profilePhoto: true, campus: true,
          isFormMaster: true, createdAt: true, updatedAt: true,
          consentGiven: true, consentDate: true,
        },
      }),
      prisma.grade.findMany({
        where: { studentId: userId },
        include: { subject: { select: { name: true } }, term: { select: { name: true } } },
      }),
      prisma.attendance.findMany({
        where: { studentId: userId },
        include: { term: { select: { name: true } }, markedBy: { select: { name: true } } },
      }),
      prisma.behaviourRecord.findMany({
        where: { studentId: userId },
        include: { reporter: { select: { name: true, role: true } } },
      }),
      prisma.payment.findMany({ where: { studentId: userId } }),
      prisma.request.findMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.auditLog.findMany({ where: { actorId: userId }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);

    audit(userId, "DATA_EXPORT", "User", userId, "GDPR data export requested", getIP(req));

    return NextResponse.json({
      message: "Data export completed successfully.",
      data: {
        exportDate: new Date().toISOString(),
        exportedFor: userData,
        academicRecords: { grades, attendance, behaviour },
        financialRecords: payments,
        communications: requests,
        activityLog: auditLogs,
      },
    });
  } catch (err) {
    console.error("[gdpr/export GET]", err);
    return serverError();
  }
}
