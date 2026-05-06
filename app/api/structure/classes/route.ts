import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");

    const classes = await prisma.class.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { ...(campus && { campus: campus as any }), active: true },
      orderBy: [{ campus: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { arms: true } } },
    });

    return NextResponse.json(classes);
  } catch (err) {
    console.error("[structure/classes GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  try {
    const { name, campus, category, displayOrder } = await req.json();
    if (!name || !campus) return badRequest("name and campus are required");

    let cls = await prisma.class.findFirst({ where: { name, campus } });

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name,
          campus,
          category: category || null,
          displayOrder: displayOrder ? parseInt(displayOrder) : 99,
          active: true,
        },
      });
      audit(user.id, "CREATE", "Class", cls.id, `${campus} - ${name}`, getIP(req));
    }

    return NextResponse.json(cls, { status: 201 });
  } catch (err) {
    console.error("[structure/classes POST]", err);
    return serverError();
  }
}
