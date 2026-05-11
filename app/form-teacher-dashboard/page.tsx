"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  MapPin,
  UserCheck,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

interface DashboardData {
  arm: { id: string; fullName: string; className: string; studentCount: number } | null;
  attendance: { present: number; absent: number; late: number; total: number; rate: number | null; isMarked: boolean };
  subjects: Array<{ subjectId: string; name: string; className: string; hasGrades: boolean; gradeCount: number }>;
  gradeCompliance: number;
  pendingSubjectsCount: number;
  formApprovalPending: number;
  weeklyTrend: Array<{ date: string; rate: number }>;
  termName: string | null;
}

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function FormTeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/form-dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Teacher";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  const pendingItems = loading
    ? []
    : [
        {
          id: "attendance",
          label: data?.attendance.isMarked ? "Attendance marked for today" : "Mark today's attendance",
          done: !!data?.attendance.isMarked,
          href: `/form-teacher-dashboard?view=attendance`,
        },
        ...(data?.subjects
          .filter((s) => !s.hasGrades)
          .map((s) => ({
            id: `grade-${s.subjectId}`,
            label: `Submit grades — ${s.name} (${s.className})`,
            done: false,
            href: "/gradebook",
          })) ?? []),
        ...(data?.formApprovalPending
          ? [
              {
                id: "approval",
                label: `Approve ${data.formApprovalPending} submitted grade${data.formApprovalPending !== 1 ? "s" : ""} for your class`,
                done: false,
                href: "/gradebook",
              },
            ]
          : []),
      ];

  const quickActions = [
    {
      icon: <UserCheck size={22} className="text-brand-primary" />,
      label: "Attendance",
      sub: data?.attendance.isMarked ? "Marked today" : "Record roll call",
      done: data?.attendance.isMarked,
      href: `/form-teacher-dashboard?view=attendance`,
    },
    {
      icon: <GraduationCap size={22} className="text-brand-primary" />,
      label: "Grading",
      sub: loading
        ? "—"
        : `Pending: ${data?.pendingSubjectsCount ?? 0} subject${(data?.pendingSubjectsCount ?? 0) !== 1 ? "s" : ""}`,
      done: (data?.pendingSubjectsCount ?? 1) === 0,
      href: "/gradebook",
    },
    {
      icon: <Users size={22} className="text-brand-primary" />,
      label: "My Class",
      sub: loading ? "—" : `${data?.arm?.studentCount ?? 0} students`,
      done: null,
      href: "/gradebook",
    },
    {
      icon: <ClipboardCheck size={22} className="text-brand-primary" />,
      label: "Approvals",
      sub: loading ? "—" : `${data?.formApprovalPending ?? 0} pending`,
      done: (data?.formApprovalPending ?? 1) === 0,
      href: "/gradebook",
    },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-7 max-w-2xl mx-auto">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pt-2"
        >
          <p className="text-sm text-brand-primary/50 font-medium mb-1">{todayLabel}</p>
          <h1 className="text-[2rem] leading-tight font-display font-black text-brand-primary tracking-tight">
            {greeting}, {firstName}.
          </h1>
          {data?.arm ? (
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Form class:{" "}
              <span className="font-black text-brand-primary">{data.arm.fullName}</span>
              {data.termName && (
                <span className="text-brand-primary/40"> · {data.termName}</span>
              )}
            </p>
          ) : (
            <p className="text-brand-primary/50 text-sm mt-1">Here is your overview for today.</p>
          )}
        </motion.div>

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-3">
            Quick Actions
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
            {quickActions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                onClick={() => router.push(action.href)}
                className={cn(
                  "min-w-[148px] snap-start flex-shrink-0 bg-white rounded-2xl p-5 text-left border transition-all hover:shadow-md active:scale-[0.98]",
                  action.done === true
                    ? "border-brand-success/20 bg-brand-success/5"
                    : action.done === false
                    ? "border-brand-accent/20"
                    : "border-brand-primary/8"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center mb-3">
                  {action.icon}
                </div>
                <p className="text-sm font-black text-brand-primary leading-none mb-1">{action.label}</p>
                <p
                  className={cn(
                    "text-[0.65rem] font-semibold",
                    action.done === true ? "text-brand-success" : "text-brand-primary/40"
                  )}
                >
                  {loading ? "Loading…" : action.sub}
                </p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── Attendance Snapshot ── */}
        {(loading || data?.arm) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">
                Today&apos;s Attendance
              </h2>
              {data?.attendance.rate !== null && (
                <span
                  className={cn(
                    "text-[0.65rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                    (data?.attendance.rate ?? 0) >= 85
                      ? "bg-brand-success/10 text-brand-success"
                      : "bg-brand-accent/10 text-brand-accent"
                  )}
                >
                  {data?.attendance.rate}%
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-28 rounded-2xl bg-white border border-brand-primary/8 animate-pulse" />
            ) : !data?.attendance.isMarked ? (
              <div className="bg-white border border-brand-accent/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-brand-accent shrink-0" />
                  <div>
                    <p className="text-sm font-black text-brand-primary">Attendance not recorded</p>
                    <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5 uppercase tracking-widest">
                      Tap to mark roll call
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/form-teacher-dashboard?view=attendance`)}
                  className="shrink-0 bg-brand-primary text-white text-[0.65rem] font-black uppercase tracking-widest px-4 py-2 rounded-xl"
                >
                  Mark Now
                </button>
              </div>
            ) : (
              <div className="bg-white border border-brand-primary/8 rounded-2xl p-5">
                <div className="grid grid-cols-3 gap-3">
                  <AttendancePill label="Present" value={data.attendance.present} color="success" />
                  <AttendancePill label="Absent" value={data.attendance.absent} color="error" />
                  <AttendancePill label="Late" value={data.attendance.late} color="accent" />
                </div>
                {data.weeklyTrend.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-brand-primary/5">
                    <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest mb-2">
                      7-Day Trend
                    </p>
                    <div className="flex items-end gap-1.5 h-10">
                      {data.weeklyTrend.map((d, i) => (
                        <div
                          key={i}
                          title={`${d.date}: ${d.rate}%`}
                          className="flex-1 rounded-sm bg-brand-success/10 relative overflow-hidden"
                          style={{ height: "100%" }}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-sm bg-brand-success/60"
                            style={{ height: `${Math.max(4, d.rate)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Subject Grading Status ── */}
        {(loading || (data?.subjects && data.subjects.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">
                My Subjects
              </h2>
              <button
                onClick={() => router.push("/gradebook")}
                className="text-[0.65rem] font-black text-brand-success uppercase tracking-widest"
              >
                Open Gradebook
              </button>
            </div>

            <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-white border border-brand-primary/8 animate-pulse"
                    />
                  ))
                : data?.subjects.map((s) => (
                    <motion.button
                      key={s.subjectId}
                      variants={ITEM}
                      onClick={() => router.push("/gradebook")}
                      className="w-full bg-white border border-brand-primary/8 rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all active:scale-[0.99] text-left"
                    >
                      <div
                        className={cn(
                          "w-1 self-stretch rounded-full shrink-0",
                          s.hasGrades ? "bg-brand-success" : "bg-brand-accent"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-brand-primary leading-none">{s.name}</p>
                        <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5 flex items-center gap-1">
                          <MapPin size={9} />
                          {s.className}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[0.6rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0",
                          s.hasGrades
                            ? "bg-brand-success/10 text-brand-success"
                            : "bg-brand-accent/10 text-brand-accent"
                        )}
                      >
                        {s.hasGrades ? `${s.gradeCount} entries` : "Pending"}
                      </span>
                      <ChevronRight size={14} className="text-brand-primary/20 shrink-0" />
                    </motion.button>
                  ))}

              {!loading && data?.subjects.length === 0 && (
                <div className="bg-white border border-brand-primary/8 rounded-2xl p-6 text-center">
                  <BookOpen size={28} className="mx-auto text-brand-primary/20 mb-2" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">
                    No subjects assigned yet
                  </p>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* ── Pending Items (Tasks) ── */}
        <section>
          <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-3">
            Pending Items
          </h2>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-2xl bg-white border border-brand-primary/8 animate-pulse"
                />
              ))}
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="bg-white border border-brand-success/20 rounded-2xl p-6 flex items-center gap-4">
              <CheckCircle2 size={28} className="text-brand-success shrink-0" />
              <div>
                <p className="text-sm font-black text-brand-primary">All clear!</p>
                <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5">
                  No pending items for today.
                </p>
              </div>
            </div>
          ) : (
            <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {pendingItems.map((item) => (
                <motion.button
                  key={item.id}
                  variants={ITEM}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full bg-white border rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all active:scale-[0.99] text-left",
                    item.done ? "border-brand-success/20" : "border-brand-primary/8"
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 size={20} className="text-brand-success shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-brand-primary/20 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm font-semibold",
                      item.done ? "line-through text-brand-primary/30" : "text-brand-primary"
                    )}
                  >
                    {item.label}
                  </span>
                  <ChevronRight size={14} className="text-brand-primary/20 shrink-0" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Grading Compliance Footer ── */}
        {!loading && data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-brand-primary rounded-2xl p-6 flex items-center justify-between gap-4 mb-4"
          >
            <div>
              <p className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.3em] mb-1">
                Grade Compliance
              </p>
              <p className="text-2xl font-display font-black text-white italic leading-none">
                {data.gradeCompliance}%
              </p>
              <p className="text-[0.65rem] text-brand-secondary font-medium mt-1">
                {data.subjects.filter((s) => s.hasGrades).length} of {data.subjects.length} subjects submitted
              </p>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <BarChart3 size={22} className="text-brand-secondary absolute" />
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#6ab547"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 28 * (data.gradeCompliance / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>
        )}

      </div>
    </DashboardShell>
  );
}

function AttendancePill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "success" | "error" | "accent";
}) {
  const colorMap = {
    success: "bg-brand-success/10 text-brand-success",
    error: "bg-red-50 text-red-500",
    accent: "bg-brand-accent/10 text-brand-accent",
  };
  return (
    <div className={cn("rounded-xl p-3 text-center", colorMap[color])}>
      <p className="text-xl font-display font-black leading-none">{value}</p>
      <p className="text-[0.6rem] font-black uppercase tracking-widest mt-1 opacity-80">{label}</p>
    </div>
  );
}
