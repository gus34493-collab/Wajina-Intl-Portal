import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE"];
const VALID_SESSIONS = ["MORNING", "CLOSING"];

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "TEACHER", "FORM_TEACHER", "ADMIN_STAFF")) return forbidden();

  try {
    const { date, armId, termId, session = "MORNING", records } = await req.json();

    if (!date || !Array.isArray(records) || records.length === 0) {
      return badRequest("date and records[] are required.");
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return badRequest("Invalid date format. Use YYYY-MM-DD.");

    const resolvedSession = VALID_SESSIONS.includes((session as string).toUpperCase())
      ? (session as string).toUpperCase()
      : "MORNING";

    if (user.role === "TEACHER" || user.role === "FORM_TEACHER") {
      if (armId) {
        const arm = await prisma.classArm.findUnique({ where: { id: armId } });
        if (!arm || arm.teacherId !== user.id) {
          return forbidden("You can only mark attendance for your assigned arm.");
        }
      }
    }

    for (const r of records) {
      if (!r.studentId || !VALID_STATUSES.includes(r.status)) {
        return badRequest("Invalid record: studentId and status (PRESENT|ABSENT|LATE) required.");
      }
    }

    const upserts = records.map((r: any) =>
      (prisma.attendance as any).upsert({
        where: { studentId_date_session: { studentId: r.studentId, date: dateObj, session: resolvedSession } },
        update: { status: r.status, note: r.note || null, markedById: user.id, termId: termId || null, armId: armId || null },
        create: {
          date: dateObj,
          session: resolvedSession,
          status: r.status,
          note: r.note || null,
          studentId: r.studentId,
          markedById: user.id,
          termId: termId || null,
          armId: armId || null,
        },
      })
    );

    const results = await prisma.$transaction(upserts);
    audit(user.id, "ATTENDANCE_BULK_MARK", "Attendance", armId || "N/A", `${records.length} records marked for ${date} (${resolvedSession})`, getIP(req));
    return NextResponse.json({ saved: results.length, date, session: resolvedSession, armId });
  } catch (err) {
    console.error("[attendance/bulk POST]", err);
    return serverError();
  }
}
