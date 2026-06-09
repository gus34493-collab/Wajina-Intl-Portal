"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  ChevronLeft,
  Loader2,
  Download,
  Printer,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { getAssessmentConfig } from "@/lib/academic-engine";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface GradeRecord {
  id: string;
  firstCA: number;
  secondCA: number;
  thirdCA: number;
  fourthCA: number;
  fifthCA: number;
  exam: number;
  total: number;
  grade: string;
  position?: number;
  teacherComment?: string;
  formMasterRemark?: string;
  principalRemark?: string;
  subject: { id: string; name: string };
  term?: { id: string; name: string; session?: { name: string; year?: string } };
}

interface StudentMeta {
  id: string;
  name: string;
  campus?: string;
  enrolledClass?: { name: string; campus: string; category: string };
  enrolledArm?: { fullName: string; class: { name: string; campus: string; category: string } };
}

/* ─── Grading Scale Helpers ──────────────────────────────────────────── */

const DEFAULT_SCALE = [
  { min: 75, grade: "A", remark: "Excellent" },
  { min: 65, grade: "B", remark: "Very Good" },
  { min: 55, grade: "C", remark: "Good" },
  { min: 45, grade: "D", remark: "Pass" },
  { min: 40, grade: "E", remark: "Fair" },
  { min: 0, grade: "F", remark: "Fail" },
];

const SSS_SCALE = [
  { min: 75, grade: "A1", remark: "Excellent" },
  { min: 70, grade: "B2", remark: "Very Good" },
  { min: 65, grade: "B3", remark: "Good" },
  { min: 60, grade: "C4", remark: "Credit" },
  { min: 55, grade: "C5", remark: "Credit" },
  { min: 50, grade: "C6", remark: "Credit" },
  { min: 45, grade: "D7", remark: "Pass" },
  { min: 40, grade: "E8", remark: "Pass" },
  { min: 0, grade: "F9", remark: "Fail" },
];

function resolveConfig(campus?: string, category?: string, className?: string) {
  const name = (className || "").toUpperCase();
  const cat = (category || "").toLowerCase();
  const isSenior = cat.includes("senior") || cat.includes("sss") || name.startsWith("SSS") || name.startsWith("SS");
  const isPrimary = campus === "PRIMARY" || name.startsWith("BASIC") || name.startsWith("PRY");
  const isEarlyYears = cat.includes("nursery") || cat.includes("creche") || name.startsWith("NUR") || name.startsWith("CRE");

  if (isEarlyYears) {
    return {
      type: "EARLY_YEARS" as const,
      labels: ["Physiological", "Cognitive", "Social", "Creative"],
      maxScores: [25, 25, 25, 25],
      total: 100,
      scale: DEFAULT_SCALE,
      hasExam: false,
    };
  }
  if (isPrimary) {
    return {
      type: "PRIMARY" as const,
      labels: ["CA 1", "CA 2", "CA 3", "CA 4", "CA 5", "Exams"],
      maxScores: [10, 10, 10, 10, 10, 50],
      total: 100,
      scale: DEFAULT_SCALE,
      hasExam: true,
    };
  }
  if (isSenior) {
    return {
      type: "SENIOR_SECONDARY" as const,
      labels: ["CA 1", "CA 2", "CA 3", "Exams"],
      maxScores: [10, 10, 10, 70],
      total: 100,
      scale: SSS_SCALE,
      hasExam: true,
    };
  }
  return {
    type: "JUNIOR_SECONDARY" as const,
    labels: ["CA 1", "CA 2", "CA 3", "Exams"],
    maxScores: [15, 15, 10, 60],
    total: 100,
    scale: DEFAULT_SCALE,
    hasExam: true,
  };
}

function gradeColor(total: number, config: ReturnType<typeof resolveConfig>) {
  if (config.type === "SENIOR_SECONDARY") {
    if (total >= 75) return "bg-brand-secondary text-white";
    if (total >= 60) return "bg-brand-accent text-white";
    if (total >= 45) return "bg-brand-tertiary text-white";
    return "bg-brand-error text-white";
  }
  if (total >= 75) return "bg-brand-secondary text-white";
  if (total >= 65) return "bg-brand-accent text-white";
  if (total >= 55) return "bg-brand-tertiary text-white";
  if (total >= 40) return "bg-brand-primary/20 text-brand-primary";
  return "bg-brand-error text-white";
}

