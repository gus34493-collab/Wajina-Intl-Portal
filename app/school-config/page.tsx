"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Settings, 
  Calendar, 
  Layers, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  ChevronRight,
  Monitor,
  Building2,
  Trash2,
  Edit3,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SchoolConfig() {
  const [data, setData] = useState<any>(null);
  const [view, setView] = useState("calendar");
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/structure/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Config fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  useEffect(() => { fetchConfig(); }, []);

  const activateTerm = async (termId: string) => {
    try {
      const res = await fetch(`/api/terms/${termId}/activate`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Term activated. All dashboards will reflect the new period.");
        fetchConfig();
      } else {
        toast.error("Failed to activate term.");
      }
    } catch { toast.error("Network error."); }
  };

  const activateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/activate`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Session activated successfully.");
        fetchConfig();
      } else {
        toast.error("Failed to activate session.");
      }
    } catch { toast.error("Network error."); }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase italic decoration-brand-tertiary/30 underline">Institutional Core</h1>
              <p className="text-brand-primary/60 text-sm font-medium mt-1">Configuring sessions, academic cycles, and the structural locus of the portal.</p>
           </div>
           <div className="flex bg-white p-1 rounded-2xl border border-brand-primary/8 shadow-md self-start">
             <TabButton label="Calendar" id="calendar" active={view === "calendar"} onClick={setView} icon={<Calendar size={14} />} />
             <TabButton label="Structure" id="structure" active={view === "structure"} onClick={setView} icon={<Layers size={14} />} />
             <TabButton label="System" id="system" active={view === "system"} onClick={setView} icon={<Settings size={14} />} />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left/Main Column: Active Context (2/3) */}
           <div className="lg:col-span-2 flex flex-col gap-8">
              
              <AnimatePresence mode="wait">
                 {view === "calendar" && (
                   <motion.div 
                     key="calendar" 
                     initial={{ opacity: 0, x: -20 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     exit={{ opacity: 0, x: 20 }}
                     className="flex flex-col gap-8"
                   >
                     {/* Sessions Card */}
                     <div className="card">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                             <Calendar className="text-brand-tertiary" size={18} /> Academic Sessions
                           </h3>
                           <button onClick={() => router.push("/session-planner")} className="flex items-center gap-2 bg-brand-tertiary text-white px-4 py-2 rounded-xl text-token-micro font-black uppercase tracking-widest hover:scale-105 transition-transform">
                              <Plus size={14} /> New Session
                           </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {data?.sessions?.map((s: any, i: number) => (
                             <div key={i} className="p-6 bg-brand-blush rounded-2xl border border-brand-primary/8 hover:border-brand-tertiary/20 transition-all flex flex-col justify-between h-40 group">
                                <div className="flex justify-between">
                                   <div>
                                      <p className="text-xs font-black text-brand-primary">{s.name}</p>
                                      <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-1">{s.year}</p>
                                   </div>
                                   {s.isDefault && (
                                     <span className="bg-brand-tertiary text-white text-token-micro font-black px-2 py-0.5 rounded-full uppercase tracking-tighter self-start">Default</span>
                                   )}
                                </div>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <div className={clsx("w-2 h-2 rounded-full", s.status === 'ACTIVE' ? "bg-brand-secondary" : "bg-brand-tertiary opacity-30")} />
                                      <span className="text-token-micro font-black uppercase tracking-widest">{s.status}</span>
                                   </div>
                                   {s.status !== 'ACTIVE' ? (
                                     <button onClick={() => activateSession(s.id)} className="text-token-micro font-black text-brand-secondary uppercase tracking-widest hover:underline">
                                       Set Active
                                     </button>
                                   ) : (
                                     <button className="text-brand-tertiary hover:text-brand-primary transition-colors"><MoreVertical size={16} /></button>
                                   )}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Terms List */}
                     <div className="card">
                        <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest mb-8">Cycle Status (Terms)</h3>
                        <div className="divide-y divide-black/5">
                           {data?.sessions?.[0]?.terms?.map((t: any, i: number) => (
                             <div key={i} className="py-6 flex justify-between items-center group">
                                <div className="flex items-center gap-5">
                                   <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-lg", t.isCurrent ? "bg-brand-tertiary text-white" : "bg-brand-blush text-brand-tertiary")}>
                                      {t.name === 'FIRST' ? '1' : t.name === 'SECOND' ? '2' : '3'}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-brand-primary group-hover:text-brand-tertiary transition-colors">{t.name} TERM</p>
                                      <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-1">Registry Open • Jan - Apr</p>
                                   </div>
                                </div>
                                <button
                                  onClick={() => !t.isCurrent && activateTerm(t.id)}
                                  className={clsx(
                                    "px-5 py-2.5 rounded-xl text-token-micro font-black uppercase tracking-widest border transition-all",
                                    t.isCurrent
                                      ? "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary cursor-default"
                                      : "bg-white border-brand-primary/8 text-brand-tertiary hover:border-brand-secondary/20 hover:text-brand-secondary"
                                  )}
                                >
                                  {t.isCurrent ? "Live Term" : "Activate Cycle"}
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {view === "system" && (
                   <motion.div
                     key="system"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="flex flex-col gap-8"
                   >
                     <div className="card">
                       <div className="flex items-center gap-3 mb-8">
                         <BookOpen className="text-brand-tertiary" size={18} />
                         <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Institutional Grading Reference</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <GradingScaleCard
                           title="Standard Scale"
                           subtitle="Primary · Junior Secondary · Early Years"
                           rows={[
                             { min: 75, grade: "A", remark: "Excellent" },
                             { min: 65, grade: "B", remark: "Very Good" },
                             { min: 55, grade: "C", remark: "Good" },
                             { min: 45, grade: "D", remark: "Pass" },
                             { min: 40, grade: "E", remark: "Fair" },
                             { min: 0,  grade: "F", remark: "Fail" },
                           ]}
                         />
                         <GradingScaleCard
                           title="SSS Scale"
                           subtitle="Senior Secondary (WAEC-aligned)"
                           rows={[
                             { min: 75, grade: "A1", remark: "Excellent" },
                             { min: 70, grade: "B2", remark: "Very Good" },
                             { min: 65, grade: "B3", remark: "Good" },
                             { min: 60, grade: "C4", remark: "Credit" },
                             { min: 55, grade: "C5", remark: "Credit" },
                             { min: 50, grade: "C6", remark: "Credit" },
                             { min: 45, grade: "D7", remark: "Pass" },
                             { min: 40, grade: "E8", remark: "Pass" },
                             { min: 0,  grade: "F9", remark: "Fail" },
                           ]}
                         />
                       </div>
                       <div className="mt-8 flex items-center gap-3 px-6 py-4 bg-brand-blush rounded-2xl border border-brand-primary/8">
                         <ShieldCheck size={14} className="text-brand-tertiary shrink-0" />
                         <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Grading scale customisation requires Director key escalation via the academic governance protocol.</p>
                       </div>
                     </div>
                   </motion.div>
                 )}

                 {view === "structure" && (
                   <motion.div
                     key="structure"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="flex flex-col gap-8"
                   >
                     {/* Class Tree */}
                     <div className="card">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                             <Building2 className="text-brand-tertiary" size={18} /> Structural Registry
                           </h3>
                           <div className="flex gap-4">
                              <button className="text-token-micro font-black text-brand-tertiary uppercase">Add Class</button>
                              <button className="text-token-micro font-black text-brand-tertiary uppercase">Batch Import</button>
                           </div>
                        </div>

                        <div className="flex flex-col gap-10">
                           {['PRIMARY', 'SECONDARY'].map((campus, ci) => (
                             <div key={ci}>
                                <h4 className="text-token-caption font-black text-brand-tertiary uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                   {campus} LOGISTICS <div className="flex-1 h-px bg-black/5" />
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {data?.classes?.filter((c: any) => c.campus === campus).map((c: any, i: number) => (
                                      <div key={i} className="p-6 bg-white border border-brand-primary/8 rounded-3xl hover:border-brand-tertiary/20 transition-all group relative">
                                         <div className="flex justify-between items-start mb-6">
                                            <div>
                                               <p className="text-xs font-black text-brand-primary">{c.name}</p>
                                               <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-1">{c.arms?.length || 0} Registered Arms</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button className="p-2 hover:bg-brand-blush rounded-lg text-brand-tertiary"><Edit3 size={14} /></button>
                                               <button className="p-2 hover:bg-brand-error/10 rounded-lg text-brand-error"><Trash2 size={14} /></button>
                                            </div>
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                            {c.arms?.map((a: any, j: number) => (
                                               <span key={j} className="text-token-micro font-black uppercase text-brand-tertiary bg-brand-tertiary/10 px-3 py-1 rounded-lg">
                                                  {a.label}
                                               </span>
                                            ))}
                                            <button className="w-6 h-6 rounded-lg bg-brand-blush text-brand-tertiary flex items-center justify-center hover:bg-brand-tertiary/10 hover:text-brand-tertiary transition-colors"><Plus size={12} /></button>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   </motion.div>
                 )}
              </AnimatePresence>

           </div>

           {/* Right Column: Support & Summary (1/3) */}
           <div className="flex flex-col gap-8">
              
              {/* Institutional Health */}
              <div className="card bg-brand-primary text-white border-none shadow-2xl overflow-hidden relative group">
                 <div className="absolute -right-4 -bottom-4 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                    <ShieldCheck size={120} />
                 </div>
                 <div className="relative z-10 flex flex-col gap-6">
                    <h4 className="text-token-caption font-black text-white/50 uppercase tracking-[0.2em] mb-4">Core Integrity</h4>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-display font-black tracking-tighter italic">99.2</span>
                       <span className="text-lg font-black text-brand-tertiary">%</span>
                    </div>
                    <p className="text-token-micro font-medium text-white/40 leading-relaxed italic pr-12">"Registry synchronization is optimal across all campus structural nodes."</p>
                    
                    <button className="mt-6 w-full bg-white text-brand-primary py-3 rounded-xl font-black text-token-micro uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                       Audit Log <Monitor size={14} className="text-brand-success" />
                    </button>
                 </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <MiniSummary label="Teachers" val="84" />
                 <MiniSummary label="Subjects" val="112" />
                 <MiniSummary label="Total Pupils" val="1,420" />
                 <MiniSummary label="Fee Configs" val="12" />
              </div>

              {/* Core Shortcuts */}
              <div className="flex flex-col gap-3">
                 <h4 className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest px-2">System Shortcuts</h4>
                 <Shortcut label="Batch Promote Scholars" />
                 <Shortcut label="Assign Subject Masters" />
                 <Shortcut label="Modify Grading Scales" />
                 <Shortcut label="Export Locus Registry" />
              </div>

           </div>
        </div>

      </div>
    </DashboardShell>
  );
}

function TabButton({ label, id, active, onClick, icon }: any) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={clsx(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all",
        active ? "bg-brand-primary text-white shadow-xl" : "text-brand-tertiary hover:bg-brand-blush"
      )}
    >
       {icon} {label}
    </button>
  );
}

function MiniSummary({ label, val }: any) {
  return (
    <div className="bg-white border border-brand-primary/8 rounded-[24px] p-5 shadow-sm">
       <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mb-1">{label}</p>
       <p className="text-lg font-black text-brand-primary tracking-tight">{val}</p>
    </div>
  );
}

function Shortcut({ label }: any) {
  return (
    <button className="w-full flex justify-between items-center p-4 bg-white border border-brand-primary/8 rounded-xl hover:bg-brand-blush transition-all group">
       <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">{label}</span>
       <ChevronRight size={14} className="text-brand-tertiary group-hover:text-brand-tertiary transition-colors" />
    </button>
  );
}

function GradingScaleCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: { min: number; grade: string; remark: string }[] }) {
  return (
    <div className="flex flex-col gap-4 bg-brand-blush rounded-[2rem] border border-brand-primary/8 p-6">
      <div className="mb-2">
        <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{title}</p>
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
      <div className="flex flex-col divide-y divide-brand-primary/8">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-white border border-brand-primary/8 flex items-center justify-center font-display font-black text-brand-primary text-sm">{row.grade}</span>
              <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{row.remark}</span>
            </div>
            <span className="text-token-micro font-black text-brand-primary tabular-nums">{row.min === 0 ? "0–39" : `${row.min}+`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

