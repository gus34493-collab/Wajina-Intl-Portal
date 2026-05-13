"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  TrendingUp,
  CalendarCheck,
  BookOpen,
  Lock,
  ChevronRight,
  Bell,
  Clock,
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

interface DashData {
  termName: string | null;
  resultsVisible: boolean;
  gradeCount: number;
  avgScore: number | null;
  grades: Array<{ subject: string; total: number; grade: string | null }>;
  attendance: { present: number; total: number; rate: number };
}

function gradeColor(g: string | null) {
  if (!g) return "text-brand-primary/40";
  if (g.startsWith("A")) return "text-brand-secondary";
  if (g.startsWith("B")) return "text-brand-accent";
  return "text-brand-primary/60";
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const hasAttendance = (data?.attendance.total ?? 0) > 0;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-primary/50 mb-1">
              {loading ? "…" : (data?.termName ?? "No Active Term")}
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-black text-brand-primary leading-tight">
              Welcome back, {firstName}!
            </h1>
          </div>
          <button className="relative mt-1 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors shrink-0">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-error border-2 border-white" />
          </button>
        </div>

        {/* 2-column KPI cards */}
        <div className="grid grid-cols-2 gap-4">

          {/* Term Average */}
          <div className="bg-brand-secondary/10 rounded-3xl p-5 md:p-7 flex flex-col gap-4 border border-brand-secondary/10">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} className="text-brand-secondary shrink-0" />
              <p className="text-xs font-bold text-brand-primary/60 uppercase tracking-wide">Term Average</p>
            </div>
            {loading ? (
              <div className="h-14 w-24 rounded-xl bg-brand-primary/5 animate-pulse" />
            ) : data?.resultsVisible && data.avgScore !== null ? (
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-5xl font-display font-black text-brand-primary">{data.avgScore}</span>
                <span className="text-2xl font-bold text-brand-primary/40">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 h-14">
                <Lock size={22} className="text-brand-primary/20" />
                <span className="text-3xl font-display font-black text-brand-primary/30">N/A</span>
              </div>
            )}
            <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/40">
              {!loading && (data?.resultsVisible === false
                ? "Results pending"
                : data?.avgScore && data.avgScore >= 70
                  ? "Distinction zone"
                  : data?.avgScore
                    ? "Pass zone"
                    : "No term active")}
            </p>
          </div>

          {/* Attendance */}
          <div className="bg-brand-secondary/10 rounded-3xl p-5 md:p-7 flex flex-col gap-4 border border-brand-secondary/10">
            <div className="flex items-center gap-2">
              <CalendarCheck size={17} className="text-brand-secondary shrink-0" />
              <p className="text-xs font-bold text-brand-primary/60 uppercase tracking-wide">Attendance</p>
            </div>
            {loading ? (
              <div className="h-14 w-24 rounded-xl bg-brand-primary/5 animate-pulse" />
            ) : hasAttendance ? (
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-5xl font-display font-black text-brand-primary">{data!.attendance.rate}</span>
                <span className="text-2xl font-bold text-brand-primary/40">%</span>
              </div>
            ) : (
              <div className="flex items-center h-14">
                <span className="text-3xl font-display font-black text-brand-primary/30">—</span>
              </div>
            )}
            <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/40">
              {!loading && (hasAttendance
                ? `${data!.attendance.present} of ${data!.attendance.total} sessions`
                : "No records yet")}
            </p>
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black text-brand-primary">Today&apos;s Schedule</h2>
            <button className="text-sm font-bold text-brand-secondary hover:underline">View Full</button>
          </div>
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm overflow-hidden divide-y divide-brand-primary/5">
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-primary/30">
              <Clock size={24} />
              <p className="text-token-micro font-black uppercase tracking-widest">Timetable not yet available</p>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black text-brand-primary">Recent Grades</h2>
            <a
              href="/student-previous-results"
              className="text-sm font-bold text-brand-secondary hover:underline no-underline"
            >
              View All
            </a>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm overflow-hidden">
            {loading ? (
              <div className="divide-y divide-brand-primary/5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-5">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-brand-primary/5 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-brand-primary/5 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.resultsVisible ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/5 grid place-items-center">
                  <Lock size={24} className="text-brand-primary/20" />
                </div>
                <p className="text-xs font-black text-brand-primary/30 uppercase tracking-widest text-center">
                  Results not yet published
                </p>
                <p className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest text-center max-w-xs">
                  Awaiting Principal approval for this term
                </p>
              </div>
            ) : data.grades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <BookOpen size={24} className="text-brand-primary/20" />
                <p className="text-xs font-black text-brand-primary/30 uppercase tracking-widest">No grades recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-primary/5">
                {data.grades.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4 p-5 hover:bg-brand-blush/30 transition-colors",
                      i === 0 ? "border-l-4 border-brand-secondary" : ""
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/5 grid place-items-center shrink-0">
                      <BookOpen size={18} className="text-brand-primary/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-brand-primary text-sm truncate">{s.subject}</p>
                      <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest mt-0.5">
                        Score: {s.total}%
                      </p>
                    </div>
                    <span className={cn("text-xl font-black shrink-0", gradeColor(s.grade))}>
                      {s.grade ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-primary/5">
            <h4 className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Quick Access</h4>
          </div>
          {[
            { label: "Full Results History", href: "/student-previous-results", desc: "All past terms" },
            { label: "Attendance Record", href: "/student-results-detail?view=attendance", desc: "Sessions present / absent" },
            { label: "Internal Requests", href: "/student-results-detail?view=requests", desc: "Submit & track requests" },
          ].map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="flex items-center gap-4 px-6 py-4 hover:bg-brand-blush/40 transition-colors no-underline group border-b border-brand-primary/5 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-black text-brand-primary group-hover:text-brand-secondary transition-colors">
                  {link.label}
                </p>
                <p className="text-token-micro font-bold text-brand-primary/30 uppercase tracking-widest mt-0.5">
                  {link.desc}
                </p>
              </div>
              <ChevronRight size={16} className="text-brand-primary/20 group-hover:text-brand-secondary transition-colors" />
            </a>
          ))}

          {/* Attendance progress bar */}
          {!loading && hasAttendance && (
            <div className="px-6 py-4 bg-brand-blush/20 border-t border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-2">
                Attendance Progress
              </p>
              <div className="h-2 bg-brand-primary/8 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    data!.attendance.rate >= 75 ? "bg-brand-secondary" : "bg-brand-accent"
                  )}
                  style={{ width: `${data!.attendance.rate}%` }}
                />
              </div>
              <p className={cn(
                "text-token-micro font-black uppercase tracking-widest mt-1.5",
                data!.attendance.rate >= 75 ? "text-brand-secondary" : "text-brand-accent"
              )}>
                {data!.attendance.rate}% — {data!.attendance.rate >= 75 ? "Satisfactory" : "Below recommended 75%"}
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
