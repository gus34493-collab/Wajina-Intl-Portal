"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { Clock, Presentation, ChevronRight, Upload, Table, Calendar, Users, CheckCircle2, AlertCircle, UserX } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

type Period = "DAY" | "WEEK" | "MONTH" | "TERM";

interface AttSummary {
  present: number; absent: number; late: number; total: number; rate: number | null;
}

function AttendanceView({ armId }: { armId?: string }) {
  const [period, setPeriod] = useState<Period>("WEEK");
  const [summary, setSummary] = useState<AttSummary | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { campus } = useAuth();

  useEffect(() => {
    setLoading(true);
    const periodParam = period.toLowerCase();
    const params = new URLSearchParams({ period: periodParam });
    if (armId) params.set("armId", armId);

    Promise.all([
      fetch(`/api/attendance/summary?${params}`).then((r) => r.json()),
      fetch(`/api/attendance?${params}&limit=30`).then((r) => r.json()),
    ])
      .then(([sum, recs]) => {
        setSummary(sum);
        setRecords(recs.records ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, armId]);

  const periodLabel: Record<Period, string> = {
    DAY: "Today",
    WEEK: "Last 7 Days",
    MONTH: "This Month",
    TERM: "This Term",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black text-brand-primary tracking-tight uppercase">
            Attendance <span className="text-brand-accent">Records</span>
          </h2>
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mt-1">
            {periodLabel[period]} · {campus || "Campus"}
          </p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 bg-brand-primary/5 rounded-2xl p-1">
          {(["DAY", "WEEK", "MONTH", "TERM"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all",
                period === p
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-brand-primary/40 hover:text-brand-primary/70"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-3xl bg-white border border-brand-primary/8 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Attendance Rate", value: summary?.rate !== null && summary?.rate !== undefined ? `${summary.rate}%` : "—", icon: <CheckCircle2 size={18} />, color: (summary?.rate ?? 0) >= 75 ? "text-brand-success" : "text-brand-accent", bg: (summary?.rate ?? 0) >= 75 ? "bg-brand-success/5 border-brand-success/20" : "bg-brand-accent/5 border-brand-accent/20" },
            { label: "Present",         value: summary?.present ?? 0,  icon: <CheckCircle2 size={18} />, color: "text-brand-success", bg: "bg-white border-brand-primary/8" },
            { label: "Absent",          value: summary?.absent ?? 0,   icon: <UserX size={18} />,        color: "text-red-500",       bg: "bg-white border-brand-primary/8" },
            { label: "Late",            value: summary?.late ?? 0,     icon: <Clock size={18} />,        color: "text-brand-accent",  bg: "bg-white border-brand-primary/8" },
          ].map((card) => (
            <div key={card.label} className={cn("rounded-3xl p-5 border flex flex-col gap-3", card.bg)}>
              <div className="flex justify-between items-center">
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">{card.label}</p>
                <div className={cn("w-8 h-8 rounded-xl bg-brand-primary/5 grid place-items-center", card.color)}>
                  {card.icon}
                </div>
              </div>
              <p className={cn("text-3xl font-display font-black tracking-tighter", card.color)}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rate progress bar */}
      {!loading && summary && (
        <div className="bg-white border border-brand-primary/8 rounded-2xl p-5">
          <div className="flex justify-between mb-2">
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Collection Rate</p>
            <p className={cn("text-token-micro font-black uppercase tracking-widest", (summary.rate ?? 0) >= 75 ? "text-brand-success" : "text-brand-accent")}>
              {(summary.rate ?? 0) >= 75 ? "Satisfactory" : "Below 75% Target"}
            </p>
          </div>
          <div className="h-2.5 bg-brand-primary/8 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", (summary.rate ?? 0) >= 75 ? "bg-brand-success" : "bg-brand-accent")}
              style={{ width: `${summary.rate ?? 0}%` }}
            />
          </div>
          <p className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest mt-2">
            {summary.present} present · {summary.absent} absent · {summary.late} late · {summary.total} total records
          </p>
        </div>
      )}

      {/* Records table */}
      <div className="bg-white border border-brand-primary/8 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-primary/5 flex justify-between items-center">
          <h4 className="font-black text-brand-primary text-sm uppercase tracking-widest">Recent Records</h4>
          <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">{periodLabel[period]}</span>
        </div>

        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-xl bg-brand-primary/5 animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-brand-primary/20" />
            <p className="text-xs font-black text-brand-primary/30 uppercase tracking-widest">No attendance records for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-primary/5">
            {records.map((rec) => (
              <div key={rec.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-brand-primary truncate">{rec.student?.name ?? "—"}</p>
                  <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-0.5">
                    {rec.student?.enrolledArm?.fullName ?? "—"} · {new Date(rec.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })} · {rec.session}
                  </p>
                </div>
                <span className={cn(
                  "text-[0.6rem] font-black uppercase tracking-widest px-3 py-1 rounded-full shrink-0",
                  rec.status === "PRESENT" ? "bg-brand-success/10 text-brand-success" :
                  rec.status === "LATE"    ? "bg-brand-accent/10 text-brand-accent" :
                                             "bg-red-50 text-red-500"
                )}>
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherDashboardContent() {
  const { campus } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");

  const [gradingFeed, setGradingFeed] = useState<any[]>([]);
  const [stats, setStats] = useState({ upcoming: "--", classesToday: "--", compliance: "0%" });
  const [armId, setArmId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, armRes] = await Promise.all([
          fetch("/api/academic/teacher-stats"),
          fetch("/api/structure/arms?mine=true").catch(() => null),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setStats({
            upcoming: d.upcomingGrades || "--",
            classesToday: d.classesToday || "--",
            compliance: d.compliance ? `${d.compliance}%` : "0%",
          });
          setGradingFeed(d.recentGrading || []);
        }
        if (armRes?.ok) {
          const arms = await armRes.json();
          setArmId(arms?.[0]?.id);
        }
      } catch (err) {
        console.error("Teacher Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (view === "attendance") {
    return (
      <DashboardShell>
        <div className="flex flex-col gap-6">
          <button
            onClick={() => router.push("/teacher-dashboard")}
            className="self-start text-token-micro font-black text-brand-primary/40 uppercase tracking-widest flex items-center gap-1.5 hover:text-brand-primary transition-colors"
          >
            ← Back to Dashboard
          </button>
          <AttendanceView armId={armId} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} FACULTY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase leading-none">
              My <span className="text-brand-accent">Workspace</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-brand-primary/5 rounded-2xl px-5 py-3.5 shadow-sm self-start pointer-events-auto">
            <Calendar size={18} className="text-brand-accent" />
            <span className="text-xs font-black text-brand-primary tracking-widest uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="card flex flex-col items-center justify-center text-center p-12 bg-white">
            <h3 className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] self-start mb-10">GRADING PROGRESS</h3>
            <div className="w-48 h-48 rounded-full border-8 border-brand-primary/5 flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-2 rounded-full border-4 border-brand-accent/20" />
              <span className="text-4xl font-display font-black text-brand-primary">{stats.compliance}</span>
            </div>
            <p className="text-token-micro font-black text-brand-accent mt-10 uppercase tracking-widest">Term Compliance</p>
          </div>

          <div className="flex flex-col gap-5 md:gap-8">
            <div className="card flex-1 flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                <Clock size={24} className="text-brand-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">MY SUBJECTS</p>
                <p className="text-4xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">{stats.upcoming}</p>
              </div>
            </div>
            <div className="card flex-1 flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                <Presentation size={24} className="text-brand-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">CLASSES TODAY</p>
                <p className="text-4xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">{stats.classesToday}</p>
              </div>
            </div>
          </div>

          {/* Attendance quick access */}
          <div className="card flex flex-col bg-white p-10 gap-6">
            <h3 className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">ATTENDANCE</h3>
            <button
              onClick={() => router.push("/teacher-dashboard?view=attendance")}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-brand-primary/[0.02] rounded-2xl border border-brand-primary/8 hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all group"
            >
              <Users size={32} className="text-brand-primary/20 group-hover:text-brand-primary/50 transition-colors" />
              <div className="text-center">
                <p className="text-sm font-black text-brand-primary uppercase tracking-widest">View Records</p>
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-1">Filter by day / week / month</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
          <div className="card flex flex-col">
            <h4 className="font-black text-brand-primary mb-8">Recent Grading Activity</h4>
            <div className="flex flex-col gap-4">
              {gradingFeed.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <Clock size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No grading activity yet.</p>
                </div>
              ) : (
                gradingFeed.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{g.subject} — {g.className}</p>
                      <p className="text-token-micro font-bold text-brand-primary/50">{g.studentsGraded} · {g.date}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-base font-black uppercase tracking-[0.2em] mb-10 relative z-10">Quick Access</h4>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <a href="/gradebook" className="bg-white/5 p-8 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 group/btn">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center mb-6 group-hover/btn:bg-brand-accent group-hover/btn:text-brand-primary transition-colors">
                  <Table size={24} className="text-brand-accent group-hover/btn:text-brand-primary" />
                </div>
                <span className="font-black text-xs block uppercase tracking-widest text-white/60 group-hover/btn:text-white transition-colors">Master Gradebook</span>
              </a>
              <button
                onClick={() => router.push("/teacher-dashboard?view=attendance")}
                className="bg-white/5 p-8 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 group/btn text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center mb-6 group-hover/btn:bg-brand-accent group-hover/btn:text-brand-primary transition-colors">
                  <Users size={24} className="text-brand-accent group-hover/btn:text-brand-primary" />
                </div>
                <span className="font-black text-xs block uppercase tracking-widest text-white/60 group-hover/btn:text-white transition-colors">Attendance Records</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<DashboardShell><div className="h-96 animate-pulse rounded-3xl bg-brand-primary/5" /></DashboardShell>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
