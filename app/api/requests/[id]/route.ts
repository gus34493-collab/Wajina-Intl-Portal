import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError } from "@/lib/api-auth";
import type { Role } from "@prisma/client";

const APPROVERS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS", "FORM_TEACHER"];

const CAMPUS_PRINCIPAL: Record<string, Role> = {
  PRIMARY: "HEAD_TEACHER",
  SECONDARY: "PRINCIPAL",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!APPROVERS.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const { action, feedback, forwardToId } = await req.json();
    if (!action) return badRequest("action is required: approve | deny | forward | escalate | respond");

    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return notFound("Request not found.");

    // Only the assigned receiver can act on it (unless DIRECTOR/PRINCIPAL/HEAD_TEACHER reviewing by campus)
    const isReceiver = request.receiverId === user.id;
    const isSupervisor = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"].includes(user.role as string);
    if (!isReceiver && !isSupervisor) return forbidden();

    if (action !== "respond" && request.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending." }, { status: 409 });
    }

    let data: any;

    if (action === "approve") {
      data = { status: "APPROVED", feedback: feedback ?? null };

    } else if (action === "deny") {
      if (!feedback?.trim()) return badRequest("feedback is required when denying a request.");
      data = { status: "DENIED", feedback: feedback.trim() };

    } else if (action === "respond") {
      // Send feedback without closing the request
      if (!feedback?.trim()) return badRequest("feedback is required for a response.");
      data = { feedback: feedback.trim() };

    } else if (action === "forward") {
      if (!forwardToId) return badRequest("forwardToId is required when forwarding.");
      data = { isForwarded: true, receiverId: forwardToId, feedback: feedback ?? null };

    } else if (action === "escalate") {
      // FORM_TEACHER: can escalate K1 → K2 (to campus principal)
      // HEAD_TEACHER / PRINCIPAL: can escalate K2 → K3 (to DIRECTOR)
      const role = user.role as string;

      if (role === "FORM_TEACHER") {
        if (request.level !== "K1") return badRequest("Form teachers can only escalate K1 requests.");
        const principalRole: Role = request.campus ? (CAMPUS_PRINCIPAL[request.campus as string] ?? "HEAD_TEACHER") : "HEAD_TEACHER";
        const principal = await prisma.user.findFirst({
          where: { role: principalRole, campus: request.campus as any },
          select: { id: true },
        });
        if (!principal) return NextResponse.json({ error: "No campus principal found to escalate to." }, { status: 422 });
        data = { level: "K2", receiverId: principal.id, isForwarded: true, feedback: feedback ?? null };

      } else if (role === "HEAD_TEACHER" || role === "PRINCIPAL") {
        if (request.level !== "K2") return badRequest("Head teachers can only escalate K2 requests.");
        const director = await prisma.user.findFirst({
          where: { role: "DIRECTOR" },
          select: { id: true },
        });
        if (!director) return NextResponse.json({ error: "No director found to escalate to." }, { status: 422 });
        data = { level: "K3", receiverId: director.id, isForwarded: true, feedback: feedback ?? null };

      } else {
        return forbidden();
      }

    } else {
      return badRequest("action must be one of: approve, deny, forward, escalate, respond");
    }

    const updated = await prisma.request.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[requests/[id] PATCH]", err);
    return serverError();
  }
}
