"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  BarChart3, 
  UserPlus, 
  Target, 
  CreditCard, 
  Search, 
  ChevronRight,
  TrendingUp,
  Clock,
  ClipboardList,
  Mail,
  MoreVertical,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdmissionsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/admissions/stats"),
          fetch("/api/admissions?status=FEE_CONFIRMED")
        ]);
        const sData = await sRes.json();
        const cData = await cRes.json();
        setStats(sData);
        setCandidates(cData.admissions || []);
      } catch (err) {
        console.error("Admissions fetch failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase italic">Growth Command</h1>
            <p className="text-text-secondary text-sm font-medium mt-1 tracking-tight">Institutional expansion metrics & applicant lifecycle management.</p>
          </div>
          <div className="flex gap-2">
             <button className="bg-white border border-black/5 rounded-2xl px-5 py-3 flex items-center gap-2 shadow-sm font-black text-[10px] uppercase tracking-widest text-brand-moonstone hover:bg-brand-bg transition-all active:scale-95">
                <Target size={14} /> Recruitment Strategy
             </button>
             <button className="bg-brand-gunmetal text-white rounded-2xl px-5 py-3 flex items-center gap-2 shadow-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95">
                <UserPlus size={14} /> New Inquiry
             </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <KPICard label="Total Inquiries" value={stats?.total || "0"} icon={<Activity size={20} />} trend="+12%" color="moonstone" />
           <KPICard label="Fee Confirmed" value={stats?.feeConfirmed || "0"} icon={<CreditCard size={20} />} trend="Stable" color="moonstone" />
           <KPICard label="Yield Rate" value={`${stats?.yieldPct || "0"}%`} icon={<BarChart3 size={20} />} trend={parseFloat(stats?.yieldPct) >= 50 ? "Target Met" : "Low"} color="saffron" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Conversion Funnel (Left 1.5/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="card">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest">Growth Funnel Visualization</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Term Logic 2026/1</p>
               </div>
               
               <div className="flex flex-col gap-6">
                  <FunnelStage label="Total Inquiries" val={stats?.total || 0} max={stats?.total || 1} color="brand-moonstone" />
                  <FunnelStage label="Screened / Qualified" val={stats?.qualified || 0} max={stats?.total || 1} color="brand-moonstone" />
                  <FunnelStage label="Offer Extended" val={stats?.offered || 0} max={stats?.total || 1} color="brand-saffron" />
                  <FunnelStage label="Fee Confirmed" val={stats?.enrolled || 0} max={stats?.total || 1} color="brand-success" />
               </div>
            </div>

            {/* Candidate Queue Table */}
            <div className="card p-0 overflow-hidden shadow-2xl border-none">
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white">
                <div>
                   <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest">Entrance Exam Queue</h3>
                   <p className="text-[10px] font-bold text-text-muted uppercase mt-1">Awaiting Score Recording</p>
                </div>
                <div className="bg-brand-bg rounded-xl px-3 py-1 text-[10px] font-black text-brand-moonstone">
                   {candidates.length} ACTIVE
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-brand-bg text-[9px] font-black uppercase tracking-[0.15em] text-text-muted">
                    <tr>
                      <th className="px-8 py-4">Applicant</th>
                      <th className="px-8 py-4">Target Locus</th>
                      <th className="px-8 py-4 text-center">Protocol</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 text-sm">
                    {loading ? (
                       <tr><td colSpan={4} className="py-20 text-center font-black text-text-muted uppercase tracking-widest animate-pulse italic">Synchronizing Queue...</td></tr>
                    ) : candidates.length === 0 ? (
                       <tr><td colSpan={4} className="py-20 text-center font-black text-text-muted uppercase tracking-widest italic opacity-50">Queue Empty</td></tr>
                    ) : (
                      candidates.slice(0, 10).map((c: any) => (
                        <tr key={c.id} className="group hover:bg-brand-bg/50 transition-colors">
                          <td className="px-8 py-5">
                             <p className="font-black text-brand-gunmetal leading-none">{c.applicantName}</p>
                             <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">{c.parentPhone}</p>
                          </td>
                          <td className="px-8 py-5">
                             <p className="font-bold text-text-secondary text-xs">{c.targetClass} • {c.campus}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <input placeholder="Score" type="number" className="w-16 bg-white border border-black/5 rounded-md px-2 py-1 text-xs font-black text-center outline-none focus:ring-2 focus:ring-brand-moonstone/10" />
                                <button className="bg-brand-moonstone text-white p-1.5 rounded-md hover:opacity-80 transition-opacity">
                                   <ClipboardList size={14} />
                                </button>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button className="text-text-muted hover:text-brand-gunmetal">
                                <MoreVertical size={16} />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-8">
            
            {/* Exam Configuration */}
            <div className="card glass-premium flex flex-col gap-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-moonstone/10 rounded-xl">
                   <Clock className="text-brand-moonstone" size={20} />
                 </div>
                 <h4 className="font-black text-brand-gunmetal uppercase text-xs tracking-widest">Exam Logistics</h4>
               </div>
               
               <p className="text-[11px] text-text-secondary font-medium leading-relaxed italic">"Next entrance exam session is scheduled for Friday. Automation is set to trigger reminders at T-24h."</p>

               <div className="flex flex-col gap-2">
                  <button className="w-full flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-black/5 group hover:bg-white transition-all">
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand-gunmetal">Update Logistics</span>
                     <ChevronRight className="text-text-muted group-hover:text-brand-moonstone" size={14} />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-black/5 group hover:bg-white transition-all">
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand-gunmetal">Remind All (24h)</span>
                     <Mail className="text-text-muted group-hover:text-brand-moonstone" size={14} />
                  </button>
               </div>
            </div>

            {/* Conversion Pulse */}
            <div className="bg-brand-gunmetal rounded-2xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity size={80} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-saffron italic">Yield Optimal</h3>
                  <p className="text-[10px] font-medium text-white/50 mt-1">Growth vectors matching baseline targets.</p>
                  
                  <div className="mt-8 flex items-baseline gap-2">
                     <span className="text-4xl font-display font-black tracking-tighter italic">{stats?.yieldPct || "0"}%</span>
                     <TrendingUp className="text-brand-success" size={20} />
                  </div>

                  <button className="mt-8 w-full bg-white text-brand-gunmetal py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform active:scale-95">
                    Strategic Report
                  </button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function FunnelStage({ label, val, max, color }: any) {
  const pct = Math.max(5, (val / max) * 100);
  return (
     <div className="flex flex-col gap-2 group">
        <div className="flex justify-between items-baseline px-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-brand-moonstone transition-colors">{label}</span>
           <span className="text-xs font-black text-brand-gunmetal italic">{val.toLocaleString()}</span>
        </div>
        <div className="h-5 bg-brand-bg rounded-full overflow-hidden border border-black/5 shadow-inner">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${pct}%` }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className={clsx("h-full rounded-full shadow-lg", `bg-${color}`)}
           />
        </div>
     </div>
  );
}

function KPICard({ label, value, icon, trend, color }: any) {
  return (
    <div className="card h-44 flex flex-col justify-between p-8 group hover:-translate-y-1 transition-all shadow-premium border-none">
       <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-text-muted">{label}</h3>
          <div className="p-3 bg-brand-bg rounded-xl text-brand-moonstone group-hover:scale-110 transition-transform">
             {icon}
          </div>
       </div>
       <div>
          <div className="text-4xl font-display font-black tracking-tighter text-brand-gunmetal italic mb-1">{value}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-brand-moonstone">{trend}</div>
       </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
