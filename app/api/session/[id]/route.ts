import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

const LEADERSHIP = ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER"] as const;
const CORE_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"] as const;

const TermWeightSchema = z.object({
  term: z.enum(["FIRST", "SECOND", "THIRD"]),
  weeks: z.number().int().min(1).max(20),
  profile: z.enum(["LINEAR", "ACCELERATED", "FRONT_LOADED"]),
});

const AcademicSessionUpdateSchema = z.object({
  name: z.string().min(5).max(50).optional(),
  totalWeeks: z.number().int().min(1).max(52).optional(),
  termWeights: z.array(TermWeightSchema).min(3).max(3).optional(),
  version: z.number().int(),
});

function validateSessionConsistency(data: z.infer<typeof AcademicSessionUpdateSchema>) {
  if (data.termWeights && data.totalWeeks) {
    const weightsTotal = data.termWeights.reduce((sum, tw) => sum + tw.weeks, 0);
    if (weightsTotal > data.totalWeeks + 4) {
      throw new Error(`Inconsistent Data: Term weeks (${weightsTotal}) cannot significantly exceed total session weeks (${data.totalWeeks})`);
    }
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...LEADERSHIP)) return forbidden();

  const { id } = await params;

  try {
    const body = await req.json();
    const parseResult = AcademicSessionUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "VALIDATION_FAILED", details: parseResult.error.format() }, { status: 400 });
    }

    const { version, name, totalWeeks, termWeights } = parseResult.data;

    if (!hasRole(user, ...CORE_ADMIN) && (name !== undefined || totalWeeks !== undefined)) {
      return forbidden("Only Directors, Principals, or Head Teachers can modify core institutional metadata.");
    }

    try {
      validateSessionConsistency(parseResult.data);
    } catch (err: any) {
      return NextResponse.json({ error: "INCONSISTENT_DATA", message: err.message }, { status: 400 });
    }

    const updated = await prisma.academicSession.updateMany({
      where: { id, version },
      data: {
        name,
        totalWeeks,
        termWeights: termWeights as any,
        version: { increment: 1 },
        lastUpdatedBy: user.name || "Unknown",
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "CONFLICT", message: "The session was updated by another administrator. Please refresh before saving." },
        { status: 409 }
      );
    }

    const freshSession = await prisma.academicSession.findUnique({ where: { id } });
    return NextResponse.json(freshSession);
  } catch (err) {
    console.error("[session/:id PUT]", err);
    return serverError();
  }
}
