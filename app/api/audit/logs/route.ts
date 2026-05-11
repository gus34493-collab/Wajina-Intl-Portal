import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { logs } = await req.json();

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const creations = logs.map((log: any) => ({
      actorId: user.id,
      action: `TELEMETRY_${log.level}`,
      entity: log.component,
      detail: `${log.message}${log.stack ? ` | Stack: ${log.stack}` : ""}`,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      createdAt: new Date(log.timestamp),
    }));

    await prisma.auditLog.createMany({ data: creations });

    return NextResponse.json({ success: true, count: creations.length });
  } catch (err: any) {
    console.error("[Telemetry API Error]", err);
    return serverError();
  }
}
