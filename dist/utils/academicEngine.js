"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSS_GRADING_SCALE = exports.DEFAULT_GRADING_SCALE = void 0;
exports.getAssessmentConfig = getAssessmentConfig;
exports.calculateScore = calculateScore;
exports.generateReports = generateReports;
exports.canViewResults = canViewResults;
exports.calculateAnnualMean = calculateAnnualMean;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Academic Engine
 * Handles specialized campus-aware calculations, grading, and debt-blocking.
 */
exports.DEFAULT_GRADING_SCALE = [
    { min: 75, grade: 'A', remark: 'Excellent' },
    { min: 65, grade: 'B', remark: 'Very Good' },
    { min: 55, grade: 'C', remark: 'Good' },
    { min: 45, grade: 'D', remark: 'Pass' },
    { min: 40, grade: 'E', remark: 'Fair' },
    { min: 0, grade: 'F', remark: 'Fail' },
];
exports.SSS_GRADING_SCALE = [
    { min: 75, grade: 'A1', remark: 'Excellent' },
    { min: 70, grade: 'B2', remark: 'Very Good' },
    { min: 65, grade: 'B3', remark: 'Good' },
    { min: 60, grade: 'C4', remark: 'Credit' },
    { min: 55, grade: 'C5', remark: 'Credit' },
    { min: 50, grade: 'C6', remark: 'Credit' },
    { min: 45, grade: 'D7', remark: 'Pass' },
    { min: 40, grade: 'E8', remark: 'Pass' },
    { min: 0, grade: 'F9', remark: 'Fail' },
];
/**
 * Identify assessment configuration based on student/class context.
 */
function getAssessmentConfig(campus, category, className = '') {
    const name = (className || '').toUpperCase();
    const cat = (category || '').toLowerCase();
    const isSenior = cat.includes('senior') || cat.includes('sss') || name.startsWith('SSS') || name.startsWith('SS');
    if (campus === 'PRIMARY') {
        return {
            type: 'PRIMARY',
            labels: ['Assessment 1', 'Assessment 2', 'Assessment 3', 'Assessment 4', 'Assessment 5', 'Exams'],
            maxScores: [10, 10, 10, 10, 10, 50],
            total: 100,
            scale: exports.DEFAULT_GRADING_SCALE
        };
    }
    if (isSenior) {
        return {
            type: 'SENIOR_SECONDARY',
            labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
            maxScores: [10, 10, 10, 70],
            total: 100,
            scale: exports.SSS_GRADING_SCALE
        };
    }
    else {
        // Default to Junior Secondary
        return {
            type: 'JUNIOR_SECONDARY',
            labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
            maxScores: [15, 15, 10, 60],
            total: 100,
            scale: exports.DEFAULT_GRADING_SCALE
        };
    }
}
/**
 * Calculate total and grade for a single subject entry.
 */
