import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "submissions");

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const level = formData.get("level") as string | null;
    const title = formData.get("title") as string | null;
    const category = formData.get("category") as string | null;
    const description = (formData.get("description") as string | null) ?? "";

    if (!file) return badRequest("File is required.");
    if (!level || !title || !category) return badRequest("level, title, and category are required.");

    const validLevels = ["K1", "K2", "K3"];
    if (!validLevels.includes(level)) return badRequest(`level must be one of: ${validLevels.join(", ")}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

    const request = await prisma.request.create({
      data: {
        level: level as any,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        category,
        fileUrl: `/uploads/submissions/${safeName}`,
        status: "PENDING",
        senderId: user.id,
        campus: user.campus as any,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    audit(user.id, "SUBMISSION_UPLOADED", "Request", request.id, `Category: ${category} | Title: ${title}`, getIP(req));
    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("[requests/upload POST]", err);
    return serverError();
  }
}
