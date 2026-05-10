import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError, getIP } from "@/lib/api-auth";
import { sendAdmissionOffer } from "@/lib/email";

const AUTHORIZED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "ADMIN_STAFF"];

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;
  const bytes = crypto.randomBytes(16);
  const pw: string[] = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    special[bytes[3] % special.length],
    ...Array.from({ length: 8 }, (_, i) => all[bytes[i + 4] % all.length]),
  ];
  for (let i = pw.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAuthUser();
  if (!actor) return unauthorized();
  if (!AUTHORIZED.includes(actor.role as string)) return forbidden();

  const { id } = await params;

  try {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) return notFound("Admission not found.");

    if (!["QUALIFIED", "SCHOLARSHIP_REVIEW"].includes(admission.status as string)) {
      return NextResponse.json(
        { error: "Only QUALIFIED or SCHOLARSHIP_REVIEW admissions can be offered a place." },
        { status: 422 }
      );
    }

    if (!admission.parentEmail) {
      return NextResponse.json(
        { error: "Parent email is required to issue an offer. Update the application first." },
        { status: 422 }
      );
    }

    const normEmail = admission.parentEmail.toLowerCase().trim();

    const existingParent = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existingParent) {
      return NextResponse.json(
        { error: "A portal account already exists for this parent email." },
        { status: 409 }
      );
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const passwordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Pull fee configs for this campus/session to include in the offer email
    const feeConfigs = await prisma.feeConfig.findMany({
      where: {
        campus: admission.campus,
        ...(admission.sessionId ? { sessionId: admission.sessionId } : {}),
        classId: null,
        termId: null,
      },
      select: { category: true, amount: true },
    });

    const fees = feeConfigs.map(f => ({
      label: f.category.replace(/_/g, " "),
      amount: f.amount,
    }));

    const { parentUser, studentUser } = await prisma.$transaction(async (tx) => {
      const parent = await (tx.user.create as any)({
        data: {
          name: admission.parentName,
          email: normEmail,
          password: hashedPassword,
          role: "PARENT",
          status: "ACTIVE",
          campus: admission.campus,
          mustChangePassword: true,
          passwordExpiresAt,
        },
        select: { id: true, name: true, email: true },
      }) as { id: string; name: string; email: string };

      // Student is PENDING until class/arm assigned by admin
      const student = await tx.user.create({
        data: {
          name: admission.applicantName,
          email: `s.${id.slice(-8).toLowerCase()}@students.wajina.ng`,
          password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
          role: "STUDENT",
          status: "PENDING",
          campus: admission.campus,
        },
        select: { id: true },
      });

      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationshipType: "GUARDIAN",
          isPrimary: true,
          canAuthorisePayment: true,
        },
      });

      await tx.admission.update({
        where: { id },
        data: { status: "OFFERED" },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "ADMISSION_OFFERED",
          entity: "Admission",
          entityId: id,
          detail: `Parent: ${normEmail} · Student: ${admission.applicantName}`,
          ipAddress: getIP(req),
          campus: admission.campus,
        },
      });

      return { parentUser: parent, studentUser: student };
    });

    // Non-blocking — email failure must not roll back account creation
    sendAdmissionOffer({
      parentName: parentUser.name,
      parentEmail: parentUser.email,
      studentName: admission.applicantName,
      targetClass: admission.targetClass,
      campus: admission.campus as string,
      tempPassword,
      fees,
    }).catch(err => console.error("[enroll] offer email failed:", err));

    return NextResponse.json(
      {
        message: "Admission offered. Portal accounts created and offer email queued.",
        parentId: parentUser.id,
        studentId: studentUser.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admissions/[id]/enroll POST]", err);
    return serverError();
  }
}
