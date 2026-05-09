import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role;
  if (role !== "HOD" && role !== "DIRECTOR" && role !== "PRINCIPAL" && role !== "VP_ACADEMICS") return forbidden();

  try {
    const currentTerm = await prisma.term.findFirst({ where: { status: "CURRENT" } });
    if (!currentTerm) {
      return NextResponse.json({ pendingCount: 0, eliteCount: 0, deptAverage: 0, achievers: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { class: { campus: user.campus as any } },
      select: { id: true, name: true }
    });
    const subjectIds = subjects.map(s => s.id);

    const [pendingCount, achievers, stats] = await Promise.all([
      prisma.grade.count({
        where: {
          subjectId: { in: subjectIds },
          termId: currentTerm.id,
          status: "SUBMITTED" 
        }
      }),
      prisma.grade.findMany({
        where: {
          subjectId: { in: subjectIds },
          termId: currentTerm.id,
          total: { gte: 80 }
        },
        orderBy: { total: "desc" },
        take: 5,
        select: {
          total: true,
          student: { select: { name: true } },
          subject: { select: { name: true } }
        }
      }),
      prisma.grade.aggregate({
        where: {
          subjectId: { in: subjectIds },
          termId: currentTerm.id
        },
        _avg: { total: true }
      })
    ]);

    const formattedAchievers = achievers.map(a => ({
      name: a.student.name,
      subject: a.subject.name,
      score: Math.round(a.total)
    }));

    return NextResponse.json({
      pendingCount,
      eliteCount: achievers.length,
      deptAverage: Math.round(stats._avg.total || 0),
      achievers: formattedAchievers
    });
  } catch (err) {
    console.error("[academic/department-stats GET]", err);
    return serverError();
  }
}
