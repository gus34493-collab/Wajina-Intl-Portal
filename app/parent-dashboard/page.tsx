"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Users, 
  Percent, 
  Wallet, 
  GraduationCap, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  FileText,
  BadgeAlert
} from "lucide-react";
import { motion } from "framer-motion";

export default function ParentDashboard() {
  const [wards, setWards] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, complaintsRes] = await Promise.all([
          fetch("/api/parent/dashboard"),
          fetch("/api/complaints") // We'll need to migrate this endpoint too
        ]);
        
        const dashData = await dashRes.json();
        setWards(dashData.wards || []);
        
        // Handle case where complaints API isn't migrated yet
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData || []);
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate dynamic stats
  const avgAttendance = wards.length 
    ? (wards.reduce((acc, w) => acc + (w.attendanceRate || 0), 0) / wards.length).toFixed(1)
    : "0";
  
  const pendingFeesCount = wards.filter(w => !w.hasPaid).length;
  const isSecondary = wards.some(w => w.campus === "SECONDARY");

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Users className="text-brand-moonstone" />} 
            label="Enrolled Wards" 
            value={wards.length} 
            subValue="Children registered"
          />
          <StatCard 
            icon={<Percent className="text-brand-saffron" />} 
            label="Average Attendance" 
            value={`${avgAttendance}%`} 
            subValue="Term-to-date"
          />
          <StatCard 
            icon={<Wallet className={pendingFeesCount > 0 ? "text-brand-error" : "text-brand-success"} />} 
            label="Financial Standing" 
            value={pendingFeesCount === 0 ? "Cleared" : "Attention"} 
            subValue={pendingFeesCount === 0 ? "All fees settled" : `${pendingFeesCount} billing(s) pending`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Children Overview (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-xl font-display font-black text-brand-gunmetal px-2">Family Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wards.map((ward, idx) => (
                <WardCard key={ward.id} ward={ward} index={idx} />
              ))}
              {wards.length === 0 && !loading && (
                <div className="col-span-2 card bg-black/5 border-dashed border-2 border-black/10 flex flex-col items-center justify-center py-16 opacity-60">
                  <p className="font-bold text-text-muted">No children linked to this account</p>
                  <p className="text-xs">Please contact the Registrar for synchronization.</p>
                </div>
              )}
            </div>

            {/* Support Tickets Section */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-brand-gunmetal">Recent Support Tickets</h4>
                <button className="text-[10px] font-black uppercase tracking-widest text-brand-moonstone hover:underline">New Ticket</button>
              </div>
              <div className="space-y-4">
                {complaints.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-brand-bg border border-black/5 group hover:border-brand-moonstone/20 transition-all">
                    <div className={`w-1 h-10 rounded-full ${c.status === 'RESOLVED' ? 'bg-brand-success' : 'bg-brand-moonstone'} opacity-40`} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-brand-gunmetal">{c.subject}</p>
                        <span className="text-[10px] font-black text-text-muted">{c.status}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1">{c.message}</p>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-center text-xs text-text-muted py-4">No active support tickets found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Modules (Right 1/3) */}
          <div className="flex flex-col gap-6">
            
            {/* Campus Roadmap Module */}
            <div className="card glass-premium">
              <h4 className="font-black text-brand-gunmetal mb-4">
                {isSecondary ? 'Secondary Roadmap' : 'Primary Path'}
              </h4>
              <div className="space-y-4">
                {isSecondary ? (
                   <RoadmapItem 
                    date="Oct 28" 
                    title="Mid-Term Cycle" 
                    sub="Secondary-wide Assessments"
                    accent="bg-brand-moonstone"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-brand-moonstone/5 border border-brand-moonstone/10">
                      <span className="text-[10px] font-black text-brand-moonstone uppercase">Current</span>
                      <p className="font-bold text-sm mt-1">Numeracy & Logic</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Room 104 • Mr. Adebayo</p>
                    </div>
                    <div className="p-4 rounded-xl bg-brand-saffron/5 border border-brand-saffron/10">
                      <span className="text-[10px] font-black text-brand-saffron uppercase tracking-wider">Upcoming (11:00)</span>
                      <p className="font-bold text-sm mt-1">Literacy & Diction</p>
                      <p className="text-[10px] text-text-muted mt-0.5">Main Library • Mrs. Okafor</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* School Announcements */}
            <div className="card bg-brand-gunmetal text-white border-none shadow-soft overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <h4 className="font-black text-brand-saffron mb-4 text-xs uppercase tracking-widest">Global Announcements</h4>
              <div className="space-y-6 relative">
                <div>
                  <p className="font-bold text-sm">Inter-House Sports Day</p>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">Friday, Nov 1st. Students should wear their respective house colors.</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-bold text-sm">PTA General Meeting</p>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">Agenda: 2026 Vision & Expansion. Venue: Main Auditorium.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: any, subValue: string }) {
  return (
    <div className="card flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-xl font-display font-black text-brand-gunmetal my-0.5 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-brand-moonstone">{subValue}</p>
      </div>
    </div>
  );
}

function WardCard({ ward, index }: { ward: any, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card group hover:border-brand-moonstone/30"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand-bg grid place-items-center font-black text-brand-gunmetal text-lg shadow-sm">
          {ward.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-brand-gunmetal text-sm truncate">{ward.name}</h4>
            <span className={clsx(
              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
              ward.campus === "SECONDARY" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {ward.campus}
            </span>
          </div>
          <p className="text-xs text-text-muted font-bold mt-0.5">{ward.class.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-brand-bg rounded-xl border border-black/5">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Term GPA</p>
          <p className="text-sm font-black text-brand-gunmetal mt-1">{ward.avgGrade.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-brand-bg rounded-xl border border-black/5">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Attendance</p>
          <p className="text-sm font-black text-brand-gunmetal mt-1">{ward.attendanceRate}%</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 bg-brand-bg text-brand-gunmetal border border-black/5 font-black text-[10px] py-3 rounded-lg hover:bg-black/5 transition-all">
          Academic Records
        </button>
        <button className="flex-1 bg-brand-bg text-brand-moonstone border border-brand-moonstone/10 font-black text-[10px] py-3 rounded-lg hover:bg-brand-moonstone/5 transition-all">
          Fees & Receipts
        </button>
      </div>
    </motion.div>
  );
}

function RoadmapItem({ date, title, sub, accent }: { date: string, title: string, sub: string, accent: string }) {
  return (
    <div className="flex gap-4 items-center p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.04] transition-all cursor-pointer">
      <div className={clsx("w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0", accent)}>
        <span className="text-[9px] font-bold uppercase opacity-80">{date.split(' ')[0]}</span>
        <span className="text-base font-black leading-none">{date.split(' ')[1]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-brand-gunmetal truncate">{title}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
