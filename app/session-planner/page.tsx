"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Zap,
  Globe,
  X,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAcademic } from "@/app/components/AcademicContext";

const SESSION_MANAGERS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"];
const CORE_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"];
const TERM_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"];
const TERM_LABELS: Record<string, string> = { FIRST: "First Term", SECOND: "Second Term", THIRD: "Third Term" };

export default function SessionPlannerPage() {
  const { refresh: academicRefresh } = useAcademic();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [termEditState, setTermEditState] = useState<Record<string, { start: string; end: string }>>({});
  const [savingTerm, setSavingTerm] = useState<string | null>(null);

  const saveTermDates = async (termId: string) => {
    const edit = termEditState[termId];
    if (!edit) return;
    setSavingTerm(termId);
    try {
      const res = await fetch(`/api/structure/terms/${termId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: edit.start, endDate: edit.end }),
      });
      if (res.ok) {
        toast.success("Term dates updated.");
        setTermEditState(prev => { const n = { ...prev }; delete n[termId]; return n; });
        fetchSessions();
      } else {
        toast.error("Failed to update term dates.");
      }
    } catch { toast.error("Network error."); }
    finally { setSavingTerm(null); }
  };

  const activateSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/activate`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Session activated. All dashboards will reflect this period.");
        fetchSessions();
        academicRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Failed to activate session.");
      }
    } catch { toast.error("Network error."); }
  };

  const activateTerm = async (termId: string) => {
    try {
      const res = await fetch(`/api/terms/${termId}/activate`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Term activated. Grade entry is now open.");
        fetchSessions();
        academicRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Failed to activate term.");
      }
    } catch { toast.error("Network error."); }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUserRole(d?.user?.role ?? null))
      .catch(() => {});
  }, []);

  const activeSession = sessions.find(s => s.status === "ACTIVE") ?? null;
  const activeTerm = activeSession?.terms.find((t: any) => t.isCurrent) ?? activeSession?.terms.find((t: any) => t.status === "ACTIVE") ?? null;
  const nextTerm = activeSession?.terms
    .filter((t: any) => !t.isCurrent && t.status === "UPCOMING")
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] ?? null;
  const weekNumber = activeTerm
    ? Math.max(1, Math.ceil((Date.now() - new Date(activeTerm.startDate).getTime()) / (7 * 86_400_000)))
    : null;
  const daysToNextTerm = nextTerm
    ? Math.ceil((new Date(nextTerm.startDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Header Unit */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                   <Clock size={16} />
                </div>
                <span className="text-token-micro font-black uppercase text-brand-accent tracking-widest">Temporal Governance</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-tight">Academic Session Planner</h1>
             <p className="text-brand-primary/60 text-lg font-medium mt-1">Configure institutional timelines, term breaks, and session transitions.</p>
           </div>
           
           {SESSION_MANAGERS.includes(userRole ?? "") && (
             <div className="flex gap-3">
               <Button
                 onClick={() => setShowNewSession(true)}
                 className="bg-brand-primary text-white px-8 py-7 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20"
               >
                 <Plus size={18} className="mr-2" />
                 Open New Session
               </Button>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Current Context */}
           <div className="lg:col-span-1 space-y-8">
              <div className="card glass-premium p-10 border-l-4 border-l-brand-tertiary">
                 <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-brand-primary text-token-micro uppercase tracking-widest">Active Horizon</h4>
                    {activeSession ? (
                      <span className="px-3 py-1 bg-brand-success/10 text-brand-success rounded-full text-token-micro font-black uppercase">LIVE</span>
                    ) : (
                      <span className="px-3 py-1 bg-brand-primary/10 text-brand-tertiary rounded-full text-token-micro font-black uppercase">PENDING</span>
                    )}
                 </div>
                 {loading ? (
                    <div className="space-y-2">
                       <div className="h-8 bg-brand-primary/5 rounded-xl animate-pulse" />
                       <div className="h-4 w-2/3 bg-brand-primary/5 rounded-xl animate-pulse mt-2" />
                    </div>
                 ) : activeSession ? (
                    <>
                      <div className="space-y-1">
                         <p className="text-3xl font-display font-black text-brand-primary">{activeSession.name}</p>
                         <p className="text-sm font-bold text-brand-tertiary uppercase tracking-wide">
                           {activeTerm
                             ? `${TERM_LABELS[activeTerm.name] ?? activeTerm.name}${weekNumber ? ` · Week ${weekNumber}` : ""}`
                             : "No Active Term"}
                         </p>
                      </div>
                      {daysToNextTerm !== null && (
                        <div className="mt-10 p-6 bg-brand-blush rounded-2xl flex items-center gap-4">
                           <Zap size={20} className="text-brand-accent" />
                           <div>
                              <p className="text-token-micro font-black text-brand-primary uppercase mb-0.5">Transition Readiness</p>
                              <p className="text-xs font-medium text-brand-primary/60">
                                {daysToNextTerm > 0
                                  ? `Next term starts in ${daysToNextTerm} day${daysToNextTerm !== 1 ? "s" : ""}.`
                                  : "Next term has begun."}
                              </p>
                           </div>
                        </div>
                      )}
                    </>
                 ) : (
                    <div className="space-y-1">
                       <p className="text-3xl font-display font-black text-brand-primary/30">No Session Set</p>
                       <p className="text-sm font-bold text-brand-tertiary/60 uppercase tracking-wide">Create a session to begin</p>
                    </div>
                 )}
              </div>

              <div className="card bg-brand-blush border-dashed border-2 border-brand-primary/8 p-8 flex flex-col gap-6">
                 <h4 className="font-black text-brand-tertiary text-token-micro uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14} /> Global Constraints
                 </h4>
                 <div className="space-y-4">
                    <ConstraintItem label="Min Instructional Days" value="84" />
                    <ConstraintItem label="Examination Buffer" value="10 Days" />
                    <ConstraintItem label="Public Holidays Sync" value="Verified" />
                 </div>
              </div>
           </div>

           {/* Timeline Explorer */}
           <div className="lg:col-span-2 space-y-8">
              {loading ? (
                 <div className="py-20 text-center italic text-brand-tertiary">Loading academic timelines...</div>
              ) : sessions.length === 0 ? (
                 <div className="card bg-white py-32 text-center">
                    <CalendarDays className="mx-auto text-brand-tertiary/10 mb-6" size={64} />
                    <h3 className="text-xl font-black text-brand-primary">No Timeline Anchors</h3>
                    <p className="text-brand-tertiary text-sm mt-1">Start by defining your first institutional session.</p>
                 </div>
              ) : sessions.map((session) => (
                 <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card group hover:border-brand-tertiary/20 transition-all p-10 flex flex-col gap-8"
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl grid place-items-center ${session.status === 'ACTIVE' ? 'bg-brand-tertiary text-white shadow-lg shadow-brand-tertiary/20' : 'bg-brand-blush text-brand-tertiary'}`}>
                             <CalendarDays size={24} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-brand-primary tracking-tight">{session.name}</h4>
                             <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest">
                                {new Date(session.startDate).getFullYear()} - {new Date(session.endDate).getFullYear()} Period
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                         {session.status === "ACTIVE" ? (
                           <span className="px-3 py-1 bg-brand-tertiary/10 text-brand-tertiary rounded-full text-token-micro font-black uppercase tracking-widest">Active</span>
                         ) : CORE_ADMIN.includes(userRole ?? "") ? (
                           <button
                             onClick={() => activateSession(session.id)}
                             className="px-4 py-2 bg-brand-secondary text-white rounded-xl text-token-micro font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                           >
                             Set Active
                           </button>
                         ) : (
                           <span className="px-3 py-1 bg-brand-blush text-brand-tertiary rounded-full text-token-micro font-black uppercase tracking-widest">{session.status}</span>
                         )}
                         <ArrowRight size={20} className="text-brand-tertiary group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {session.terms.map((term: any) => {
                          const isCurrentTerm = term.isCurrent || term.status === 'ACTIVE';
                          return (
                            <div key={term.id} className={`p-6 rounded-2xl border transition-all flex flex-col gap-3 ${isCurrentTerm ? 'bg-brand-tertiary/5 border-brand-tertiary/20' : 'bg-white border-brand-primary/8'}`}>
                               <div className="flex items-center justify-between">
                                 <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{TERM_LABELS[term.name] ?? term.name}</p>
                                 {TERM_ADMIN.includes(userRole ?? "") && !termEditState[term.id] && (
                                   <button
                                     onClick={() => setTermEditState(prev => ({ ...prev, [term.id]: { start: term.startDate ? term.startDate.split("T")[0] : "", end: term.endDate ? term.endDate.split("T")[0] : "" } }))}
                                     className="p-1 rounded-lg hover:bg-brand-blush text-brand-tertiary transition-colors"
                                   >
                                     <Pencil size={11} />
                                   </button>
                                 )}
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className={`text-xs font-black uppercase ${isCurrentTerm ? 'text-brand-primary' : 'text-brand-tertiary'}`}>{term.status}</span>
                                  {term.status === 'COMPLETED' ? <CheckCircle2 size={12} className="text-brand-success" /> : isCurrentTerm ? <Zap size={12} className="text-brand-accent animate-pulse" /> : <div className="w-2 h-2 rounded-full border border-brand-primary/10" />}
                               </div>
                             {termEditState[term.id] ? (
                               <div className="flex flex-col gap-2">
                                 <input type="date" value={termEditState[term.id].start} onChange={e => setTermEditState(prev => ({ ...prev, [term.id]: { ...prev[term.id], start: e.target.value } }))} className="w-full border border-brand-primary/8 rounded-xl px-3 py-2 text-xs font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary" />
                                 <input type="date" value={termEditState[term.id].end} onChange={e => setTermEditState(prev => ({ ...prev, [term.id]: { ...prev[term.id], end: e.target.value } }))} className="w-full border border-brand-primary/8 rounded-xl px-3 py-2 text-xs font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary" />
                                 <div className="flex gap-2">
                                   <button onClick={() => saveTermDates(term.id)} disabled={savingTerm === term.id} className="flex-1 py-1.5 bg-brand-tertiary text-white rounded-xl text-token-micro font-black uppercase tracking-widest disabled:opacity-50">
                                     {savingTerm === term.id ? "Saving…" : "Save"}
                                   </button>
                                   <button onClick={() => setTermEditState(prev => { const n = { ...prev }; delete n[term.id]; return n; })} className="px-3 py-1.5 bg-brand-blush text-brand-tertiary rounded-xl text-token-micro font-black uppercase">
                                     ✕
                                   </button>
                                 </div>
                               </div>
                             ) : (
                               <p className="text-token-micro font-bold text-brand-tertiary/70">{formatDate(term.startDate)} → {formatDate(term.endDate)}</p>
                             )}
                             {session.status === 'ACTIVE' && !isCurrentTerm && TERM_ADMIN.includes(userRole ?? "") && !termEditState[term.id] && (
                         <button
                        onClick={() => activateTerm(term.id)}
                    className="mt-1 w-full py-1.5 bg-brand-tertiary/10 text-brand-tertiary rounded-xl text-token-micro font-black uppercase tracking-widest hover:bg-brand-tertiary hover:text-white transition-all"
>
                Set Active
              </button>
            )}
          </div>
        );
      })};
    </div>
                 </motion.div>
              ))};
           </div>

        </div>

      </div>
      <AnimatePresence>
        {showNewSession && (
          <NewSessionModal
            onClose={() => setShowNewSession(false)}
            onSuccess={() => { setShowNewSession(false); fetchSessions(); }}
          />
        )}
      </AnimatePresence>

    </DashboardShell>
  );
}

function NewSessionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", year: "", startDate: "", endDate: "" });
  const [terms, setTerms] = useState([
    { name: "FIRST", startDate: "", endDate: "" },
    { name: "SECOND", startDate: "", endDate: "" },
    { name: "THIRD", startDate: "", endDate: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setTerm = (idx: number, key: string, value: string) => setTerms(t => t.map((tr, i) => i === idx ? { ...tr, [key]: value } : tr));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.year || !form.startDate || !form.endDate) {
      toast.error("All fields are required.");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date.");
      return;
    }
    // validate terms
    for (const t of terms) {
      if (!t.name || !t.startDate || !t.endDate) {
        toast.error("All term fields are required.");
        return;
      }
      if (new Date(t.endDate) <= new Date(t.startDate)) {
        toast.error("Each term's end date must be after its start date.");
        return;
      }
    }
    setSaving(true);
    try {
      const body = { ...form, terms };
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to create session."); return; }
      toast.success(`Session "${form.name}" created.`);
      onSuccess();
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 flex flex-col gap-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-brand-primary tracking-tight">Open New Session</h2>
            <p className="text-sm text-brand-primary/60 mt-1">Provide session dates and term breakdown.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-blush text-brand-tertiary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Session Name" placeholder="e.g. 2025/2026" value={form.name} onChange={v => { set("name", v); set("year", v); }} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" type="date" value={form.startDate} onChange={v => set("startDate", v)} />
            <Field label="End Date"   type="date" value={form.endDate}   onChange={v => set("endDate", v)} />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-black text-brand-primary">Term Details (editable)</h4>
            {terms.map((t, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-token-micro font-black text-brand-tertiary uppercase">Name</label>
                  <input value={t.name} onChange={e => setTerm(idx, "name", e.target.value)} className="w-full border border-brand-primary/8 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-token-micro font-black text-brand-tertiary uppercase">Start</label>
                  <input type="date" value={t.startDate} onChange={e => setTerm(idx, "startDate", e.target.value)} className="w-full border border-brand-primary/8 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="text-token-micro font-black text-brand-tertiary uppercase">End</label>
                  <input type="date" value={t.endDate} onChange={e => setTerm(idx, "endDate", e.target.value)} className="w-full border border-brand-primary/8 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Session"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-brand-primary/12 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary transition-colors"
      />
    </div>
  );
}

function ConstraintItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-token-caption font-black text-brand-tertiary uppercase tracking-tight">{label}</span>
       <span className="text-xs font-black text-brand-primary">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