function remarkForAverage(avg: number) {
  if (avg >= 75) return "An outstanding performance this term. Maintain this exceptional standard.";
  if (avg >= 65) return "A commendable result. Continue to strive for higher goals.";
  if (avg >= 55) return "A good performance. There is room for growth and improvement.";
  if (avg >= 45) return "Average result. Greater effort and dedication are needed next term.";
  if (avg >= 40) return "A fair performance. Focused attention on weaker subjects is essential.";
  return "Below expectation. A structured improvement plan is strongly recommended.";
}

/* ─── Extractors ─────────────────────────────────────────────────────── */

function extractCAs(g: GradeRecord, config: ReturnType<typeof resolveConfig>): number[] {
  if (config.type === "EARLY_YEARS") {
    return [g.firstCA, g.secondCA, g.thirdCA, g.fourthCA];
  }
  if (config.type === "PRIMARY") {
    return [g.firstCA, g.secondCA, g.thirdCA, g.fourthCA, g.fifthCA, g.exam];
  }
  return [g.firstCA, g.secondCA, g.thirdCA, g.exam];
}

/* ─── Ordinal Suffix Helper ─────────────────────────────────────── */

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ─── Main Content ───────────────────────────────────────────────────── */

function StudentResultsDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [studentMeta, setStudentMeta] = useState<StudentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const termId = searchParams.get("termId") || undefined;
  const sessionId = searchParams.get("sessionId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  useEffect(() => {
    if (!user) return;
    async function fetchResults() {
      setLoading(true);
      setError(null);
      try {
        let endpoint: string;
        const role = user!.role;
        
        if (role === "PARENT" && studentId) {
          // Parent viewing ward's results
          const qs = new URLSearchParams();
          if (termId) qs.set("termId", termId);
          if (sessionId) qs.set("sessionId", sessionId);
          endpoint = `/api/parent/wards/${studentId}/grades?${qs.toString()}`;
        } else {
          // Student viewing own results
          const qs = new URLSearchParams();
          if (termId) qs.set("termId", termId);
          if (sessionId) qs.set("sessionId", sessionId);
          endpoint = `/api/grades?${qs.toString()}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) {
          if (res.status === 403) {
            setError("PAYMENT_REQUIRED");
          } else {
            setError("Failed to load results.");
          }
          return;
        }

        const data = await res.json();
        setGrades(data.grades || []);
        if (data.student) {
          setStudentMeta(data.student);
        }
      } catch (err) {
        console.error("Result fetch error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [user, termId, sessionId, studentId]);

  /* ─── Derived data ────────────────────────────────────────────────── */

  const studentName = studentMeta?.name || user?.name || "Student";
  const className =
    studentMeta?.enrolledArm?.fullName ||
    studentMeta?.enrolledArm?.class?.name ||
    studentMeta?.enrolledClass?.name ||
    user?.enrolledArm?.fullName ||
    user?.enrolledClass?.name ||
    "";
  const campus =
    studentMeta?.enrolledArm?.class?.campus ||
    studentMeta?.enrolledClass?.campus ||
    studentMeta?.campus ||
    user?.campus ||
    "PRIMARY";
  const category =
    studentMeta?.enrolledArm?.class?.category ||
    studentMeta?.enrolledClass?.category ||
    "";

  const config = useMemo(() => resolveConfig(campus, category, className), [campus, category, className]);

  const termName = grades[0]?.term?.name || "—";
  const sessionName = grades[0]?.term?.session?.name || "—";

  const average = useMemo(() => {
    if (grades.length === 0) return 0;
    return Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10;
  }, [grades]);

  const overallGrade = useMemo(() => {
    const match = config.scale.find((s) => average >= s.min);
    return match || config.scale[config.scale.length - 1];
  }, [average, config]);

  const highestSubject = useMemo(() => {
    if (grades.length === 0) return null;
    return grades.reduce((best, g) => (g.total > best.total ? g : best), grades[0]);
  }, [grades]);

  const lowestSubject = useMemo(() => {
    if (grades.length === 0) return null;
    return grades.reduce((worst, g) => (g.total < worst.total ? g : worst), grades[0]);
  }, [grades]);

  // Overall position: most common position across subjects, or average of all subject positions
  const overallPosition = useMemo(() => {
    const positions = grades.map((g) => g.position).filter((p): p is number => p != null && p > 0);
    if (positions.length === 0) return null;
    // Use the mode (most common position)
    const freq: Record<number, number> = {};
    let maxCount = 0;
    let mode = positions[0];
    for (const p of positions) {
      freq[p] = (freq[p] || 0) + 1;
      if (freq[p] > maxCount) {
        maxCount = freq[p];
        mode = p;
      }
    }
    // If no clear mode, use rounded average
    if (maxCount <= 1) {
      return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
    }
    return mode;
  }, [grades]);

  const formMasterRemark = grades.find((g) => g.formMasterRemark)?.formMasterRemark;
  const principalRemark = grades.find((g) => g.principalRemark)?.principalRemark;

  const handlePrint = () => window.print();

  /* ─── Loading / Error states ──────────────────────────────────────── */

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mb-6" />
          <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-primary/50 font-display">
            Decrypting Academic Records...
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (error === "PAYMENT_REQUIRED") {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-brand-tertiary/10 flex items-center justify-center mb-8">
            <Shield className="w-10 h-10 text-brand-tertiary" />
          </div>
          <h2 className="text-xl font-display font-black text-brand-primary uppercase tracking-tight mb-3">
            Results Restricted
          </h2>
          <p className="text-sm text-brand-primary/60 font-medium leading-relaxed mb-8">
            Tuition fees for this term must be fully settled before results can be viewed. 
            Please contact the Bursary or make payment through the Parent Payments portal.
          </p>
          <button
            onClick={() => router.back()}
            className="heritage-btn text-xs"
          >
            Go Back
          </button>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-brand-error mb-6" />
          <p className="text-sm font-bold text-brand-primary/60">{error}</p>
        </div>
      </DashboardShell>
    );
  }

  /* ─── Render ──────────────────────────────────────────────────────── */

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-4">
        {/* ── Nav Bar ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-tertiary hover:text-brand-primary no-underline transition-all group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-white border border-brand-primary/10 text-brand-primary px-5 py-3 rounded-xl shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-md transition-all"
            >
              <Printer size={16} />
              Print
            </button>
            <button className="bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/20 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
              <Download size={16} />
              PDF Export
            </button>
          </div>
        </div>

        {/* ── Report Card ─────────────────────────────────────────── */}
        <div
          ref={printRef}
          className="bg-white rounded-2xl shadow-[var(--shadow-premium)] border border-brand-primary/8 overflow-hidden print:shadow-none print:border-0 print:rounded-none"
        >
          {/* ── Masthead ──────────────────────────────────────────── */}
          <div className="relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary to-brand-secondary/80" />
            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")"}} />
            
            <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center gap-8">
              {/* Logo */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/95 p-2 shadow-lg shadow-black/10 flex-shrink-0">
                <img
                  src="/images/logo-no-bg.png"
                  alt="Wajina International Schools"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* School Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-[0.15em] mb-1 leading-tight">
                  Wajina International Schools
                </h1>
                <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mb-5">
                  Groomed for Excellence
                </p>
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
                  <span className="text-xs font-black text-white/90 uppercase tracking-widest">
                    Termly Academic Report
                  </span>
                </div>
              </div>

              {/* Average Badge */}
              <div className="flex-shrink-0 text-center">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white/50 uppercase tracking-widest mb-1">Average</span>
                  <span className="text-4xl font-display font-black text-white tracking-tighter">{average}</span>
                  <span className="text-xs font-black text-brand-secondary uppercase tracking-widest mt-0.5">{overallGrade.grade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Student Information Strip ─────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-b border-brand-primary/8">
            {[
              { label: "Student", value: studentName },
              { label: "Class", value: className || "—" },
              { label: "Position", value: overallPosition ? ordinalSuffix(overallPosition) : "—" },
              { label: "Term", value: termName },
              { label: "Session", value: sessionName },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`px-6 py-4 ${i < 4 ? "border-r border-brand-primary/8" : ""} ${i >= 3 ? "border-t md:border-t-0 border-brand-primary/8" : ""}`}
              >
                <span className="block text-[10px] font-black text-brand-tertiary uppercase tracking-[0.15em] mb-1">
                  {item.label}
                </span>
                <span className="block text-sm font-black text-brand-primary tracking-tight truncate">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Assessment Type Banner ────────────────────────────── */}
          <div className="px-6 py-3 bg-brand-blush border-b border-brand-primary/8 flex items-center justify-between">
            <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em]">
              {config.type.replace(/_/g, " ")} ASSESSMENT
            </span>
            <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
              {grades.length} Subject{grades.length !== 1 ? "s" : ""} · Max {config.total}
            </span>
          </div>

          {/* ── Grades Table ──────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-brand-primary/[0.03]">
                  <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-[0.12em] border-b-2 border-brand-primary/10 w-[30%]">
                    Subject
                  </th>
                  {config.labels.map((label, i) => (
                    <th
                      key={label}
                      className="px-3 py-4 text-[10px] font-black text-brand-tertiary uppercase tracking-[0.1em] border-b-2 border-brand-primary/10 text-center"
                    >
                      <div>{label}</div>
                      <div className="text-[9px] font-bold text-brand-primary/30 mt-0.5 normal-case tracking-normal">
                        /{config.maxScores[i]}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-4 text-[10px] font-black text-brand-primary uppercase tracking-[0.12em] border-b-2 border-brand-primary/10 text-center">
                    Total
                    <div className="text-[9px] font-bold text-brand-primary/30 mt-0.5 normal-case tracking-normal">
                      /{config.total}
                    </div>
                  </th>
                  <th className="px-3 py-4 text-[10px] font-black text-brand-primary uppercase tracking-[0.12em] border-b-2 border-brand-primary/10 text-center">
                    Grade
                  </th>
                  <th className="px-3 py-4 text-[10px] font-black text-brand-primary uppercase tracking-[0.12em] border-b-2 border-brand-primary/10 text-center">
                    Pos.
                  </th>
                  <th className="px-3 py-4 text-[10px] font-black text-brand-primary uppercase tracking-[0.12em] border-b-2 border-brand-primary/10 text-center">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/5">
                {grades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.labels.length + 5}
                      className="px-6 py-16 text-center text-sm font-bold text-brand-primary/30"
                    >
                      No results found for this term.
                    </td>
                  </tr>
                ) : (
                  grades.map((g, idx) => {
                    const cas = extractCAs(g, config);
                    const remarkText = config.scale.find((s) => g.total >= s.min)?.remark || "—";
                    return (
                      <tr
                        key={g.id}
                        className={`transition-colors hover:bg-brand-blush/40 ${idx % 2 === 0 ? "bg-white" : "bg-brand-primary/[0.015]"}`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-brand-primary uppercase tracking-tight">
                            {g.subject.name}
                          </span>
                        </td>
                        {cas.map((score, ci) => (
                          <td key={ci} className="px-3 py-4 text-center">
                            <span className="text-sm font-bold text-brand-primary/70 tabular-nums">
                              {score ?? "—"}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm font-black text-brand-primary tabular-nums">
                            {g.total}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md text-[11px] font-black ${gradeColor(g.total, config)}`}
                          >
                            {g.grade || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm font-black text-brand-primary/60 tabular-nums">
                            {g.position ? ordinalSuffix(g.position) : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-[11px] font-bold text-brand-primary/50">
                            {remarkText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* ── Summary Row ────────────────────────────────────── */}
              {grades.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-brand-primary/10 bg-brand-primary/[0.03]">
                    <td className="px-6 py-4 text-sm font-black text-brand-primary uppercase tracking-widest">
                      Average
                    </td>
                    {config.labels.map((_, i) => (
                      <td key={i} className="px-3 py-4" />
                    ))}
                    <td className="px-3 py-4 text-center">
                      <span className="text-lg font-display font-black text-brand-primary tabular-nums">
                        {average}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md text-[11px] font-black ${gradeColor(average, config)}`}
                      >
                        {overallGrade.grade}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-sm font-display font-black text-brand-primary">
                        {overallPosition ? ordinalSuffix(overallPosition) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-[11px] font-bold text-brand-primary/50">
                        {overallGrade.remark}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ── Grading Scale Key ─────────────────────────────────── */}
          <div className="px-6 py-4 bg-brand-blush/50 border-t border-brand-primary/8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em]">
                Grading Key
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {config.scale.map((s) => (
                <span key={s.grade} className="text-[10px] font-bold text-brand-primary/60">
                  <span className="font-black text-brand-primary">{s.grade}</span>
                  {" "}({s.min}–{s.min === 0 ? (config.scale[config.scale.indexOf(s) - 1]?.min ?? config.total) - 1 : config.scale[config.scale.indexOf(s) - 1]?.min
                    ? config.scale[config.scale.indexOf(s) - 1].min - 1
                    : config.total}%)
                  {" "}{s.remark}
                </span>
              ))}
            </div>
          </div>

          {/* ── Performance Insights Strip ────────────────────────── */}
          {grades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-t border-brand-primary/8">
              <div className="px-6 py-5 border-b sm:border-b-0 sm:border-r border-brand-primary/8">
                <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-[0.15em] mb-1">
                  Strongest Subject
                </span>
                <span className="block text-sm font-black text-brand-primary">
                  {highestSubject?.subject.name}
                </span>
                <span className="text-xs font-bold text-brand-primary/40">
                  {highestSubject?.total}/{config.total}
                </span>
              </div>
              <div className="px-6 py-5 border-b sm:border-b-0 sm:border-r border-brand-primary/8">
                <span className="block text-[10px] font-black text-brand-tertiary uppercase tracking-[0.15em] mb-1">
                  Needs Attention
                </span>
                <span className="block text-sm font-black text-brand-primary">
                  {lowestSubject?.subject.name}
                </span>
                <span className="text-xs font-bold text-brand-primary/40">
                  {lowestSubject?.total}/{config.total}
                </span>
              </div>
              <div className="px-6 py-5">
                <span className="block text-[10px] font-black text-brand-accent uppercase tracking-[0.15em] mb-1">
                  Subjects Taken
                </span>
                <span className="block text-sm font-black text-brand-primary">{grades.length}</span>
                <span className="text-xs font-bold text-brand-primary/40">
                  {grades.filter((g) => g.total >= 40).length} passed
                </span>
              </div>
            </div>
          )}

          {/* ── Remarks Section ───────────────────────────────────── */}
          <div className="border-t border-brand-primary/8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-brand-primary/8">
              {/* Form Teacher Remark */}
              <div className="p-6">
                <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-3">
                  Form Teacher&apos;s Remark
                </span>
                <p className="text-sm text-brand-primary/70 font-medium leading-relaxed italic">
                  &ldquo;{formMasterRemark || remarkForAverage(average)}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-dashed border-brand-primary/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
                    Signature
                  </span>
                  <div className="w-32 border-b border-brand-primary/20" />
                </div>
              </div>

              {/* Principal Remark */}
              <div className="p-6">
                <span className="block text-[10px] font-black text-brand-tertiary uppercase tracking-[0.2em] mb-3">
                  Head of School&apos;s Remark
                </span>
                <p className="text-sm text-brand-primary/70 font-medium leading-relaxed italic">
                  &ldquo;{principalRemark || (average >= 55 ? "Good performance." : "More effort is required.")}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-dashed border-brand-primary/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
                    Signature
                  </span>
                  <div className="w-32 border-b border-brand-primary/20" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="px-6 py-4 bg-brand-primary/[0.03] border-t border-brand-primary/8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
              This is a computer-generated document. No signature is required for digital copies.
            </p>
            <p className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
              Wajina International Schools &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* ── Result Query Box ─────────────────────────────────────── */}
        <div className="bg-brand-tertiary/5 border border-brand-tertiary/15 rounded-xl p-5 flex items-start gap-4 print:hidden">
          <AlertCircle size={20} className="text-brand-tertiary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-xs text-brand-primary uppercase tracking-tight mb-1">
              Result Query?
            </h4>
            <p className="text-[11px] font-medium text-brand-primary/55 leading-relaxed">
              If you have concerns about any grades displayed, you may initiate a formal result audit
              request through the Complaints module on your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* ── Print Styles ─────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, header, aside, footer,
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </DashboardShell>
  );
}

/* ─── Page Wrapper ───────────────────────────────────────────────────── */

export default function StudentResultsDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-primary/50">
              Decrypting Academic Records...
            </p>
          </div>
        </DashboardShell>
      }
    >
      <StudentResultsDetailContent />
    </Suspense>
  );
}
