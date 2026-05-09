import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const OPS_LEADERS = [
  "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN",
  "VP_ACADEMICS", "ASST_HEAD_TEACHER", "DEAN",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...OPS_LEADERS)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.operationalRisk.findUnique({ where: { id } });
    if (!existing) return notFound("Risk not found");

    if (user.role !== "DIRECTOR" && existing.campus !== user.campus) {
      return forbidden("This risk belongs to another campus.");
    }

    const { status, severity, description } = await req.json();

    const updated = await prisma.operationalRisk.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(severity && { severity }),
        ...(description && { description }),
      },
    });

    audit(
      user.id,
      "RISK_UPDATED",
      "OperationalRisk",
      id,
      `Updated risk status to ${status || existing.status}`,
      getIP(req)
    );
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[risks/:id PATCH]", err);
    return serverError();
  }
}
