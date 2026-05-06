import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

const VALID_CATEGORIES = [
  "TUITION", "ENTRANCE_FORM", "BOOKS", "UNIFORM", "ICT", "EXCURSION",
  "MOCK_EXAM", "WAEC_NECO", "DEVELOPMENT_LEVY", "TRANSPORT", "FEEDING", "OTHER",
];

const READ_ROLES = ["DIRECTOR", "BURSAR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "ACCOUNTS_OFFICER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!READ_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const category = searchParams.get("category");

    const fees = await prisma.feeConfig.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(category && { category: category as any }),
      },
      include: {
        class: { select: { name: true, campus: true } },
        term: { select: { name: true } },
        session: { select: { name: true } },
      },
      orderBy: [{ category: "asc" }, { campus: "asc" }, { classId: "asc" }],
    });

    return NextResponse.json({ fees, categories: VALID_CATEGORIES });
  } catch (err) {
    console.error("[finance/fees GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if ((user.role as string) !== "DIRECTOR") return forbidden();

  try {
    const { category = "TUITION", amount, campus, classId, termId, sessionId } = await req.json();

    if (amount === undefined || amount === null || !sessionId) return badRequest("amount and sessionId are required.");
    if (!VALID_CATEGORIES.includes(category)) return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);

    const targetAmount = parseFloat(amount);
    if (isNaN(targetAmount) || targetAmount < 0) return badRequest("amount must be a non-negative number.");

    const existing = await prisma.feeConfig.findFirst({
      where: {
        category: category as any,
        campus: campus ?? null,
        classId: classId ?? null,
        termId: termId ?? null,
        sessionId,
      },
    });

    let fee;
    if (existing) {
      fee = await prisma.feeConfig.update({ where: { id: existing.id }, data: { amount: targetAmount } });
    } else {
      fee = await prisma.feeConfig.create({
        data: {
          category: category as any,
          amount: targetAmount,
          campus: campus ?? null,
          classId: classId ?? null,
          termId: termId ?? null,
          sessionId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "SET_FEE_CONFIG",
        entity: "FeeConfig",
        entityId: fee.id,
        detail: `Set ${category} fee to ₦${targetAmount.toLocaleString()} (Campus: ${campus ?? "ALL"}, Class: ${classId ?? "ALL"}, Session: ${sessionId})`,
      },
    });

    return NextResponse.json({ message: "Fee configuration updated successfully.", data: fee });
  } catch (err) {
    console.error("[finance/fees POST]", err);
    return serverError();
  }
}
