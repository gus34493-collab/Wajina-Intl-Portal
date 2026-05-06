import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const level = searchParams.get("level");
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const take = Math.min(parseInt(searchParams.get("take") ?? "100"), 200);

    const role = user.role as string;
    let where: any = {};
    if (status) where.status = status.toUpperCase();
    if (level) where.level = level.toUpperCase();

    if (role === "DIRECTOR") {
      const campus = searchParams.get("campus");
      if (campus && campus !== "ALL") where.sender = { campus: campus as any };
    } else {
      where.OR = [
        { sender: { campus: user.campus as any } },
        { receiverId: user.id },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: { sender: { select: { id: true, name: true, role: true, campus: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({ requests, total });
  } catch (err) {
    console.error("[requests GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { title, description, level, category, receiverId, studentId } = await req.json();
    if (!title?.trim() || !description?.trim() || !level) {
      return badRequest("title, description, and level are required.");
    }

    const validLevels = ["K1", "K2", "K3"];
    if (!validLevels.includes(level)) return badRequest(`level must be one of: ${validLevels.join(", ")}`);

    const request = await prisma.request.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        level,
        category: category ?? null,
        receiverId: receiverId ?? null,
        studentId: studentId ?? null,
        senderId: user.id,
        campus: user.campus as any,
        status: "PENDING",
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error("[requests POST]", err);
    return serverError();
  }
}
