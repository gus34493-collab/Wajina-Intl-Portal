"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Wallet,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

interface OverviewData {
  studentCount: number;
  staffCount: number;
  pendingAdmissions: number;
  totalCollected: number;
  collectionRate: number;
  totalExpected: number;
  sessionName: string | null;
  weeklyRevenue: { labels: string[]; data: number[] };
  recentActivity: Array<{ id: string; action: string; detail: string | null; actor: string; createdAt: string }>;
  recentAdmissions: Array<{ applicantName: string; status: string; createdAt: string; campus: string }>;
}

const CAMPUSES = ["ALL", "PRIMARY", "SECONDARY"] as const;

const ACTION_LABELS: Record<string, string> = {
  CREATE_PAYMENT: "Payment received",
  ATTENDANCE_BULK_MARK: "Attendance marked",
  TIMETABLE_UPDATE: "Timetable updated",
  ENROLL_STUDENT: "Student enrolled",
  ADMISSION_OFFER_SENT: "Admission offer sent",
  GRADE_SUBMITTED: "Grades submitted",
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DirectorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [campus, setCampus] = useState<string>("ALL");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/director/overview${campus !== "ALL" ? `?campus=${campus}` : ""}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campus]);

  const firstName = user?.name?.split(" ")[0] ?? "Director";
  const todayLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const kpis = [
    {
      label: "Total Students",
      value: loading ? "—" : data?.studentCount?.toLocaleString() ?? "0",
      sub: `${campus === "ALL" ? "Both campuses" : campus + " campus"}`,
      trend: null,
      icon: <Users size={20} />,
      iconBg: "bg-brand-primary/8",
      iconColor: "text-brand-primary",
      alert: false,
    },
    {
      label: "Faculty & Staff",
      value: loading ? "—" : data?.staffCount?.toLocaleString() ?? "0",
      sub: "Across all departments",
      trend: null,
      icon: <GraduationCap size={20} />,
      iconBg: "bg-brand-primary/8",
      iconColor: "text-brand-primary",
      alert: false,
    },
    {
      label: "Revenue Collected",
      value: loading ? "—" : `₦${((data?.totalCollected ?? 0) / 1e6).toFixed(1)}M`,
      sub: loading ? "Loading…" : `${data?.collectionRate ?? 0}% of ₦${((data?.totalExpected ?? 0) / 1e6).toFixed(1)}M target`,
      trend: data?.collectionRate,
      icon: <Wallet size={20} />,
      iconBg: "bg-brand-secondary/10",
      iconColor: "text-brand-secondary",
      alert: false,
    },
    {
      label: "Pending Admissions",
      value: loading ? "—" : data?.pendingAdmissions?.toString() ?? "0",
      sub: (data?.pendingAdmissions ?? 0) > 0 ? "Requires attention" : "All processed",
      trend: null,
      icon: <ClipboardList size={20} />,
      iconBg: (data?.pendingAdmissions ?? 0) > 0 ? "bg-brand-accent/10" : "bg-brand-primary/8",
      iconColor: (data?.pendingAdmissions ?? 0) > 0 ? "text-brand-accent" : "text-brand-primary",
      alert: (data?.pendingAdmissions ?? 0) > 0,
    },
  ];

  const maxBar = Math.max(...(data?.weeklyRevenue.data ?? [1]), 1);

  // Merge activity: audit logs + recent admissions
  const activityFeed = [
    ...(data?.recentActivity ?? []).map((a) => ({
      id: a.id,
      text: `${ACTION_LABELS[a.action] ?? a.action}${a.detail ? ` — ${a.detail.slice(0, 60)}` : ""}`,
      actor: a.actor,
      time: a.createdAt,
      icon: "audit",
    })),
    ...(data?.recentAdmissions ?? []).map((a) => ({
      id: a.applicantName + a.createdAt,
      text: `New application — ${a.applicantName} (${a.campus})`,
      actor: "Admissions",
      time: a.createdAt,
      icon: "admission",
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 md:gap-8">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs text-brand-primary/40 font-black uppercase tracking-[0.3em] mb-1">{todayLabel}</p>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-brand-primary/50 text-sm font-medium mt-1">
              Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
            </p>
          </div>

          {/* Campus toggle */}
          <div className="flex bg-white rounded-xl p-1 border border-brand-primary/8 shadow-sm self-start sm:self-auto">
            {CAMPUSES.map((c) => (
              <button
                key={c}
                onClick={() => setCampus(c)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[0.65rem] font-black uppercase tracking-widest transition-all",
                  campus === c
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-brand-primary/50 hover:text-brand-primary"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "bg-white rounded-2xl p-5 border flex flex-col gap-3 transition-shadow hover:shadow-md",
                kpi.alert ? "border-brand-accent/30" : "border-brand-primary/8"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.6rem] font-black text-brand-primary/40 uppercase tracking-[0.25em] leading-none mb-2">
                    {kpi.label}
                  </p>
                  <p className={cn(
                    "text-2xl md:text-3xl font-display font-black tracking-tight leading-none",
                    kpi.alert ? "text-brand-accent" : "text-brand-primary"
                  )}>
                    {kpi.value}
                  </p>
                </div>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", kpi.iconBg, kpi.iconColor)}>
                  {kpi.icon}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {kpi.trend !== null && kpi.trend !== undefined ? (
                  <>
                    <TrendingUp size={11} className="text-brand-secondary" />
                    <span className="text-[0.6rem] font-black text-brand-secondary">{kpi.trend}%</span>
                    <span className="text-[0.6rem] text-brand-primary/30 font-medium">fee collection</span>
                  </>
                ) : kpi.alert ? (
                  <>
                    <AlertTriangle size={11} className="text-brand-accent" />
                    <span className="text-[0.6rem] font-black text-brand-accent">{kpi.sub}</span>
                  </>
                ) : (
                  <span className="text-[0.6rem] text-brand-primary/40 font-medium">{kpi.sub}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Main content row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Revenue chart (left 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-primary/8 p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-display font-black text-brand-primary tracking-tight">Revenue Trend</h2>
                <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5">
                  {data?.sessionName ?? "Current session"} · Weekly collections (₦M)
                </p>
              </div>
              <button
                onClick={() => router.push("/director-finances")}
                className="flex items-center gap-1 text-[0.65rem] font-black text-brand-secondary uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                View Report <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Bar chart */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-end gap-2 md:gap-3 h-44">
                {(data?.weeklyRevenue.data ?? Array(6).fill(0)).map((val, i) => {
                  const pct = maxBar > 0 ? (val / maxBar) * 100 : 0;
                  const isLatest = i === (data?.weeklyRevenue.data.length ?? 6) - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[0.55rem] font-black text-brand-primary/30">
                        {val > 0 ? `₦${val.toFixed(1)}M` : ""}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(4, pct)}%` }}
                        transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "w-full rounded-t-lg",
                          isLatest ? "bg-brand-primary" : "bg-brand-primary/20"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 px-0.5">
                {(data?.weeklyRevenue.labels ?? ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"]).map((l) => (
                  <span key={l} className="flex-1 text-center text-[0.55rem] font-black text-brand-primary/30 uppercase">{l}</span>
                ))}
              </div>
            </div>

            {/* Summary strip */}
            <div className="mt-6 pt-5 border-t border-brand-primary/5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[0.55rem] font-black text-brand-primary/30 uppercase tracking-widest">Collected</p>
                <p className="text-sm font-display font-black text-brand-primary mt-0.5">
                  ₦{((data?.totalCollected ?? 0) / 1e6).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] font-black text-brand-primary/30 uppercase tracking-widest">Target</p>
                <p className="text-sm font-display font-black text-brand-primary mt-0.5">
                  ₦{((data?.totalExpected ?? 0) / 1e6).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] font-black text-brand-primary/30 uppercase tracking-widest">Rate</p>
                <p className={cn("text-sm font-display font-black mt-0.5", (data?.collectionRate ?? 0) >= 70 ? "text-brand-secondary" : "text-brand-accent")}>
                  {data?.collectionRate ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity (right 1/3) */}
          <div className="bg-white rounded-2xl border border-brand-primary/8 p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-display font-black text-brand-primary tracking-tight">Recent Activity</h2>
              <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-brand-primary/5 rounded animate-pulse w-4/5" />
                      <div className="h-2.5 bg-brand-primary/5 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BadgeCheck size={32} className="mx-auto text-brand-primary/20 mb-2" />
                  <p className="text-[0.65rem] font-black text-brand-primary/30 uppercase tracking-widest">No recent activity</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1">
                {activityFeed.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black",
                      item.icon === "admission" ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-primary/8 text-brand-primary"
                    )}>
                      {item.icon === "admission" ? <UserCheck size={16} /> : <BadgeCheck size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-brand-primary leading-snug line-clamp-2">{item.text}</p>
                      <p className="text-[0.6rem] text-brand-primary/30 font-medium mt-0.5 uppercase tracking-widest">
                        {item.actor} · {timeAgo(item.time)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-brand-primary/5 space-y-2">
              <button
                onClick={() => router.push("/director-audit-logs")}
                className="w-full py-3 rounded-xl border border-brand-primary/10 text-[0.65rem] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                View All Activity <ChevronRight size={12} />
              </button>
              <button
                onClick={() => router.push("/admissions-dashboard")}
                className="w-full py-3 rounded-xl bg-brand-primary text-white text-[0.65rem] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Admissions Queue <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Nav strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          {[
            { label: "Finances", href: "/director-finances", color: "bg-brand-primary text-white" },
            { label: "Staff Directory", href: "/staff-directory", color: "bg-white border border-brand-primary/10 text-brand-primary" },
            { label: "Operations", href: "/operations-hub", color: "bg-white border border-brand-primary/10 text-brand-primary" },
            { label: "Audit Logs", href: "/director-audit-logs", color: "bg-white border border-brand-primary/10 text-brand-primary" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "rounded-xl py-3.5 text-[0.65rem] font-black uppercase tracking-widest transition-all hover:shadow-sm active:scale-[0.98] flex items-center justify-center gap-2",
                item.color
              )}
            >
              {item.label} <ArrowUpRight size={11} />
            </button>
          ))}
        </div>

      </div>
    </DashboardShell>
  );
}