function calculateScore(data, config) {
    const { firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = data;
    let total = 0;
    if (config.type === 'PRIMARY') {
        total = firstCA + secondCA + thirdCA + fourthCA + fifthCA + exam;
    }
    else {
        total = firstCA + secondCA + thirdCA + exam;
    }
    // Round to 2 decimal places (as seen in PDF)
    total = Math.round(total * 100) / 100;
    const grading = config.scale.find((g) => total >= g.min) || config.scale[config.scale.length - 1];
    return {
        total,
        grade: grading.grade,
        remark: grading.remark
    };
}
/**
 * Generate automatic reports (remarks) based on score.
 */
function generateReports(average) {
    if (average >= 75)
        return {
            teacher: "An excellent result. Keep up the high standard.",
            principal: "Excellent performance."
        };
    if (average >= 65)
        return {
            teacher: "A very good performance. You can do even better.",
            principal: "Very good result."
        };
    if (average >= 55)
        return {
            teacher: "Good result. Maintain this momentum.",
            principal: "Good performance."
        };
    if (average >= 50)
        return {
            teacher: "Average performance. More effort is needed.",
            principal: "Average result."
        };
    if (average >= 40)
        return {
            teacher: "Fair result. Focus more on your weak areas.",
            principal: "Fair performance."
        };
    return {
        teacher: "Poor result. You need to focus more on your studies.",
        principal: "Poor performance."
    };
}
/**
 * Check if a student can view results for a specific term based on payment status.
 */
async function canViewResults(studentId, termId) {
    let targetTermId = termId;
    if (!targetTermId) {
        const currentTerm = await prisma_1.default.term.findFirst({
            where: { isCurrent: true },
            select: { id: true }
        });
        // CRITICAL: If no term context is found, block by default. Do not allow bypass.
        if (!currentTerm) {
            console.warn(`[AcademicEngine] Access blocked for student ${studentId}: No term context found.`);
            return false;
        }
        targetTermId = currentTerm.id;
    }
    // 1. Get student context — support both arm-enrolled and directly-classed students
    const student = await prisma_1.default.user.findUnique({
        where: { id: studentId },
        select: {
            campus: true,
            classId: true,
            enrolledArm: { select: { classId: true, class: { select: { campus: true } } } },
            enrolledClass: { select: { campus: true } }
        }
    });
    if (!student)
        return false;
    // Resolve the student's effective classId and campus (arm takes priority)
    const effectiveClassId = student.enrolledArm?.classId ?? student.classId ?? null;
    const effectiveCampus = student.enrolledArm?.class?.campus ?? student.enrolledClass?.campus ?? student.campus ?? null;
    console.log(`[DEBUG] canViewResults: student=${studentId}, term=${targetTermId}, class=${effectiveClassId}, campus=${effectiveCampus}`);
    // 2. Resolve target tuition amount
    // Hierarchy: Class-specific > Campus-specific > Global (campus null, classId null)
    const configs = await prisma_1.default.feeConfig.findMany({
        where: {
            termId: targetTermId,
            category: 'TUITION',
            OR: [
                ...(effectiveClassId ? [{ classId: effectiveClassId }] : []),
                ...(effectiveCampus ? [{ campus: effectiveCampus, classId: null }] : []),
                { campus: null, classId: null }
            ]
        }
    });
    // If no fee config exists for this term, we assume no debt-blocking is required for this specific cycle.
    if (configs.length === 0) {
        console.log(`[DEBUG] canViewResults: No fee configs found for term ${targetTermId}`);
        return true;
    }
    // Priority: CLASS > CAMPUS > GLOBAL
    const feeConfig = (effectiveClassId ? configs.find((c) => c.classId === effectiveClassId) : null) ||
        (effectiveCampus ? configs.find((c) => c.campus === effectiveCampus && !c.classId) : null) ||
        configs.find((c) => !c.campus && !c.classId);
    console.log(`[DEBUG] canViewResults: Matched feeConfig=${JSON.stringify(feeConfig)}`);
    if (!feeConfig || Number(feeConfig.amount) <= 0)
        return true;
    // 3. Sum all approved tuition payments for this term
    const payments = await prisma_1.default.payment.findMany({
        where: {
            studentId,
            termId: targetTermId,
            category: 'TUITION',
            status: { in: ['SUCCESS', 'APPROVED'] }
        },
        select: { amount: true }
    });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    // 4. Allow only if fully paid
    const isAllowed = totalPaid >= Number(feeConfig.amount);
    if (!isAllowed) {
        console.log(`[AcademicEngine] Student ${studentId} blocked: Paid ${totalPaid}/${feeConfig.amount} for term ${targetTermId}`);
    }
    return isAllowed;
}
/**
 * Calculate Annual Mean across terms (always divide by 3).
 * Precision: 2 decimal places.
 */
function calculateAnnualMean(termResults) {
    const sum = (termResults || []).reduce((acc, val) => acc + (val || 0), 0);
    return Math.round((sum / 3) * 100) / 100;
}
