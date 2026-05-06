import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";

const FINANCE_ROLES = ["DIRECTOR", "PRINCIPAL", "ACCOUNTS_OFFICER", "BURSAR"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId");
    const campus = searchParams.get("campus");
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
    const skip = (page - 1) * limit;

    const role = user.role as string;
    let resolvedTermId = termId;
    if (!resolvedTermId) {
      const current = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
      resolvedTermId = current?.id ?? null;
    }

    const effectiveCampus = role !== "DIRECTOR" && user.campus ? (user.campus as string) : campus;
    const studentFilter: any = { role: "STUDENT", status: "ACTIVE" };
    if (effectiveCampus) studentFilter.campus = effectiveCampus as any;

    const where: any = {
      student: studentFilter,
      ...(resolvedTermId && { termId: resolvedTermId }),
      ...(category && { category: category as any }),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true, reference: true, amount: true, status: true, category: true, termId: true, createdAt: true,
          student: {
            select: {
              id: true, name: true, campus: true,
              enrolledClass: { select: { name: true } },
              enrolledArm: { select: { fullName: true, class: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, page, limit });
  } catch (err) {
    console.error("[payments GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { studentId, studentName, amount, reference, channel, notes, termId, category = "TUITION" } = await req.json();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return badRequest("Amount must be greater than zero.");
    if (!reference?.trim()) return badRequest("Reference number is required.");

    // Resolve student
    let resolvedStudentId = studentId;
    if (!resolvedStudentId && studentName) {
      const found = await prisma.user.findFirst({
        where: { role: "STUDENT", name: { equals: studentName.trim(), mode: "insensitive" } },
        select: { id: true },
      });
      resolvedStudentId = found?.id;
    }
    if (!resolvedStudentId) return badRequest("Could not identify student. Provide a valid studentId or exact student name.");

    // Resolve term
    let resolvedTermId = termId ?? null;
    if (!resolvedTermId) {
      const current = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
      resolvedTermId = current?.id ?? null;
    }

    const [existing, student, term] = await Promise.all([
      prisma.payment.findUnique({ where: { reference: reference.trim() } }),
      prisma.user.findUnique({ where: { id: resolvedStudentId }, select: { id: true, campus: true, classId: true } }),
      resolvedTermId ? prisma.term.findUnique({ where: { id: resolvedTermId }, select: { sessionId: true } }) : null,
    ]);

    if (existing) return NextResponse.json({ error: "A payment with this reference number already exists." }, { status: 409 });
    if (!student) return notFound("Student not found.");
    if (!term) return badRequest("Valid term context required for payment validation.");

    // Overpayment protection
    const feeConfigs = await prisma.feeConfig.findMany({ where: { sessionId: term.sessionId } });
    const categories = [...new Set(feeConfigs.map((f) => f.category))];
    let sessionExpectedTotal = 0;

    for (const cat of categories) {
      const catConfigs = feeConfigs.filter((f) => f.category === cat);
      const sessionFee =
        catConfigs.find((f) => f.classId === student.classId && !f.termId) ||
        catConfigs.find((f) => !f.classId && f.campus === (student.campus as any) && !f.termId) ||
        catConfigs.find((f) => !f.classId && !f.campus && !f.termId);

      if (sessionFee) {
        sessionExpectedTotal += Number(sessionFee.amount);
      } else {
        const termFees = catConfigs.filter((f) =>
          (f.classId === student.classId || (!f.classId && (f.campus === (student.campus as any) || !f.campus))) &&
          f.termId !== null
        );
        const uniqueTermIds = [...new Set(termFees.map((f) => f.termId))];
        for (const tid of uniqueTermIds) {
          const best =
            termFees.find((f) => f.classId === student.classId && f.termId === tid) ||
            termFees.find((f) => !f.classId && f.campus === (student.campus as any) && f.termId === tid) ||
            termFees.find((f) => !f.classId && !f.campus && f.termId === tid);
          if (best) sessionExpectedTotal += Number(best.amount);
        }
      }
    }

    if (sessionExpectedTotal > 0) {
      const existingPayments = await prisma.payment.findMany({
        where: { studentId: resolvedStudentId, sessionId: term.sessionId, status: "CONFIRMED" },
        select: { amount: true },
      });
      const alreadyPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (alreadyPaid + parsedAmount > sessionExpectedTotal) {
        return NextResponse.json({
          error: `Payment would exceed the session total (₦${sessionExpectedTotal.toLocaleString()}).`,
          details: { expected: sessionExpectedTotal, alreadyPaid, requested: parsedAmount },
        }, { status: 400 });
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          reference: reference.trim(),
          amount: parsedAmount,
          category: category as any,
          status: "CONFIRMED",
          campus: student.campus as any,
          studentId: resolvedStudentId,
          ...(resolvedTermId && { termId: resolvedTermId }),
          ...(term.sessionId && { sessionId: term.sessionId }),
        },
        select: {
          id: true, reference: true, amount: true, category: true, status: true,
          student: { select: { id: true, name: true, campus: true } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CREATE_PAYMENT",
          entity: "Payment",
          entityId: p.id,
          detail: `${channel ?? "manual"}: ₦${parsedAmount} for student ${resolvedStudentId}${notes ? " — " + notes : ""}`,
          ipAddress: getIP(req),
        },
      });
      return p;
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    console.error("[payments POST]", err);
    return serverError();
  }
}
