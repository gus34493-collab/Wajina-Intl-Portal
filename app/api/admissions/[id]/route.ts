import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError, getIP } from "@/lib/api-auth";

const MANAGEMENT = [
  "DIRECTOR", "PRINCIPAL", "ADMIN_STAFF", "HEAD_TEACHER", "ASST_HEAD_TEACHER",
  "VP_ADMIN", "VP_ACADEMICS", "BURSAR", "HR", "DEAN_STUDENTS",
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.admission.findUnique({ where: { id } });
    if (!existing) return notFound("Admission not found.");

    const role = user.role as string;
    if (role !== "DIRECTOR" && existing.campus !== (user.campus as any)) return forbidden();

    const body = await req.json();
    const { status, notes, entranceScore, classId, armId } = body;

    const result = await prisma.$transaction(async (tx) => {
      let finalStatus = status;
      const score = entranceScore !== undefined ? parseFloat(entranceScore) : null;

      if (score !== null) {
        if (score >= 90) finalStatus = "SCHOLARSHIP_REVIEW";
        else if (score >= 50) finalStatus = "OFFERED";
        else finalStatus = "REJECTED";
      }

      // Notify management on auto-offer
      if (finalStatus === "OFFERED" && existing.status !== "OFFERED") {
        const notifyRoles = ["DIRECTOR"];
        if (["JUNIOR_SECONDARY", "SENIOR_SECONDARY"].includes(existing.campus as string)) notifyRoles.push("PRINCIPAL");
        if (existing.campus === "PRIMARY") notifyRoles.push("HEAD_TEACHER");

        const receivers = await tx.user.findMany({
          where: { role: { in: notifyRoles as any }, OR: [{ role: "DIRECTOR" }, { campus: existing.campus }] },
          select: { id: true },
        });

        if (receivers.length > 0) {
          await tx.request.createMany({
            data: receivers.map((r) => ({
              title: `Auto-Offer Issued: ${existing.applicantName}`,
              description: `Applicant scored ${entranceScore}%. System has automatically issued an admission offer.`,
              level: "K3",
              status: "PENDING",
              senderId: user.id,
              receiverId: r.id,
              campus: existing.campus,
            })),
          });
        }
      }

      const updated = await tx.admission.update({
        where: { id },
        data: {
          ...(finalStatus && { status: finalStatus.toUpperCase() as any }),
          ...(notes !== undefined && { notes: notes?.trim().slice(0, 500) ?? null }),
          ...(entranceScore !== undefined && { entranceScore: parseFloat(entranceScore) }),
          ...(classId && { classId }),
          ...(armId && { armId }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id, action: "ADMISSION_UPDATED", entity: "Admission",
          entityId: id, detail: `Status: ${finalStatus ?? existing.status}`, ipAddress: getIP(req),
        },
      });

      return updated;
    });

    return NextResponse.json({ admission: result });
  } catch (err) {
    console.error("[admissions/[id] PATCH]", err);
    return serverError();
  }
}
