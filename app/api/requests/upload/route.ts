import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { uploadToSpaces, createPresignedDownloadUrl } from "@/lib/spaces";
import { getAuthUser, unauthorized, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"]);

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

    // MIME and extension whitelist — prevents HTML/script upload via this endpoint
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
      return badRequest("File type not allowed. Accepted: PDF, Word, Excel, JPEG, PNG.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = `submissions/${user.id}/${Date.now()}-${crypto.randomUUID()}${ext}`;

    await uploadToSpaces(key, buffer, file.type);

    // Presigned URL valid for 1 year — serves as the download link stored on the record.
    // A proper /api/requests/[id]/download route should regenerate this on demand.
    const fileUrl = await createPresignedDownloadUrl(key, file.name, 60 * 60 * 24 * 365);

    const request = await prisma.request.create({
      data: {
        level: level as any,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        category,
        fileUrl,
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
