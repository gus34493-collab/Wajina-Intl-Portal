import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError } from "@/lib/api-auth";

const APPROVERS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!APPROVERS.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const { action, feedback, forwardToId } = await req.json();
    if (!action) return badRequest("action is required: approve | deny | forward");

    const request = await prisma.request.findUnique({ where: { id: id } });
    if (!request) return notFound("Request not found.");
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending." }, { status: 409 });
    }

    let data: any;
    if (action === "approve") {
      data = { status: "APPROVED", feedback: feedback ?? null };
    } else if (action === "deny") {
      if (!feedback?.trim()) return badRequest("feedback is required when denying a request.");
      data = { status: "DENIED", feedback: feedback.trim() };
    } else if (action === "forward") {
      if (!forwardToId) return badRequest("forwardToId is required when forwarding.");
      data = { isForwarded: true, receiverId: forwardToId, feedback: feedback ?? null };
    } else {
      return badRequest("action must be one of: approve, deny, forward");
    }

    const updated = await prisma.request.update({ where: { id: id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[requests/[id] PATCH]", err);
    return serverError();
  }
}
