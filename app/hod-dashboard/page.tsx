"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Zap, 
  Star, 
  ClipboardCheck, 
  MessageSquare, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HODDashboard() {
  const [data, setData] = useState<any>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHODData() {
      try {
        const [rRes, pRes] = await Promise.all([
          fetch("/api/requests?status=PENDING"),
          fetch("/api/grades/pending-review")
        ]);
        const rData = await rRes.json();
        const pData = await pRes.json();
        
        setData(rData);
        setPendingTotal(pData.total || 0);

      } catch (err) {
        console.error("HOD dashboard fetch failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHODData();
  }, []);

  const performanceAlerts = (data?.requests || []).filter((r: any) => 
    (r.title || "").toLowerCase().includes("performance") || 
    (r.description || "").toLowerCase().includes("scored")
  );

  const tasks = (data?.requests || []).filter((r: any) => 
    !(r.title || "").toLowerCase().includes("performance") &&
    !(r.description || "").toLowerCase().includes("scored")
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase italic">Departmental Command</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Monitoring departmental performance, result integrity, and teacher compliance.</p>
          </div>
          <div className="bg-white border border-black/5 rounded-2xl px-5 py-3 shadow-md flex items-center gap-3">
            <Calendar size={16} className="text-brand-moonstone" />
            <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-[0.2em]">Academic Cycle 2026</span>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card border-l-4 border-l-brand-moonstone flex items-center justify-between p-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-moonstone/10 flex items-center justify-center font-display font-black text-brand-moonstone text-xl">
                   {performanceAlerts.length}
                </div>
                <div>
                   <h3 className="text-[11px] font-black uppercase text-text-muted tracking-widest">Elite Performance Alerts</h3>
                   <p className="text-[10px] font-bold text-brand-moonstone mt-1">+90% Subject Mastery Detected</p>
                </div>
             </div>
             <Star className="text-brand-saffron" size={24} />
          </div>
          <div className="card border-l-4 border-l-brand-saffron flex items-center justify-between p-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-saffron/10 flex items-center justify-center font-display font-black text-brand-saffron text-xl">
                   {pendingTotal}
                </div>
                <div>
                   <h3 className="text-[11px] font-black uppercase text-text-muted tracking-widest">Awaiting HOD Signature</h3>
                   <p className="text-[10px] font-bold text-brand-saffron mt-1">Pending validation in registry</p>
                </div>
             </div>
             <ClipboardCheck className="text-text-muted opacity-20" size={24} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Elite Achievements (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="card">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                    <Zap className="text-brand-saffron" size={18} />
                    High Performance Matrix
                  </h3>
                  <button className="text-[10px] font-black text-brand-moonstone uppercase tracking-widest">View History</button>
               </div>

               <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {loading ? (
                       Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="h-20 bg-brand-bg rounded-xl animate-pulse" />
                       ))
                    ) : performanceAlerts.length === 0 ? (
                       <div className="py-20 text-center opacity-40 italic text-xs font-black text-text-muted uppercase tracking-widest">
                         No elite performance alerts in current cycle.
                       </div>
                    ) : (
                      performanceAlerts.map((a: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-5 bg-brand-bg rounded-2xl border border-black/5 hover:border-brand-moonstone/20 transition-all cursor-default group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                 <Star className="text-brand-saffron" size={16} />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-brand-gunmetal group-hover:text-brand-moonstone transition-colors">{a.title}</p>
                                 <p className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-widest leading-none truncate max-w-[300px]">{a.description}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-brand-success uppercase tracking-widest">+90% AVG</p>
                                 <p className="text-[8px] font-bold text-text-muted mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                              </div>
                              <button className="text-text-muted group-hover:text-brand-gunmetal transition-colors">
                                 <MoreHorizontal size={16} />
                              </button>
                           </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Departmental Tasks */}
            <div className="card overflow-hidden p-0 border-none shadow-premium">
              <div className="p-8 border-b border-black/5 bg-white">
                 <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                   <ClipboardCheck className="text-brand-moonstone" size={18} />
                   Actionable Tasks
                 </h3>
              </div>
              <div className="divide-y divide-black/5">
                {tasks.map((t: any, i: number) => (
                  <div key={i} className="p-8 hover:bg-brand-bg/50 transition-colors flex gap-6 items-start">
                     <div className="w-1 bg-brand-saffron h-full self-stretch rounded-full" />
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-black text-brand-gunmetal text-xs uppercase tracking-widest leading-tight">{t.title}</h4>
                           <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest shrink-0">{new Date(t.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-medium text-text-secondary leading-relaxed line-clamp-2">{t.description}</p>
                        <div className="mt-4 flex gap-2">
                           <button className="text-[9px] font-black px-3 py-1.5 bg-brand-moonstone text-white rounded-lg hover:opacity-90 transition-opacity uppercase tracking-widest">Sign Off</button>
                           <button className="text-[9px] font-black px-3 py-1.5 bg-brand-bg text-text-secondary rounded-lg hover:bg-white border border-black/5 transition-all uppercase tracking-widest">Query</button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Support (Right 1/3) */}
          <div className="flex flex-col gap-8">
            
            {/* Department Health */}
            <div className="card bg-brand-gunmetal text-white border-none shadow-2xl overflow-hidden relative group">
               <div className="absolute -right-4 -bottom-4 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                  <ShieldCheck size={120} />
               </div>
               <div className="relative z-10 flex flex-col gap-6">
                  <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Compliance Status</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-5xl font-display font-black tracking-tighter italic">92</span>
                     <span className="text-lg font-black text-brand-moonstone">%</span>
                  </div>
                  <p className="text-[10px] font-medium text-white/40 leading-relaxed italic pr-12">"Integrity metrics indicate consistent grade entry and lesson note submission across the department."</p>
                  
                  <button className="mt-6 w-full bg-white text-brand-gunmetal py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                     Generate Audit <TrendingUp size={14} className="text-brand-success" />
                  </button>
               </div>
            </div>

            {/* Quick Actions Feed */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2">Institutional Shortcuts</h4>
              <QuickAction label="Academic Calendar" icon={<Calendar size={14} />} />
              <QuickAction label="Faculty Discussion" icon={<MessageSquare size={14} />} />
              <QuickAction label="Archived Results" icon={<ChevronRight size={14} />} />
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickAction({ label, icon }: { label: string, icon: any }) {
  return (
    <button className="flex justify-between items-center p-5 bg-white border border-black/5 rounded-2xl hover:bg-brand-bg transition-all group">
       <div className="flex items-center gap-3">
          <div className="text-brand-moonstone/50 group-hover:text-brand-moonstone transition-colors group-hover:scale-110">
             {icon}
          </div>
          <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-widest">{label}</span>
       </div>
    </button>
  );
}
