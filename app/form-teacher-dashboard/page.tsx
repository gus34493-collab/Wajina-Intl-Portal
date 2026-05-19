"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ClipboardCheck, BookOpen, CheckCircle2, ChevronRight,
  AlertCircle, MapPin, UserCheck, BarChart3, GraduationCap,
  FileText, Upload, X, Loader2, Sun, Sunset,
  MessageSquare, ArrowUpRight, CheckCheck, XCircle, Clock,
} from "lucide-react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionAtt {
  present: number; absent: number; late: number; total: number;
  rate: number | null; isMarked: boolean;
}

interface DashboardData {
  arm: { id: string; fullName: string; className: string; studentCount: number } | null;
  morningAttendance: SessionAtt;
  closingAttendance: SessionAtt;
  subjects: Array<{ subjectId: string; name: string; className: string; hasGrades: boolean; gradeCount: number }>;
  gradeCompliance: number;
  pendingSubjectsCount: number;
  formApprovalPending: number;
  weeklyTrend: Array<{ date: string; rate: number }>;
  termName: string | null;
  recentLessonPlans: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

export default function FormTeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLessonPlanForm, setShowLessonPlanForm] = useState(false);
  const [lpTitle, setLpTitle] = useState("");
  const [lpDesc, setLpDesc] = useState("");
  const [lpSubmitting, setLpSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/teacher/form-dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const [inbox, setInbox] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [respondText, setRespondText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/requests?receivedOnly=true&status=PENDING&level=K1&limit=10")
      .then((r) => r.json())
      .then((d) => setInbox(d.requests ?? []))
      .catch(console.error)
      .finally(() => setInboxLoading(false));
  }, []);

  async function handleRequestAction(id: string, action: "approve" | "deny" | "escalate" | "respond", feedback?: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: feedback ?? undefined }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast.success(action === "escalate" ? "Escalated to Head Teacher" : action === "respond" ? "Response sent" : `Request ${action}d`);
      setInbox((prev) => action === "respond" ? prev : prev.filter((r) => r.id !== id));
      setRespondingTo(null);
      setRespondText("");
    } catch {
      toast.error("Failed to process request. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  const [attPeriod, setAttPeriod] = useState<"DAY" | "WEEK" | "MONTH" | "TERM">("DAY");
  const [periodStats, setPeriodStats] = useState<{ present: number; absent: number; late: number; total: number; rate: number | null } | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  useEffect(() => {
    if (attPeriod === "DAY" || !data?.arm) return;
    const armId = data.arm.id;
    const termId = data.termName ? undefined : undefined; // termId not in arm, skip for now
    const periodParam = attPeriod.toLowerCase();
    const url = `/api/attendance/summary?armId=${armId}&period=${periodParam}${attPeriod === "TERM" && termId ? `&termId=${termId}` : ""}`;
    setPeriodLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then(setPeriodStats)
      .catch(console.error)
      .finally(() => setPeriodLoading(false));
  }, [attPeriod, data?.arm]);

  const firstName = user?.name?.split(" ")[0] ?? "Teacher";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  const handleSubmitLessonPlan = async () => {
    if (!lpTitle.trim() || !lpDesc.trim()) {
      toast.error("Please fill in the title and description.");
      return;
    }
    setLpSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: lpTitle, description: lpDesc, level: "K1", category: "LESSON_PLAN" }),
      });
      if (!res.ok) throw new Error("Submit failed");
      toast.success("Lesson plan submitted for review.");
      setLpTitle(""); setLpDesc(""); setShowLessonPlanForm(false);
      fetchData();
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLpSubmitting(false);
    }
  };

  const pendingItems = loading ? [] : [
    { id: "morning", label: data?.morningAttendance.isMarked ? "Morning attendance marked" : "Mark morning attendance", done: !!data?.morningAttendance.isMarked, href: `/form-teacher-dashboard?view=attendance` },
    { id: "closing", label: data?.closingAttendance.isMarked ? "Closing attendance marked" : "Mark closing attendance", done: !!data?.closingAttendance.isMarked, href: `/form-teacher-dashboard?view=attendance` },
    ...(data?.subjects.filter((s) => !s.hasGrades).map((s) => ({ id: `grade-${s.subjectId}`, label: `Submit grades — ${s.name} (${s.className})`, done: false, href: "/gradebook" })) ?? []),
    ...(data?.formApprovalPending ? [{ id: "approval", label: `Approve ${data.formApprovalPending} submitted grade${data.formApprovalPending !== 1 ? "s" : ""} for your class`, done: false, href: "/gradebook" }] : []),
  ];

  const quickActions = [
    { icon: <Sun size={20} className="text-brand-primary" />, label: "Morning Roll", sub: data?.morningAttendance.isMarked ? `${data.morningAttendance.present} present` : "Not marked", done: data?.morningAttendance.isMarked, href: `/form-teacher-dashboard?view=attendance` },
    { icon: <Sunset size={20} className="text-brand-primary" />, label: "Closing Roll", sub: data?.closingAttendance.isMarked ? `${data.closingAttendance.present} present` : "Not marked", done: data?.closingAttendance.isMarked, href: `/form-teacher-dashboard?view=attendance` },
    { icon: <GraduationCap size={20} className="text-brand-primary" />, label: "Grading", sub: loading ? "—" : `${data?.pendingSubjectsCount ?? 0} pending`, done: (data?.pendingSubjectsCount ?? 1) === 0, href: "/gradebook" },
    { icon: <ClipboardCheck size={20} className="text-brand-primary" />, label: "Approvals", sub: loading ? "—" : `${data?.formApprovalPending ?? 0} pending`, done: (data?.formApprovalPending ?? 1) === 0, href: "/gradebook" },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-7 max-w-2xl mx-auto">

        {/* ── Greeting ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-2">
          <p className="text-sm text-brand-primary/50 font-medium mb-1">{todayLabel}</p>
          <h1 className="text-[2rem] leading-tight font-display font-black text-brand-primary tracking-tight">
            {greeting}, {firstName}.
          </h1>
          {data?.arm ? (
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Form class: <span className="font-black text-brand-primary">{data.arm.fullName}</span>
              {data.termName && <span className="text-brand-primary/40"> · {data.termName}</span>}
            </p>
          ) : (
            <p className="text-brand-primary/50 text-sm mt-1">Here is your overview for today.</p>
          )}
        </motion.div>

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-3">Quick Actions</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x">
            {quickActions.map((action, i) => (
              <motion.button key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                onClick={() => router.push(action.href)}
                className={cn("min-w-[140px] snap-start flex-shrink-0 bg-white rounded-2xl p-5 text-left border transition-all hover:shadow-md active:scale-[0.98]",
                  action.done === true ? "border-brand-success/20 bg-brand-success/5" : action.done === false ? "border-brand-accent/20" : "border-brand-primary/8"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center mb-3">{action.icon}</div>
                <p className="text-sm font-black text-brand-primary leading-none mb-1">{action.label}</p>
                <p className={cn("text-[0.65rem] font-semibold", action.done === true ? "text-brand-success" : "text-brand-primary/40")}>
                  {loading ? "Loading…" : action.sub}
                </p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── Attendance ── */}
        {(loading || data?.arm) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">Attendance</h2>
              {/* Period filter tabs */}
              <div className="flex gap-1 bg-brand-primary/5 rounded-xl p-1">
                {(["DAY", "WEEK", "MONTH", "TERM"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setAttPeriod(p); if (p === "DAY") setPeriodStats(null); }}
                    className={cn(
                      "text-[0.6rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all",
                      attPeriod === p
                        ? "bg-white text-brand-primary shadow-sm"
                        : "text-brand-primary/40 hover:text-brand-primary/70"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* DAY view: morning + closing cards */}
            {attPeriod === "DAY" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Morning Register", session: "MORNING", att: data?.morningAttendance, icon: <Sun size={15} className="text-brand-accent" /> },
                    { label: "Closing Register", session: "CLOSING", att: data?.closingAttendance, icon: <Sunset size={15} className="text-brand-primary/60" /> },
                  ].map(({ label, session, att, icon }) => (
                    loading ? (
                      <div key={session} className="h-28 rounded-2xl bg-white border border-brand-primary/8 animate-pulse" />
                    ) : !att?.isMarked ? (
                      <div key={session} className="bg-white border border-brand-accent/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {icon}
                          <div>
                            <p className="text-sm font-black text-brand-primary">{label}</p>
                            <p className="text-[0.6rem] text-brand-primary/40 font-medium uppercase tracking-widest">Not marked yet</p>
                          </div>
                        </div>
                        <button onClick={() => router.push(`/form-teacher-dashboard?view=attendance&session=${session}`)}
                          className="shrink-0 bg-brand-primary text-white text-[0.6rem] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                          Mark
                        </button>
                      </div>
                    ) : (
                      <div key={session} className="bg-white border border-brand-success/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {icon}
                          <p className="text-[0.65rem] font-black text-brand-primary/60 uppercase tracking-widest">{label}</p>
                          <span className="ml-auto text-[0.6rem] font-black bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-full">{att.rate}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[["Present", att.present, "text-brand-success"], ["Absent", att.absent, "text-red-500"], ["Late", att.late, "text-brand-accent"]].map(([lbl, val, col]) => (
                            <div key={lbl as string} className="text-center">
                              <p className={cn("text-lg font-display font-black", col)}>{val as number}</p>
                              <p className="text-[0.55rem] font-black text-brand-primary/30 uppercase">{lbl as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {/* Weekly trend */}
                {!loading && (data?.weeklyTrend?.length ?? 0) > 1 && (
                  <div className="mt-3 bg-white border border-brand-primary/8 rounded-2xl p-4">
                    <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest mb-2">7-Day Morning Trend</p>
                    <div className="flex items-end gap-1.5 h-8">
                      {data!.weeklyTrend.map((d, i) => (
                        <div key={i} title={`${d.date}: ${d.rate}%`} className="flex-1 rounded-sm bg-brand-success/10 relative overflow-hidden h-full">
                          <div className="absolute bottom-0 left-0 right-0 rounded-sm bg-brand-success/60" style={{ height: `${Math.max(4, d.rate)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* WEEK / MONTH / TERM view: aggregated summary */}
            {attPeriod !== "DAY" && (
              <div className="bg-white border border-brand-primary/8 rounded-2xl p-5">
                {periodLoading ? (
                  <div className="flex flex-col gap-3">
                    <div className="h-4 w-32 rounded bg-brand-primary/5 animate-pulse" />
                    <div className="grid grid-cols-4 gap-3">
                      {[1,2,3,4].map((i) => <div key={i} className="h-16 rounded-xl bg-brand-primary/5 animate-pulse" />)}
                    </div>
                  </div>
                ) : periodStats ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[0.65rem] font-black text-brand-primary/40 uppercase tracking-widest">
                        {attPeriod === "WEEK" ? "Last 7 Days" : attPeriod === "MONTH" ? "This Month" : "This Term"} · All Sessions
                      </p>
                      <div className={cn(
                        "text-sm font-display font-black px-3 py-1 rounded-xl",
                        (periodStats.rate ?? 0) >= 75 ? "bg-brand-success/10 text-brand-success" : "bg-brand-accent/10 text-brand-accent"
                      )}>
                        {periodStats.rate !== null ? `${periodStats.rate}%` : "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        ["Present", periodStats.present, "text-brand-success", "bg-brand-success/8"],
                        ["Absent",  periodStats.absent,  "text-red-500",       "bg-red-50"],
                        ["Late",    periodStats.late,    "text-brand-accent",  "bg-brand-accent/8"],
                        ["Total",   periodStats.total,   "text-brand-primary", "bg-brand-primary/5"],
                      ].map(([lbl, val, col, bg]) => (
                        <div key={lbl as string} className={cn("rounded-xl p-3 text-center", bg as string)}>
                          <p className={cn("text-xl font-display font-black", col as string)}>{val as number}</p>
                          <p className="text-[0.55rem] font-black text-brand-primary/30 uppercase tracking-wide mt-0.5">{lbl as string}</p>
                        </div>
                      ))}
                    </div>
                    {/* Rate bar */}
                    {periodStats.total > 0 && (
                      <div>
                        <div className="h-2 bg-brand-primary/8 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", (periodStats.rate ?? 0) >= 75 ? "bg-brand-success" : "bg-brand-accent")}
                            style={{ width: `${periodStats.rate ?? 0}%` }}
                          />
                        </div>
                        <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest mt-1.5">
                          {(periodStats.rate ?? 0) >= 75 ? "Satisfactory attendance" : "Below 75% threshold"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[0.65rem] font-black text-brand-primary/30 uppercase tracking-widest text-center py-6">
                    {data?.arm ? "Loading period data…" : "No class assigned"}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── My Subjects ── */}
        {(loading || (data?.subjects?.length ?? 0) > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">My Subjects</h2>
              <button onClick={() => router.push("/gradebook")} className="text-[0.65rem] font-black text-brand-success uppercase tracking-widest">Open Gradebook</button>
            </div>
            <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white border border-brand-primary/8 animate-pulse" />) :
                data?.subjects.map((s) => (
                  <motion.button key={s.subjectId} variants={ITEM} onClick={() => router.push("/gradebook")}
                    className="w-full bg-white border border-brand-primary/8 rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all active:scale-[0.99] text-left">
                    <div className={cn("w-1 self-stretch rounded-full shrink-0", s.hasGrades ? "bg-brand-success" : "bg-brand-accent")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-brand-primary leading-none">{s.name}</p>
                      <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5 flex items-center gap-1"><MapPin size={9} />{s.className}</p>
                    </div>
                    <span className={cn("text-[0.6rem] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0", s.hasGrades ? "bg-brand-success/10 text-brand-success" : "bg-brand-accent/10 text-brand-accent")}>
                      {s.hasGrades ? `${s.gradeCount} entries` : "Pending"}
                    </span>
                    <ChevronRight size={14} className="text-brand-primary/20 shrink-0" />
                  </motion.button>
                ))}
              {!loading && data?.subjects.length === 0 && (
                <div className="bg-white border border-brand-primary/8 rounded-2xl p-6 text-center">
                  <BookOpen size={28} className="mx-auto text-brand-primary/20 mb-2" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No subjects assigned yet</p>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* ── Lesson Plans ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">Lesson Plans</h2>
            <button onClick={() => setShowLessonPlanForm((v) => !v)}
              className="flex items-center gap-1.5 text-[0.65rem] font-black text-brand-primary bg-white border border-brand-primary/10 px-3 py-1.5 rounded-lg hover:bg-brand-primary/5 transition-colors">
              <Upload size={11} /> Submit Plan
            </button>
          </div>

          <AnimatePresence>
            {showLessonPlanForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3">
                <div className="bg-white border border-brand-primary/10 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-brand-primary uppercase tracking-widest">New Lesson Plan</p>
                    <button onClick={() => setShowLessonPlanForm(false)} className="text-brand-primary/30 hover:text-brand-primary">
                      <X size={16} />
                    </button>
                  </div>
                  <input value={lpTitle} onChange={(e) => setLpTitle(e.target.value)} placeholder="Title (e.g. Week 4 — Mathematics)"
                    className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary outline-none focus:border-brand-primary/30 bg-brand-primary/3 placeholder:text-brand-primary/20" />
                  <textarea value={lpDesc} onChange={(e) => setLpDesc(e.target.value)} placeholder="Objectives, activities, and notes for review…"
                    rows={4}
                    className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary outline-none focus:border-brand-primary/30 bg-brand-primary/3 placeholder:text-brand-primary/20 resize-none" />
                  <button onClick={handleSubmitLessonPlan} disabled={lpSubmitting}
                    className="bg-brand-primary text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {lpSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit for Review"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && data?.recentLessonPlans && data.recentLessonPlans.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.recentLessonPlans.map((lp) => (
                <div key={lp.id} className="bg-white border border-brand-primary/8 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <FileText size={16} className="text-brand-primary/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-primary truncate">{lp.title}</p>
                    <p className="text-[0.6rem] text-brand-primary/30 font-medium uppercase tracking-widest mt-0.5">
                      {new Date(lp.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={cn("text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    lp.status === "RESOLVED" ? "bg-brand-success/10 text-brand-success" : "bg-brand-accent/10 text-brand-accent")}>
                    {lp.status === "RESOLVED" ? "Approved" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="bg-white border border-dashed border-brand-primary/10 rounded-2xl p-6 text-center">
              <FileText size={24} className="mx-auto text-brand-primary/20 mb-2" />
              <p className="text-[0.65rem] font-black text-brand-primary/30 uppercase tracking-widest">No lesson plans submitted yet</p>
            </div>
          )}
        </section>

        {/* ── Parent Requests Inbox ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em]">
              Parent Requests
              {!inboxLoading && inbox.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-accent text-white text-[0.55rem] font-black">
                  {inbox.length}
                </span>
              )}
            </h2>
          </div>

          {inboxLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white border border-brand-primary/8 animate-pulse" />)}
            </div>
          ) : inbox.length === 0 ? (
            <div className="bg-white border border-brand-primary/8 rounded-2xl p-6 flex items-center gap-4">
              <CheckCheck size={22} className="text-brand-secondary shrink-0" />
              <div>
                <p className="text-sm font-black text-brand-primary">Inbox clear</p>
                <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5">No pending parent requests.</p>
              </div>
            </div>
          ) : (
            <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-3">
              {inbox.map((req) => (
                <motion.div key={req.id} variants={ITEM} className="bg-white border border-brand-primary/8 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3.5 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare size={15} className="text-brand-primary/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-brand-primary leading-snug truncate">{req.title}</p>
                      <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest mt-0.5">
                        From: {req.sender?.name ?? "Parent"} · {new Date(req.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[0.6rem] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      <Clock size={10} /> Pending
                    </span>
                  </div>

                  {respondingTo === req.id ? (
                    <div className="px-4 pb-4 flex flex-col gap-2 border-t border-brand-primary/5">
                      <textarea
                        value={respondText}
                        onChange={(e) => setRespondText(e.target.value)}
                        placeholder="Type your response…"
                        rows={3}
                        className="w-full mt-3 border border-brand-primary/10 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary outline-none focus:border-brand-primary/30 bg-brand-primary/3 placeholder:text-brand-primary/20 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={!respondText.trim() || actionLoading}
                          onClick={() => handleRequestAction(req.id, "respond", respondText)}
                          className="flex-1 bg-brand-primary text-white text-[0.6rem] font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                          Send Response
                        </button>
                        <button
                          onClick={() => { setRespondingTo(null); setRespondText(""); }}
                          className="px-3 py-2.5 border border-brand-primary/10 rounded-xl text-brand-primary/50 hover:text-brand-primary transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-3.5 flex gap-2 border-t border-brand-primary/5 pt-3">
                      <button
                        onClick={() => setRespondingTo(req.id)}
                        className="flex items-center gap-1.5 text-[0.6rem] font-black text-brand-primary bg-brand-primary/5 border border-brand-primary/10 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-brand-primary/10 transition-colors"
                      >
                        <MessageSquare size={11} /> Respond
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRequestAction(req.id, "approve")}
                        className="flex items-center gap-1.5 text-[0.6rem] font-black text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-brand-secondary/20 transition-colors disabled:opacity-40"
                      >
                        <CheckCheck size={11} /> Resolve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRequestAction(req.id, "escalate")}
                        className="flex items-center gap-1.5 text-[0.6rem] font-black text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-orange-100 transition-colors disabled:opacity-40 ml-auto"
                      >
                        <ArrowUpRight size={11} /> Escalate
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Pending Items ── */}
        <section>
          <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-3">Pending Items</h2>
          {loading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white border border-brand-primary/8 animate-pulse" />)}</div>
          ) : pendingItems.length === 0 ? (
            <div className="bg-white border border-brand-success/20 rounded-2xl p-6 flex items-center gap-4">
              <CheckCircle2 size={28} className="text-brand-success shrink-0" />
              <div>
                <p className="text-sm font-black text-brand-primary">All clear!</p>
                <p className="text-[0.65rem] text-brand-primary/40 font-medium mt-0.5">No pending items for today.</p>
              </div>
            </div>
          ) : (
            <motion.div variants={STAGGER} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {pendingItems.map((item) => (
                <motion.button key={item.id} variants={ITEM} onClick={() => router.push(item.href)}
                  className={cn("w-full bg-white border rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all active:scale-[0.99] text-left",
                    item.done ? "border-brand-success/20" : "border-brand-primary/8")}>
                  {item.done ? <CheckCircle2 size={20} className="text-brand-success shrink-0" /> : <div className="w-5 h-5 rounded-md border-2 border-brand-primary/20 shrink-0" />}
                  <span className={cn("flex-1 text-sm font-semibold", item.done ? "line-through text-brand-primary/30" : "text-brand-primary")}>{item.label}</span>
                  <ChevronRight size={14} className="text-brand-primary/20 shrink-0" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Grade Compliance Footer ── */}
        {!loading && data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-brand-primary rounded-2xl p-6 flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Grade Compliance</p>
              <p className="text-2xl font-display font-black text-white italic leading-none">{data.gradeCompliance}%</p>
              <p className="text-[0.65rem] text-brand-secondary font-medium mt-1">
                {data.subjects.filter((s) => s.hasGrades).length} of {data.subjects.length} subjects submitted
              </p>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <BarChart3 size={22} className="text-brand-secondary absolute" />
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#6ab547" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 28 * (data.gradeCompliance / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
