import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError, hasRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PRINCIPAL", "HEAD_TEACHER", "DIRECTOR", "VP_ACADEMICS")) return forbidden();

  try {
    const { termId, sessionId } = await req.json();
    if (!termId || !sessionId) return badRequest("termId and sessionId are required");

    // "Publishing" results means we advance all FORM_APPROVED (or SUBMITTED) grades 
    // to PRINCIPAL_APPROVED, which makes them visible to PARENT and STUDENT roles.
    const result = await prisma.grade.updateMany({
      where: {
        termId,
        sessionId,
        status: { in: ["FORM_APPROVED", "SUBMITTED"] },
        // Scope to campus if not Director
        ...(user.role !== "DIRECTOR" ? {
          student: { campus: user.campus as any }
        } : {})
      },
      data: {
        status: "PRINCIPAL_APPROVED",
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err) {
    console.error("[report-cards/publish POST]", err);
    return serverError();
  }
}
