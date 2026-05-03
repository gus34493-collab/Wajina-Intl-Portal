import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Process logs (we can save them to AuditLog table or a dedicated Telemetry table)
    // For now, we'll use AuditLog as it exists in the schema
    const creations = logs.map((log: any) => ({
      action: `TELEMETRY_${log.level}`,
      entity: log.component,
      detail: `${log.message}${log.stack ? ` | Stack: ${log.stack}` : ""}`,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      createdAt: new Date(log.timestamp),
    }));

    await prisma.auditLog.createMany({
      data: creations,
    });

    return NextResponse.json({ success: true, count: creations.length });
    
  } catch (err: any) {
    console.error("[Telemetry API Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
