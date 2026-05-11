"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { TrendingUp, CalendarCheck, BookOpen, Lock, Calendar, ChevronRight } from "lucide-react";
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
  if (g.startsWith("A")) return "text-brand-success";
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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">
                {loading ? "…" : (data?.termName ?? "No Active Term")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase leading-none">
              {firstName}'s <span className="text-brand-accent">Pod</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-brand-primary/5 rounded-2xl px-5 py-3.5 shadow-sm self-start">
            <Calendar size={18} className="text-brand-accent" />
            <span className="text-xs font-black text-brand-primary tracking-widest uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">

          {/* Avg Score / GPA */}
          <div className="card flex items-center gap-6 bg-white shadow-lg hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center shrink-0">
              <TrendingUp size={24} className="text-brand-accent" />
            </div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">Term Average</p>
              {loading ? (
                <div className="h-8 w-20 rounded bg-brand-primary/5 animate-pulse" />
              ) : data?.resultsVisible && data.avgScore !== null ? (
                <>
                  <p className="text-2xl md:text-3xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">
                    {data.avgScore}%
                  </p>
                  <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-2">
                    {data.avgScore >= 70 ? "Distinction Zone" : data.avgScore >= 50 ? "Pass Zone" : "Needs Attention"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-3xl font-display font-black text-brand-primary/30 uppercase tracking-tighter leading-none flex items-center gap-2">
                    <Lock size={20} /> N/A
                  </p>
                  <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-2">
                    {data?.resultsVisible === false ? "Results not yet published" : "No term active"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Attendance */}
          <div className="card flex items-center gap-6 bg-white shadow-lg hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center shrink-0">
              <CalendarCheck size={24} className="text-brand-accent" />
            </div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">Attendance</p>
              {loading ? (
                <div className="h-8 w-20 rounded bg-brand-primary/5 animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl md:text-3xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">
                    {data?.attendance.total ?? 0 > 0 ? `${data!.attendance.rate}%` : "—"}
                  </p>
                  <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-2">
                    {data?.attendance.total ?? 0 > 0
                      ? `${data!.attendance.present} of ${data!.attendance.total} sessions`
                      : "No records yet"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="card flex items-center gap-6 bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10 shrink-0">
              <BookOpen size={24} className="text-brand-accent" />
            </div>
            <div className="relative z-10">
              <p className="text-token-micro font-black uppercase tracking-[0.3em] opacity-50 mb-1">Subjects</p>
              {loading ? (
                <div className="h-8 w-16 rounded bg-white/10 animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl md:text-3xl font-display font-black uppercase tracking-tighter leading-none text-brand-accent">
                    {data?.gradeCount ?? 0}
                  </p>
                  <p className="text-token-micro font-black text-white/40 uppercase tracking-widest mt-2">
                    {data?.resultsVisible ? "Grades recorded" : "Results pending"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grades + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">

          {/* Academic Roster */}
          <div className="lg:col-span-2 card bg-white">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary text-xl uppercase tracking-tight">Academic Roster</h4>
              <a
                href="/student-previous-results"
                className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-accent bg-brand-primary px-4 py-3 rounded-xl no-underline hover:scale-105 transition-transform shadow-lg"
              >
                Full Transcript
              </a>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-brand-primary/5 animate-pulse" />
                ))}
              </div>
            ) : !data?.resultsVisible ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 grid place-items-center">
                  <Lock size={28} className="text-brand-primary/30" />
                </div>
                <p className="text-sm font-black text-brand-primary/40 uppercase tracking-widest text-center">
                  Results not yet published
                </p>
                <p className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest text-center max-w-xs">
                  Your grades will appear here once the Principal approves results for this term
                </p>
              </div>
            ) : data.grades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <BookOpen size={28} className="text-brand-primary/20" />
                <p className="text-sm font-black text-brand-primary/40 uppercase tracking-widest">No grades recorded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.grades.map((s, i) => (
                  <div key={i} className="p-5 bg-white/50 rounded-2xl border border-brand-primary/5 hover:border-brand-accent/20 transition-all">
                    <p className="font-black text-brand-primary text-sm mb-2 uppercase tracking-tight">{s.subject}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">{s.total}%</p>
                      <span className={cn("text-sm font-black uppercase", gradeColor(s.grade))}>
                        {s.grade ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="card bg-white flex flex-col gap-4">
            <h4 className="font-black text-brand-primary text-xl mb-4 uppercase tracking-tight">Quick Access</h4>
            {[
              { label: "Full Results History", href: "/student-previous-results", desc: "All past terms" },
              { label: "Attendance Record", href: "/student-results-detail?view=attendance", desc: "Sessions present/absent" },
              { label: "Internal Requests", href: "/student-results-detail?view=requests", desc: "Submit & track requests" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-4 p-4 rounded-2xl border border-brand-primary/5 hover:border-brand-primary/20 hover:bg-brand-primary/[0.02] transition-all no-underline group"
              >
                <div className="flex-1">
                  <p className="text-sm font-black text-brand-primary uppercase tracking-tight group-hover:text-brand-accent transition-colors">{link.label}</p>
                  <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-0.5">{link.desc}</p>
                </div>
                <ChevronRight size={16} className="text-brand-primary/20 group-hover:text-brand-accent transition-colors" />
              </a>
            ))}

            {/* Attendance mini-progress */}
            {!loading && (data?.attendance.total ?? 0) > 0 && (
              <div className="mt-4 p-5 bg-brand-primary/[0.02] rounded-2xl border border-brand-primary/5">
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-3">Attendance Progress</p>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-black text-brand-primary">{data!.attendance.present} present</span>
                  <span className="text-xs font-black text-brand-primary/40">{data!.attendance.total} total</span>
                </div>
                <div className="h-2 bg-brand-primary/8 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      data!.attendance.rate >= 75 ? "bg-brand-success" : "bg-brand-accent"
                    )}
                    style={{ width: `${data!.attendance.rate}%` }}
                  />
                </div>
                <p className={cn(
                  "text-token-micro font-black uppercase tracking-widest mt-2",
                  data!.attendance.rate >= 75 ? "text-brand-success" : "text-brand-accent"
                )}>
                  {data!.attendance.rate}% — {data!.attendance.rate >= 75 ? "Satisfactory" : "Below recommended 75%"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
