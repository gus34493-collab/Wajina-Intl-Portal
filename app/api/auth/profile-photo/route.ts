
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_access")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${userId}-${crypto.randomUUID()}${path.extname(file.name)}`;
    const relativePath = `/uploads/profile-photos/${fileName}`;
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    await writeFile(absolutePath, buffer);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: relativePath },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      profilePhoto: relativePath,
      user: updatedUser 
    });

  } catch (err: any) {
    console.error("[Profile Photo API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
