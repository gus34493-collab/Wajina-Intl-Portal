"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  ClipboardCheck, 
  History,
  Activity,
  ArrowUpRight,
  Search,
  MoreVertical,
  Mail,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";

export default function HRDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHRData() {
      try {
        const res = await fetch("/api/hr");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("HR fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHRData();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase">Human Capital Command</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Managing institutional talent, enrollment pipelines, and staff lifecycle.</p>
          </div>
          <div className="flex gap-2">
             <button className="bg-white border border-black/5 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm font-black text-[10px] uppercase tracking-widest text-brand-moonstone hover:bg-brand-bg transition-colors">
                <Mail size={14} /> Send Broadcast
             </button>
             <button className="bg-brand-gunmetal text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity">
                <UserPlus size={14} /> New Onboarding
             </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Campus Personnel" 
            value={data?.summary?.activeStaff || "0"} 
            sub="All roles active" 
            icon={<Users className="text-brand-moonstone" />}
            color="moonstone"
          />
          <StatCard 
            label="Enrolled Scholars" 
            value={data?.staff?.length || "0"} // Placeholder for student count logic
            sub="Active enrollment" 
            icon={<GraduationCap className="text-brand-moonstone" />}
            color="moonstone"
          />
          <StatCard 
            label="Recruitment Pipeline" 
            value={data?.summary?.pendingOnboarding || "0"} 
            sub="Awaiting confirmation" 
            icon={<ShieldAlert className="text-brand-saffron" />} 
            color="gunmetal"
            dark
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Preparation List (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-display font-black text-brand-gunmetal tracking-tight uppercase">Personnel Directory</h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Managed Staff List</p>
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                   <input 
                     placeholder="Filter staff members..."
                     className="bg-brand-bg border border-black/5 rounded-lg py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-moonstone/10"
                   />
                </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                      <tr className="bg-brand-bg text-[10px] font-black uppercase text-text-muted tracking-widest text-left">
                        <th className="px-6 py-4 rounded-l-xl">Member</th>
                        <th className="px-6 py-4 text-center">Designation</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 rounded-r-xl"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {loading ? (
                         <tr><td colSpan={4} className="py-20 text-center text-text-muted font-black uppercase tracking-widest italic animate-pulse">Syncing Personnel Data...</td></tr>
                      ) : data?.staff.map((s: any) => (
                        <tr key={s.id} className="group hover:bg-brand-bg/50 transition-colors">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-brand-moonstone/10 flex items-center justify-center font-display font-black text-brand-moonstone">
                                 {s.name.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-xs font-black text-brand-gunmetal leading-none">{s.name}</p>
                                 <p className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-widest">{s.email}</p>
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[9px] font-black bg-brand-bg border border-black/5 text-brand-gunmetal px-2.5 py-1 rounded-md uppercase tracking-widest">
                              {s.role}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <div className="flex items-center justify-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                               <span className="text-[9px] font-black text-brand-success uppercase tracking-widest">{s.status}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <button className="p-2 text-text-muted hover:text-brand-gunmetal transition-colors">
                               <MoreVertical size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>

          {/* Audit & Pulse (Right 1/3) */}
          <div className="flex flex-col gap-8">
            
            {/* Staff Audit Trail */}
            <div className="card">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                    <History size={16} className="text-brand-moonstone" />
                    Lifecycle Audit
                  </h3>
                  <button className="text-[10px] font-black text-text-muted hover:text-brand-moonstone transition-colors uppercase tracking-widest">View All</button>
               </div>

               <div className="relative pl-6 space-y-8 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5">
                  <AuditItem action="Role Updated" member="Adebayo Samuel" time="14:22" detail="Promoted to HOD Science" />
                  <AuditItem action="Attendance Logged" member="Chika Obi" time="13:05" detail="Primary Campus Sign-in" />
                  <AuditItem action="New Onboarding" member="Esther Johnson" time="11:40" detail="Admin Staff Registry" />
                  <AuditItem action="Profile Hardened" member="Systems" time="09:15" detail="2FA Verification Required" />
               </div>
            </div>

            {/* Preparation Activity */}
            <div className="bg-brand-gunmetal rounded-2xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity size={80} />
               </div>
               <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-saffron">Enrollment Pulse</h3>
                  <p className="text-[10px] font-medium text-white/50 mt-1">Awaiting confirmation for NEXT session</p>
                  
                  <div className="mt-8 flex items-baseline gap-2">
                     <span className="text-4xl font-display font-black tracking-tighter italic">24</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Verified Offers</span>
                  </div>

                  <button className="mt-8 w-full bg-white text-brand-gunmetal py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
                    Launch Reports <ArrowUpRight size={14} />
                  </button>
               </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value, sub, icon, color, dark = false }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={clsx(
        "card h-44 flex flex-col justify-between p-8 border-none shadow-premium",
        dark ? "bg-brand-gunmetal text-white" : "bg-white text-brand-gunmetal"
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className={clsx("text-[10px] font-black uppercase tracking-widest", dark ? "text-white/40" : "text-text-muted")}>{label}</h3>
        <div className="p-3 bg-brand-bg rounded-xl">
           {icon}
        </div>
      </div>
      <div>
        <div className="text-4xl font-display font-black tracking-tighter leading-none mb-1">{value}</div>
        <div className={clsx("text-[10px] font-black uppercase tracking-widest", dark ? "text-brand-saffron" : "text-brand-success")}>{sub}</div>
      </div>
    </motion.div>
  );
}

function AuditItem({ action, member, time, detail }: any) {
  return (
    <div className="relative">
      <div className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-brand-moonstone ring-4 ring-brand-bg" />
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-[11px] font-black text-brand-gunmetal leading-none truncate">{action}</p>
          <span className="text-[9px] font-bold text-text-muted shrink-0 uppercase tracking-widest">{time}</span>
        </div>
        <p className="text-[10px] font-bold text-text-secondary leading-tight">{member}</p>
        <p className="text-[9px] font-medium text-text-muted italic mt-1">{detail}</p>
      </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
