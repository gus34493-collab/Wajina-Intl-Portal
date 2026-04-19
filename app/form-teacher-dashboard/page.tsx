"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Users, 
  MessageSquare, 
  HandMetal, 
  ShieldCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Mail,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FormTeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock arm for now or get from context if available
  const managedArm = { id: "mock-arm-id", fullName: "SS3 Alpha" };

  useEffect(() => {
    async function fetchFormTeacherData() {
      try {
        const [rRes, aRes] = await Promise.all([
          fetch("/api/requests?status=PENDING"),
          fetch(`/api/attendance/summary?armId=${managedArm.id}`)
        ]);
        const rData = await rRes.json();
        const aData = await aRes.json();
        
        setData(rData);
        setAttendance(aData);

      } catch (err) {
        console.error("Form Teacher fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFormTeacherData();
  }, []);

  const parentRequests = (data?.requests || []).filter((r: any) => 
    r.sender?.role === 'PARENT' || r.title.toLowerCase().includes('parent')
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase italic underline decoration-brand-moonstone/30">Form Master Cockpit</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Institutional oversight for <span className="text-brand-moonstone font-black uppercase tracking-widest">{managedArm.fullName}</span>.</p>
          </div>
          <div className="bg-white border border-black/5 rounded-[32px] px-8 py-4 shadow-xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-brand-moonstone/10 flex items-center justify-center text-brand-moonstone">
                <Users size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Assigned Locus</p>
                <p className="text-sm font-black text-brand-gunmetal tracking-tight">{managedArm.fullName}</p>
             </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
             label="Arm Attendance" 
             value={attendance?.rate ? `${attendance.rate}%` : "94%"} 
             sub="Daily Synchronization" 
             icon={<UserCheck className="text-brand-success" />} 
             color="moonstone" 
          />
          <KPICard 
             label="Parent Signals" 
             value={parentRequests.length || "0"} 
             sub="Awaiting Response" 
             icon={<MessageSquare className="text-brand-saffron" />} 
             color="saffron" 
          />
          <KPICard 
             label="Registry Status" 
             value="Terminal" 
             sub="Grade Entry Verified" 
             icon={<ShieldCheck className="text-brand-moonstone" />} 
             color="moonstone" 
             dark
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Parent Communication Hub */}
            <div className="card">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                    <Mail size={18} className="text-brand-moonstone" />
                    Parent Intelligence Feed
                  </h3>
                  <button className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand-moonstone transition-colors">Archive</button>
               </div>

               <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {loading ? (
                       Array.from({ length: 3 }).map((_, i) => (
                         <div key={i} className="h-24 bg-brand-bg rounded-2xl animate-pulse" />
                       ))
                    ) : parentRequests.length === 0 ? (
                       <div className="py-12 bg-brand-bg rounded-[32px] text-center border-2 border-dashed border-black/5">
                          <CheckCircle2 size={40} className="mx-auto text-brand-success opacity-20 mb-4" />
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">All guardian communications resolved.</p>
                       </div>
                    ) : (
                      parentRequests.map((r: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-6 bg-brand-bg rounded-[24px] border border-black/5 hover:border-brand-moonstone/20 transition-all group cursor-pointer"
                        >
                           <div className="flex items-center gap-5">
                              <div className={clsx(
                                "w-1.5 h-12 rounded-full",
                                r.level === 'K3' ? "bg-brand-error" : "bg-brand-moonstone"
                              )} />
                              <div>
                                 <p className="text-xs font-black text-brand-gunmetal">{r.title}</p>
                                 <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest leading-none">From: {r.sender?.name || "Guardian"} • {new Date(r.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <button className="flex items-center gap-2 bg-white text-brand-gunmetal px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-transform active:scale-95">
                              Handle Signal <ArrowUpRight size={14} className="text-brand-moonstone" />
                           </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Attendance Analytics (Mock) */}
            <div className="card h-80 overflow-hidden relative border-none shadow-2xl p-0">
               <div className="absolute inset-0 bg-brand-gunmetal" />
               <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-brand-saffron uppercase tracking-[0.2em] italic">Attendance Velocity</h3>
                     <span className="text-[10px] font-black text-white/50 uppercase">7-Day Snapshot</span>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4 h-32 px-4">
                     {[85, 92, 78, 95, 88, 91, 94].map((v, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ height: 0 }}
                         animate={{ height: `${v}%` }}
                         className="flex-1 bg-gradient-to-t from-brand-moonstone to-brand-moonstone/30 rounded-t-lg relative group"
                       >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-brand-gunmetal text-[8px] font-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{v}%</div>
                       </motion.div>
                     ))}
                  </div>

                  <div className="flex justify-between items-center text-white/30 text-[8px] font-black uppercase tracking-widest">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-8">
            
            {/* Class Clearance Status */}
            <div className="card flex flex-col items-center justify-center p-8 bg-white border border-black/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 p-8 opacity-5 -rotate-12 transition-transform group-hover:rotate-0">
                   <ShieldCheck size={120} />
                </div>
                <h4 className="font-black text-brand-gunmetal mb-10 self-start uppercase text-xs tracking-widest">Locus Integrity</h4>
                
                <div className="flex flex-col items-center gap-2">
                   <TrendingUp className="text-brand-success mb-2" size={32} />
                   <p className="text-3xl font-display font-black text-brand-gunmetal italic leading-none tracking-tight">EXCELLENT</p>
                   <p className="text-[10px] font-black text-brand-success uppercase tracking-widest mt-1">98% Grade Completion</p>
                </div>

                <div className="mt-12 w-full grid grid-cols-2 gap-3">
                   <StatMini label="Scholars" val="28" />
                   <StatMini label="Avg GPA" val="3.42" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
               <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2">Operational Levers</h4>
               <ActionLink label="Class Attendance Register" icon={<UserCheck size={14} />} />
               <ActionLink label="Terminal Review Queue" icon={<FileText size={14} />} />
               <ActionLink label="Parent Outreach Logs" icon={<MessageSquare size={14} />} />
               <ActionLink label="Class Gallery & Media" icon={<TrendingUp size={14} />} />
            </div>

            {/* Emergency / Critical Alert */}
            <div className="bg-brand-error/5 border border-brand-error/10 rounded-[32px] p-8 mt-4">
               <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-brand-error" size={20} />
                  <p className="text-[10px] font-black text-brand-error uppercase tracking-widest">Incident Signal</p>
               </div>
               <p className="text-xs font-medium text-brand-gunmetal leading-relaxed line-clamp-2 italic">"Institutional compliance requires the secondary curriculum log by end of week."</p>
               <button className="mt-6 w-full py-3 bg-brand-error text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity">Launch Resolution</button>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatMini({ label, val }: any) {
  return (
    <div className="bg-brand-bg rounded-2xl p-4 border border-black/5">
       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{label}</p>
       <p className="text-base font-black text-brand-gunmetal tracking-tight">{val}</p>
    </div>
  );
}

function ActionLink({ label, icon }: any) {
  return (
    <button className="w-full flex justify-between items-center p-5 bg-white border border-black/5 rounded-[24px] hover:bg-brand-bg transition-all group">
       <div className="flex items-center gap-4">
          <div className="text-brand-moonstone/50 group-hover:text-brand-moonstone transition-colors group-hover:scale-110">
             {icon}
          </div>
          <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-widest">{label}</span>
       </div>
       <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

function KPICard({ label, value, sub, icon, color, dark = false }: any) {
  return (
    <div className={clsx(
      "card h-44 border-none flex flex-col justify-between p-8 group hover:-translate-y-1 transition-all shadow-premium",
      dark ? "bg-brand-gunmetal text-white" : "bg-white text-brand-gunmetal"
    )}>
       <div className="flex justify-between items-center">
          <h3 className={clsx("text-[11px] font-black uppercase tracking-widest", dark ? "text-white/40" : "text-text-muted")}>{label}</h3>
          <div className="p-3 bg-brand-bg rounded-xl">
             {icon}
          </div>
       </div>
       <div>
          <div className="text-4xl font-display font-black tracking-tighter italic mb-1 leading-none">{value}</div>
          <p className={clsx("text-[10px] font-black uppercase tracking-widest", dark ? "text-brand-saffron" : "text-brand-success")}>{sub}</p>
       </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
