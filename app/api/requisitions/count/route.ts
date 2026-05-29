import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";
import { scopeForRole } from "@/lib/requisitionAccess";

const APPROVER_ROLES = new Set([
  "HEAD_TEACHER",
  "PRINCIPAL",
  "ACCOUNTS_OFFICER",
  "BURSAR",
  "HR",
  "DIRECTOR",
]);

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const scope = APPROVER_ROLES.has(user.role)
      ? scopeForRole(user.id, user.role, user.campus)
      : { initiatorId: user.id };

    const statuses = [
      "DRAFT",
      "SUBMITTED",
      "IN_REVIEW",
      "APPROVED",
      "REJECTED",
      "FULFILLED",
    ] as const;

    const counts = await Promise.all(
      statuses.map((status) =>
        prisma.requisition.count({ where: { ...scope, status: status as any } })
      )
    );

    const response = Object.fromEntries(
      statuses.map((status, index) => [status, counts[index]])
    );

    return NextResponse.json(response);
  } catch (err) {
    console.error("[requisitions count GET]", err);
    return serverError();
  }
}
