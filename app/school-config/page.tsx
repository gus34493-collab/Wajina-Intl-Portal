"use client";

import { useState, useEffect } from "react";
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

export default function SchoolConfig() {
  const [data, setData] = useState<any>(null);
  const [view, setView] = useState("calendar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/structure?type=overview");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Config fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase italic decoration-brand-moonstone/30 underline">Institutional Core</h1>
              <p className="text-text-secondary text-sm font-medium mt-1">Configuring sessions, academic cycles, and the structural locus of the portal.</p>
           </div>
           <div className="flex bg-white p-1 rounded-2xl border border-black/5 shadow-md self-start">
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
                           <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                             <Calendar className="text-brand-moonstone" size={18} /> Academic Sessions
                           </h3>
                           <button className="flex items-center gap-2 bg-brand-moonstone text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                              <Plus size={14} /> New Session
                           </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {data?.sessions?.map((s: any, i: number) => (
                             <div key={i} className="p-6 bg-brand-bg rounded-2xl border border-black/5 hover:border-brand-moonstone/20 transition-all flex flex-col justify-between h-40 group">
                                <div className="flex justify-between">
                                   <div>
                                      <p className="text-xs font-black text-brand-gunmetal">{s.name}</p>
                                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{s.year}</p>
                                   </div>
                                   {s.isDefault && (
                                     <span className="bg-brand-moonstone text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter self-start">Default</span>
                                   )}
                                </div>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <div className={clsx("w-2 h-2 rounded-full", s.status === 'ACTIVE' ? "bg-brand-success" : "bg-text-muted opacity-30")} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{s.status}</span>
                                   </div>
                                   <button className="text-text-muted hover:text-brand-gunmetal transition-colors"><MoreVertical size={16} /></button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Terms List */}
                     <div className="card">
                        <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest mb-8">Cycle Status (Terms)</h3>
                        <div className="divide-y divide-black/5">
                           {data?.sessions?.[0]?.terms?.map((t: any, i: number) => (
                             <div key={i} className="py-6 flex justify-between items-center group">
                                <div className="flex items-center gap-5">
                                   <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-lg", t.isCurrent ? "bg-brand-moonstone text-white" : "bg-brand-bg text-text-muted")}>
                                      {t.name === 'FIRST' ? '1' : t.name === 'SECOND' ? '2' : '3'}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-brand-gunmetal group-hover:text-brand-moonstone transition-colors">{t.name} TERM</p>
                                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Registry Open • Jan - Apr</p>
                                   </div>
                                </div>
                                <button className={clsx(
                                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                  t.isCurrent ? "bg-brand-success/10 border-brand-success/20 text-brand-success" : "bg-white border-black/5 text-text-muted hover:border-brand-moonstone/20"
                                )}>
                                   {t.isCurrent ? "Live Term" : "Activate Cycle"}
                                </button>
                             </div>
                           ))}
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
                           <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                             <Building2 className="text-brand-moonstone" size={18} /> Structural Registry
                           </h3>
                           <div className="flex gap-4">
                              <button className="text-[10px] font-black text-brand-moonstone uppercase">Add Class</button>
                              <button className="text-[10px] font-black text-brand-moonstone uppercase">Batch Import</button>
                           </div>
                        </div>

                        <div className="flex flex-col gap-10">
                           {['PRIMARY', 'SECONDARY'].map((campus, ci) => (
                             <div key={ci}>
                                <h4 className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                   {campus} LOGISTICS <div className="flex-1 h-px bg-black/5" />
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {data?.classes?.filter((c: any) => c.campus === campus).map((c: any, i: number) => (
                                      <div key={i} className="p-6 bg-white border border-black/5 rounded-3xl hover:border-brand-moonstone/20 transition-all group relative">
                                         <div className="flex justify-between items-start mb-6">
                                            <div>
                                               <p className="text-xs font-black text-brand-gunmetal">{c.name}</p>
                                               <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{c.arms?.length || 0} Registered Arms</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button className="p-2 hover:bg-brand-bg rounded-lg text-text-muted"><Edit3 size={14} /></button>
                                               <button className="p-2 hover:bg-brand-error/10 rounded-lg text-brand-error"><Trash2 size={14} /></button>
                                            </div>
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                            {c.arms?.map((a: any, j: number) => (
                                               <span key={j} className="text-[9px] font-black uppercase text-brand-moonstone bg-brand-moonstone/10 px-3 py-1 rounded-lg">
                                                  {a.label}
                                               </span>
                                            ))}
                                            <button className="w-6 h-6 rounded-lg bg-brand-bg text-text-muted flex items-center justify-center hover:bg-brand-moonstone/10 hover:text-brand-moonstone transition-colors"><Plus size={12} /></button>
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
              <div className="card bg-brand-gunmetal text-white border-none shadow-2xl overflow-hidden relative group">
                 <div className="absolute -right-4 -bottom-4 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                    <ShieldCheck size={120} />
                 </div>
                 <div className="relative z-10 flex flex-col gap-6">
                    <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Core Integrity</h4>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-display font-black tracking-tighter italic">99.2</span>
                       <span className="text-lg font-black text-brand-moonstone">%</span>
                    </div>
                    <p className="text-[10px] font-medium text-white/40 leading-relaxed italic pr-12">"Registry synchronization is optimal across all campus structural nodes."</p>
                    
                    <button className="mt-6 w-full bg-white text-brand-gunmetal py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
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
                 <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2">System Shortcuts</h4>
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
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-brand-gunmetal text-white shadow-xl" : "text-text-muted hover:bg-brand-bg"
      )}
    >
       {icon} {label}
    </button>
  );
}

function MiniSummary({ label, val }: any) {
  return (
    <div className="bg-white border border-black/5 rounded-[24px] p-5 shadow-sm">
       <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
       <p className="text-lg font-black text-brand-gunmetal tracking-tight">{val}</p>
    </div>
  );
}

function Shortcut({ label }: any) {
  return (
    <button className="w-full flex justify-between items-center p-4 bg-white border border-black/5 rounded-xl hover:bg-brand-bg transition-all group">
       <span className="text-[9px] font-black text-brand-gunmetal uppercase tracking-widest">{label}</span>
       <ChevronRight size={14} className="text-text-muted group-hover:text-brand-moonstone transition-colors" />
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
