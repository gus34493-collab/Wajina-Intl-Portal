"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  CheckCircle2,
  Plus,
  Zap,
  Globe,
  X,
  Pencil,
  Trash2,
  Flag,
  Coffee,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAcademic } from "@/app/components/AcademicContext";

const SESSION_MANAGERS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"];
const CORE_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"];
const TERM_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"];
const TERM_LABELS: Record<string, string> = { FIRST: "First Term", SECOND: "Second Term", THIRD: "Third Term" };

// --- Calendar Logic ---
function getMonthsInRange(start: Date, end: Date) {
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 is Sunday
}

export default function SessionPlannerPage() {
  const { refresh: academicRefresh } = useAcademic();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCampus, setUserCampus] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [termEditState, setTermEditState] = useState<Record<string, { start: string; end: string }>>({});
  const [savingTerm, setSavingTerm] = useState<string | null>(null);

  // Campus Isolation State
  const [activeCampus, setActiveCampus] = useState<"PRIMARY" | "SECONDARY">("PRIMARY");
  const [showEventModal, setShowEventModal] = useState<{ termId: string; sessionId: string; defaultDate?: string } | null>(null);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  
  // Calendar Toggle State
  const [showCalendar, setShowCalendar] = useState<Record<string, boolean>>({});

  // Calendar State per term
  const [calendarViewMonth, setCalendarViewMonth] = useState<Record<string, number>>({});

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
        toast.success("Session activated.");
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
      const res = await fetch(`/api/terms/${termId}/activate`, { method: "PATCH" });
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

  const fetchEvents = async (termId: string) => {
    try {
      const res = await fetch(`/api/events?termId=${termId}&campus=${activeCampus}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(prev => ({ ...prev, [termId]: data.events }));
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        
        data.sessions.forEach((s: any) => {
          s.terms.forEach((t: any) => {
            if (t.isCurrent || t.status === "ACTIVE") {
              fetchEvents(t.id);
            }
          });
        });
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string, termId: string) => {
    if (!confirm("Remove this event from the timeline?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Event removed.");
        fetchEvents(termId);
      }
    } catch { toast.error("Network error."); }
  };

  useEffect(() => {
    fetchSessions();
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        setUserRole(d?.user?.role ?? null);
        if (d?.user?.campus) {
          setActiveCampus(d.user.campus);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    sessions.forEach(s => {
      s.terms.forEach((t: any) => {
        if (t.isCurrent || t.status === "ACTIVE") {
          fetchEvents(t.id);
        }
      });
    });
  }, [activeCampus]);

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
        
        {/* Header */}
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

        {/* Campus Tabs */}
        <div className="flex bg-brand-blush/50 p-2 rounded-2xl w-max border border-brand-primary/10">
           <button
             onClick={() => setActiveCampus("PRIMARY")}
             className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCampus === "PRIMARY" ? "bg-white text-brand-primary shadow-sm" : "text-brand-tertiary/60 hover:text-brand-primary"}`}
           >
             Primary Campus
           </button>
           <button
             onClick={() => setActiveCampus("SECONDARY")}
             className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCampus === "SECONDARY" ? "bg-white text-brand-primary shadow-sm" : "text-brand-tertiary/60 hover:text-brand-primary"}`}
           >
             Secondary Campus
           </button>
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
                    <div className="flex items-center justify-between border-b border-brand-primary/10 pb-6">
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

                    <div className="flex flex-col gap-10">
                       {session.terms.map((term: any) => {
                          const isCurrentTerm = term.isCurrent || term.status === 'ACTIVE';
                          const termEvents = events[term.id] || [];
                          
                          // Calendar View Prep
                          const startDate = new Date(term.startDate);
                          const endDate = new Date(term.endDate);
                          const termMonths = startDate <= endDate ? getMonthsInRange(startDate, endDate) : [];
                          const viewIdx = calendarViewMonth[term.id] ?? 0;
                          const currentMonth = termMonths[viewIdx] || startDate;

                          return (
                            <div key={term.id} className={`p-6 rounded-2xl border transition-all flex flex-col gap-6 ${isCurrentTerm ? 'bg-brand-tertiary/5 border-brand-tertiary/20' : 'bg-white border-brand-primary/8'}`}>
                               
                               <div className="flex items-center justify-between border-b border-brand-primary/10 pb-4">
                                 <div className="flex items-center gap-3">
                                   <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{TERM_LABELS[term.name] ?? term.name}</p>
                                   <span className={`text-xs font-black uppercase ${isCurrentTerm ? 'text-brand-primary' : 'text-brand-tertiary'}`}>{term.status}</span>
                                   {term.status === 'COMPLETED' ? <CheckCircle2 size={12} className="text-brand-success" /> : isCurrentTerm ? <Zap size={12} className="text-brand-accent animate-pulse" /> : null}
                                 </div>
                                 
                                 <div className="flex gap-2 items-center">
                                     <button
                                       onClick={() => {
                                         if (!showCalendar[term.id]) fetchEvents(term.id);
                                         setShowCalendar(p => ({ ...p, [term.id]: !p[term.id] }));
                                       }}
                                       className="p-2 rounded-lg bg-brand-blush hover:bg-brand-primary/10 text-brand-primary transition-colors flex items-center gap-2 text-token-micro font-black uppercase tracking-widest border border-brand-primary/10"
                                     >
                                       <CalendarDays size={11} /> Plan Term
                                     </button>
                                     {TERM_ADMIN.includes(userRole ?? "") && !termEditState[term.id] && (
                                       <button
                                         onClick={() => setTermEditState(prev => ({ ...prev, [term.id]: { start: term.startDate ? term.startDate.split("T")[0] : "", end: term.endDate ? term.endDate.split("T")[0] : "" } }))}
                                         className="p-2 rounded-lg bg-brand-blush hover:bg-brand-primary/10 text-brand-tertiary transition-colors"
                                       >
                                         <Pencil size={11} />
                                       </button>
                                     )}
                                 </div>
                               </div>

                               <div className="flex flex-col gap-4">
                                 {termEditState[term.id] ? (
                                   <div className="flex flex-col gap-2">
                                     <div className="flex gap-4">
                                        <input type="date" value={termEditState[term.id].start} onChange={e => setTermEditState(prev => ({ ...prev, [term.id]: { ...prev[term.id], start: e.target.value } }))} className="flex-1 border border-brand-primary/8 rounded-xl px-3 py-2 text-xs font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary" />
                                        <input type="date" value={termEditState[term.id].end} onChange={e => setTermEditState(prev => ({ ...prev, [term.id]: { ...prev[term.id], end: e.target.value } }))} className="flex-1 border border-brand-primary/8 rounded-xl px-3 py-2 text-xs font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary" />
                                     </div>
                                     <div className="flex gap-2">
                                       <button onClick={() => saveTermDates(term.id)} disabled={savingTerm === term.id} className="w-auto px-6 py-2 bg-brand-tertiary text-white rounded-xl text-token-micro font-black uppercase tracking-widest disabled:opacity-50">
                                         {savingTerm === term.id ? "Saving…" : "Save Dates"}
                                       </button>
                                       <button onClick={() => setTermEditState(prev => { const n = { ...prev }; delete n[term.id]; return n; })} className="px-4 py-2 bg-brand-blush text-brand-tertiary rounded-xl text-token-micro font-black uppercase">
                                         Cancel
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="flex items-center justify-between">
                                     <p className="text-sm font-black text-brand-primary flex items-center gap-2">
                                        <CalendarDays size={16} className="text-brand-tertiary" />
                                        {formatDate(term.startDate)} — {formatDate(term.endDate)}
                                     </p>
                                     {session.status === 'ACTIVE' && !isCurrentTerm && TERM_ADMIN.includes(userRole ?? "") && (
                                       <button
                                         onClick={() => activateTerm(term.id)}
                                         className="px-6 py-2 bg-brand-accent/20 text-brand-accent rounded-xl text-token-micro font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all"
                                       >
                                         Activate Term
                                       </button>
                                     )}
                                   </div>
                                 )}

                                 {/* Google Calendar Style View */}
                                 {showCalendar[term.id] && termMonths.length > 0 && (
                                    <div className="mt-4 border border-brand-primary/10 rounded-2xl overflow-hidden bg-white overflow-x-auto custom-scrollbar">
                                       <div className="min-w-[800px]">
                                       {/* Calendar Header */}
                                       <div className="bg-brand-blush p-4 border-b border-brand-primary/10 flex items-center justify-between">
                                          <h4 className="font-black text-brand-primary uppercase tracking-widest text-sm">
                                             {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                          </h4>
                                          <div className="flex gap-2">
                                             <button 
                                                disabled={viewIdx === 0}
                                                onClick={() => setCalendarViewMonth(p => ({ ...p, [term.id]: viewIdx - 1 }))}
                                                className="p-1.5 rounded-lg bg-white shadow-sm border border-brand-primary/10 text-brand-primary disabled:opacity-30"
                                             >
                                                <ChevronLeft size={16} />
                                             </button>
                                             <button 
                                                disabled={viewIdx === termMonths.length - 1}
                                                onClick={() => setCalendarViewMonth(p => ({ ...p, [term.id]: viewIdx + 1 }))}
                                                className="p-1.5 rounded-lg bg-white shadow-sm border border-brand-primary/10 text-brand-primary disabled:opacity-30"
                                             >
                                                <ChevronRight size={16} />
                                             </button>
                                          </div>
                                       </div>

                                       {/* Days of Week */}
                                       <div className="grid grid-cols-7 border-b border-brand-primary/5 bg-brand-blush/30">
                                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                             <div key={d} className="p-3 text-center text-token-micro font-black text-brand-tertiary uppercase">{d}</div>
                                          ))}
                                       </div>

                                       {/* Calendar Grid */}
                                       <div className="grid grid-cols-7 bg-brand-primary/5 gap-px border-b border-brand-primary/5">
                                          {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                                             <div key={`empty-${i}`} className="bg-white min-h-[100px] p-2 opacity-50"></div>
                                          ))}
                                          {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                                             const day = i + 1;
                                             const cellDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                             const cellDate = new Date(cellDateStr);
                                             
                                             // Find events that overlap with this cellDate
                                             const dayEvents = termEvents.filter(evt => {
                                                const eStart = new Date(evt.startDate);
                                                eStart.setHours(0,0,0,0);
                                                const eEnd = new Date(evt.endDate);
                                                eEnd.setHours(23,59,59,999);
                                                return cellDate >= eStart && cellDate <= eEnd;
                                             });

                                             return (
                                                <div 
                                                   key={`day-${day}`} 
                                                   onClick={() => {
                                                     setShowEventModal({ termId: term.id, sessionId: session.id, defaultDate: cellDateStr });
                                                   }}
                                                   className="bg-white min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer hover:bg-brand-blush/30 transition-colors group relative"
                                                >
                                                   <span className="text-xs font-black text-brand-primary/40 group-hover:text-brand-tertiary">{day}</span>
                                                   {dayEvents.map(evt => (
                                                      <div key={evt.id} className="bg-brand-tertiary/10 text-brand-tertiary px-1.5 py-1 rounded text-[10px] font-bold leading-tight truncate flex justify-between group/evt">
                                                         <span className="truncate">{evt.title}</span>
                                                         {TERM_ADMIN.includes(userRole ?? "") && (
                                                           <button onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id, term.id); }} className="opacity-0 group-hover/evt:opacity-100 text-brand-error hover:text-red-700 ml-1">
                                                              <X size={10} />
                                                           </button>
                                                         )}
                                                      </div>
                                                   ))}
                                                </div>
                                             );
                                          })}
                                       </div>
                                       </div>
                                    </div>
                                 )}

                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </motion.div>
              ))}
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
        {showEventModal && (
          <EventModal
            termId={showEventModal.termId}
            sessionId={showEventModal.sessionId}
            campus={activeCampus}
            defaultDate={showEventModal.defaultDate}
            onClose={() => setShowEventModal(null)}
            onSuccess={() => { setShowEventModal(null); fetchEvents(showEventModal.termId); }}
          />
        )}
      </AnimatePresence>

    </DashboardShell>
  );
}

function EventIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    ENTRANCE: <GraduationCap size={16} className="text-brand-accent" />,
    HOLIDAY: <Coffee size={16} className="text-amber-500" />,
    MID_TERM: <Coffee size={16} className="text-amber-500" />,
    EXAM: <Pencil size={16} className="text-brand-error" />,
    PTA: <Globe size={16} className="text-brand-secondary" />,
    GENERAL: <Flag size={16} className="text-brand-tertiary" />
  };
  return (
    <div className="w-8 h-8 rounded-full bg-brand-blush flex items-center justify-center shrink-0">
       {icons[type] || icons.GENERAL}
    </div>
  );
}

function EventModal({ termId, sessionId, campus, defaultDate, onClose, onSuccess }: { termId: string, sessionId: string, campus: string, defaultDate?: string, onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", startDate: defaultDate || "", endDate: defaultDate || "", type: "GENERAL" });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error("Title, start date, and end date are required.");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, termId, sessionId, campus };
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error("Failed to add event."); return; }
      toast.success("Event added to timeline.");
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
            <h2 className="text-xl font-black text-brand-primary tracking-tight">Plan Term Event</h2>
            <p className="text-sm text-brand-primary/60 mt-1 uppercase tracking-widest">{campus} CAMPUS</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-blush text-brand-tertiary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Event Title" placeholder="e.g. Entrance Examination" value={form.title} onChange={v => set("title", v)} />
          
          <div className="flex flex-col gap-2">
            <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest">Event Category</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full border border-brand-primary/12 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary">
               <option value="GENERAL">General Event</option>
               <option value="ENTRANCE">Entrance Exam</option>
               <option value="MID_TERM">Mid-Term Break</option>
               <option value="HOLIDAY">Holiday</option>
               <option value="PTA">PTA Meeting</option>
               <option value="EXAM">Examinations</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" type="date" value={form.startDate} onChange={v => set("startDate", v)} />
            <Field label="End Date"   type="date" value={form.endDate}   onChange={v => set("endDate", v)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest">Description (Optional)</label>
            <textarea
              placeholder="Additional details..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              className="w-full border border-brand-primary/12 rounded-xl px-4 py-3 text-sm font-medium text-brand-primary bg-brand-blush focus:outline-none focus:border-brand-tertiary min-h-[80px]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Adding…" : "Save to Timeline"}
          </button>
        </form>
      </motion.div>
    </motion.div>
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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
