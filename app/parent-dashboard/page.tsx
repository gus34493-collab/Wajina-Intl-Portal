"use client";

import { useState, useEffect, Suspense } from "react";
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
import PaymentModal from "@/app/components/PaymentModal";
import { toast } from "sonner"; // Assuming sonner is used, if not we'll use alert
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ParentDashboardContent() {
  const [wards, setWards] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "cancelled") toast.error("Payment was cancelled.");
    if (paymentStatus === "failed") toast.error("Payment verification failed.");
    if (paymentStatus === "error") toast.error("An error occurred during payment.");
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, complaintsRes] = await Promise.all([
          fetch("/api/parent/dashboard"),
          fetch("/api/complaints") 
        ]);
        
        const dashData = await dashRes.json();
        setWards(dashData.wards || []);
        
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            icon={<Users className="text-brand-primary" />}
            label="My Children"
            value={wards.length}
            subValue="Linked to this account"
          />
          <StatCard
            icon={<Percent className="text-brand-accent" />}
            label="Attendance Rate"
            value={`${avgAttendance}%`}
            subValue="Term Average"
          />
          <StatCard
            icon={<Wallet className={pendingFeesCount > 0 ? "text-brand-error" : "text-brand-success"} />}
            label="Fee Status"
            value={pendingFeesCount === 0 ? "ALL PAID" : "ACTION NEEDED"}
            subValue={pendingFeesCount === 0 ? "All paid up" : `${pendingFeesCount} unpaid fee(s)`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Children Overview (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-xl font-display font-black text-brand-primary px-2">Family Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wards.map((ward, idx) => (
                <WardCard 
                  key={ward.id} 
                  ward={ward} 
                  index={idx} 
                  onPaymentClick={(w) => {
                    setSelectedWard(w);
                    setIsPaymentModalOpen(true);
                  }}
                />
              ))}
              {wards.length === 0 && !loading && (
                <div className="col-span-2 card bg-black/5 border-dashed border-2 border-brand-primary/10 flex flex-col items-center justify-center py-16 opacity-60">
                  <p className="font-bold text-brand-primary/60">No children linked to this account.</p>
                  <p className="text-xs text-brand-primary/40">Please contact the school office.</p>
                </div>
              )}
            </div>

            {/* Support Tickets Section */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-brand-primary">Recent Support Tickets</h4>
                <button className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50 hover:text-brand-primary transition-colors">New Ticket</button>
              </div>
              <div className="space-y-4">
                {complaints.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-brand-blush border border-brand-primary/8 group hover:border-brand-primary/20 transition-all">
                    <div className={`w-1 h-10 rounded-full ${c.status === 'RESOLVED' ? 'bg-brand-success' : 'bg-brand-accent'} opacity-40`} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-brand-primary">{c.subject}</p>
                        <span className="text-token-micro font-black text-brand-primary/50">{c.status}</span>
                      </div>
                      <p className="text-xs text-brand-primary/60 mt-1 line-clamp-1">{c.message}</p>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-center text-xs text-brand-primary/40 py-4 font-bold uppercase tracking-widest">No support tickets yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Modules (Right 1/3) */}
          <div className="flex flex-col gap-6">
            
            {/* Campus Roadmap Module */}
            <div className="card glass-premium">
              <h4 className="font-black text-brand-primary mb-4">
                {isSecondary ? 'Secondary Roadmap' : 'Primary Path'}
              </h4>
              <div className="space-y-4">
                {isSecondary ? (
                   <RoadmapItem
                    date="Oct 28"
                    title="Mid-Term Exams"
                    sub="Secondary-wide Assessments"
                    accent="bg-brand-accent"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-brand-secondary/5 border border-brand-secondary/10">
                      <span className="text-token-micro font-black text-brand-secondary uppercase">Current</span>
                      <p className="font-bold text-sm mt-1">Numeracy & Logic</p>
                      <p className="text-token-micro text-brand-primary/50 mt-0.5">Room 104 • Mr. Adebayo</p>
                    </div>
                    <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/10">
                      <span className="text-token-micro font-black text-brand-accent uppercase tracking-wider">Upcoming (11:00)</span>
                      <p className="font-bold text-sm mt-1">Literacy & Diction</p>
                      <p className="text-token-micro text-brand-primary/50 mt-0.5">Main Library • Mrs. Okafor</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* School Announcements */}
            <div className="card bg-brand-primary text-white border-none shadow-soft overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <h4 className="font-black text-brand-accent mb-4 text-xs uppercase tracking-widest">School Announcements</h4>
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

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        ward={selectedWard} 
      />
    </DashboardShell>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
          <p className="text-token-micro font-black uppercase tracking-[0.2em] text-brand-primary/60">Loading your dashboard...</p>
        </div>
      </DashboardShell>
    }>
      <ParentDashboardContent />
    </Suspense>
  );
}


function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: any, subValue: string }) {
  return (
    <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300 shadow-xl">
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
        <div className="scale-125">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className="text-2xl font-display font-black text-brand-primary my-1 tracking-tighter uppercase">{value}</p>
        <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest">{subValue}</p>
      </div>
    </div>
  );
}

function WardCard({ ward, index, onPaymentClick }: { ward: any, index: number, onPaymentClick: (ward: any) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card group hover:border-brand-primary/10 bg-white flex flex-col p-10"
    >
      <div className="flex items-center gap-6 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary text-white grid place-items-center font-black text-2xl shadow-xl">
          {ward.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
               <h4 className="font-black text-brand-primary text-base truncate uppercase tracking-tight leading-none">{ward.name}</h4>
               <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
             </div>
             <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.3em] leading-none">
                {ward.campus} Campus
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
         <span className={cn(
           "px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
           ward.campus === "SECONDARY" ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-secondary/10 text-brand-secondary"
         )}>
           {ward.campus} Campus
         </span>
         <span className="px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest bg-brand-primary/5 text-brand-primary">
            {ward.class.name}
         </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-white/50 rounded-2xl border border-brand-primary/5 shadow-inner">
          <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.2em]">Academic GPA</p>
          <p className="text-lg font-black text-brand-primary mt-1">{ward.avgGrade.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-white/50 rounded-2xl border border-brand-primary/5 shadow-inner">
          <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.2em]">Attendance</p>
          <p className="text-lg font-black text-brand-primary mt-1">{ward.attendanceRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button className="w-full bg-brand-primary text-white font-black text-token-micro py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-brand-primary transition-all shadow-lg active:scale-95">
          View Academic Records
        </button>
        <button 
          onClick={() => onPaymentClick(ward)}
          className="w-full bg-white text-brand-primary border border-brand-primary/10 font-black text-token-micro py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white transition-all active:scale-95 shadow-sm"
        >
          Pay Fees
        </button>
      </div>
    </motion.div>
  );
}

function RoadmapItem({ date, title, sub, accent }: { date: string, title: string, sub: string, accent: string }) {
  return (
    <div className="flex gap-4 items-center p-4 rounded-xl bg-black/[0.02] border border-brand-primary/8 hover:bg-black/[0.04] transition-all cursor-pointer">
      <div className={clsx("w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0", accent)}>
        <span className="text-token-micro font-bold uppercase opacity-80">{date.split(' ')[0]}</span>
        <span className="text-base font-black leading-none">{date.split(' ')[1]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-brand-primary truncate">{title}</p>
        <p className="text-token-micro text-brand-primary/50 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

