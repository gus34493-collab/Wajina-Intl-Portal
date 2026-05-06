import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL")) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const actorId = searchParams.get("actorId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.auditLog.findMany>[0]["where"] = {
      ...(actorId && { actorId }),
      ...(action && { action: { contains: action, mode: "insensitive" } }),
      ...(entity && { entity: { contains: entity, mode: "insensitive" } }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
      // Principals cannot see Director-level audit entries
      ...(user.role === "PRINCIPAL" && {
        NOT: { actor: { role: "DIRECTOR" } },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { actor: { select: { id: true, name: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (err) {
    console.error("[audit GET]", err);
    return serverError();
  }
}
