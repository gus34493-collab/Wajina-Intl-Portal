import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { getAssessmentConfig, calculateScore, generateReports } from "@/lib/academic-engine";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const userRole = payload.role as string;

    const { subjectId, termId, sessionId, grades } = await req.json();

    if (!subjectId || !termId || !sessionId || !Array.isArray(grades)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { class: true }
    });

    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Role Security
    if (['TEACHER', 'FORM_TEACHER'].includes(userRole)) {
      if (subject.teacherId !== userId) {
        return NextResponse.json({ error: "Subject assignment mismatch" }, { status: 403 });
      }
    }

    const config = getAssessmentConfig(subject.class.campus, subject.class.category, subject.class.name);

    const operations = grades.map((g: any) => {
      const { studentId, firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = g;

      const result = calculateScore({
        firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam
      }, config);

      const autoRemarks = generateReports(result.total);

      const gradeData = {
        studentId,
        subjectId,
        termId,
        sessionId,
        firstCA: parseFloat(firstCA) || 0,
        secondCA: parseFloat(secondCA) || 0,
        thirdCA: parseFloat(thirdCA) || 0,
        fourthCA: parseFloat(fourthCA) || 0,
        fifthCA: parseFloat(fifthCA) || 0,
        exam: parseFloat(exam) || 0,
        total: result.total,
        grade: result.grade,
        teacherComment: autoRemarks.teacher,
        principalRemark: autoRemarks.principal,
        status: 'DRAFT'
      };

      return prisma.grade.upsert({
        where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
        update: gradeData as any,
        create: gradeData as any
      });
    });

    const results = await prisma.$transaction(operations);

    return NextResponse.json({ 
       success: true, 
       count: results.length 
    });
    
  } catch (err: any) {
    console.error("[API Grades Bulk] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
