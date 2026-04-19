import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"];
    if (!allowedRoles.includes(userRole)) {
       // Allow teachers to see subjects they teach
       if (userRole === 'TEACHER' || userRole === 'FORM_TEACHER') {
          const subjects = await prisma.subject.findMany({
             where: { teacherId: payload.id as string },
             include: { class: true }
          });
          return NextResponse.json({ subjects });
       }
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";

    if (type === "overview") {
      const [sessions, classes] = await Promise.all([
        prisma.academicSession.findMany({
          orderBy: { year: 'desc' },
          include: { terms: { orderBy: { name: 'asc' } } },
        }),
        prisma.class.findMany({
          where: { active: true },
          orderBy: [{ campus: 'asc' }, { displayOrder: 'asc' }],
          include: {
            arms: {
              include: {
                teacher: { select: { name: true } },
                _count: { select: { students: true } },
              },
              orderBy: { label: 'asc' },
            },
          },
        }),
      ]);
      return NextResponse.json({ sessions, classes });
    }

    if (type === "subjects") {
       const subjects = await prisma.subject.findMany({
          orderBy: { name: 'asc' },
          include: { class: true, teacher: { select: { name: true } } }
       });
       return NextResponse.json({ subjects });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    
  } catch (err: any) {
    console.error("[API Structure] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"].includes(payload.role as string)) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (action === "createSession") {
       if (data.isDefault) {
          await prisma.academicSession.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
       }
        const session = await prisma.academicSession.create({
           data: {
              name: data.name,
              year: String(data.year),
              isDefault: !!data.isDefault,
              status: 'UPCOMING',
              startDate: data.startDate ? new Date(data.startDate) : new Date(),
              endDate: data.endDate ? new Date(data.endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
           }
        });
       return NextResponse.json(session);
    }

    if (action === "toggleTerm") {
       if (data.isCurrent) {
          await prisma.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
       }
       const term = await prisma.term.update({
          where: { id: data.id },
          data: { isCurrent: !!data.isCurrent, status: data.status }
       });
       return NextResponse.json(term);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    console.error("[API Structure POST] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
