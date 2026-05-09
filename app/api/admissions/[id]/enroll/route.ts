import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { sendAdmissionOffer } from "@/lib/email";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAuthUser();
  if (!actor) return unauthorized();
  if (!hasRole(actor, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN")) {
    return forbidden("Not authorised to issue admission offers.");
  }

  try {
    const { id } = await params;

    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) return NextResponse.json({ error: "Admission not found." }, { status: 404 });

    if (admission.status !== "QUALIFIED" && admission.status !== "SCHOLARSHIP_REVIEW") {
      return NextResponse.json(
        { error: `Cannot enroll — current status is ${admission.status}.` },
        { status: 422 }
      );
    }

    if (!admission.parentEmail) {
      return NextResponse.json(
        { error: "Parent email is required to create portal access. Update the application first." },
        { status: 422 }
      );
    }

    const parentEmail = admission.parentEmail.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: parentEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "A portal account already exists for this parent email." },
        { status: 409 }
      );
    }

    const feeConfigs = admission.sessionId
      ? await prisma.feeConfig.findMany({
          where: { campus: admission.campus, sessionId: admission.sessionId, termId: null },
          select: { category: true, amount: true },
        })
      : [];
    const fees = feeConfigs.map(f => ({ label: f.category.replace(/_/g, " "), amount: f.amount }));

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);
    const passwordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const studentEmail = `s.${id.slice(-8).toLowerCase()}@students.wajina.ng`;

    const [parentUser, studentUser] = await prisma.$transaction(async (tx) => {
      const parent = await (tx.user.create as any)({
        data: {
          name: admission.parentName,
          email: parentEmail,
          password: hashed,
          role: "PARENT",
          status: "ACTIVE",
          campus: admission.campus,
          phone: admission.parentPhone || undefined,
          mustChangePassword: true,
          passwordExpiresAt,
        },
        select: { id: true, name: true, email: true },
      }) as { id: string; name: string; email: string };

      const studentPassword = await bcrypt.hash(generateTempPassword(), 12);
      const student = await tx.user.create({
        data: {
          name: admission.applicantName,
          email: studentEmail,
          password: studentPassword,
          role: "STUDENT",
          status: "ACTIVE",
          campus: admission.campus,
        },
        select: { id: true, name: true, email: true },
      }) as { id: string; name: string; email: string };

      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationshipType: "GUARDIAN",
          isPrimary: true,
          canAuthorisePayment: true,
          canPickup: true,
        },
      });

      await tx.admission.update({ where: { id }, data: { status: "OFFERED" } });

      return [parent, student];
    });

    sendAdmissionOffer({
      parentName: admission.parentName,
      parentEmail: parentUser.email,
      studentName: admission.applicantName,
      targetClass: admission.targetClass,
      campus: admission.campus,
      tempPassword,
      fees,
    }).catch(err => console.error("[admissions/enroll] email failed:", err));

    audit(
      actor.id,
      "ADMISSION_OFFERED",
      "Admission",
      id,
      `Parent: ${parentUser.email} | Student: ${studentUser.email}`,
      getIP(req)
    );

    return NextResponse.json(
      { parentId: parentUser.id, studentId: studentUser.id, message: "Offer sent and portal accounts created." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admissions/enroll POST]", err);
    return serverError();
  }
}
