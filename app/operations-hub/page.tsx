"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import {
  Zap,
  Settings,
  Users,
  FileText,
  ShieldAlert,
  Activity,
  ChevronRight,
  History,
  LayoutDashboard,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OperationsHubPage() {
  const router = useRouter();
  const [staffCount, setStaffCount] = useState<string>("--");
  const [studentCount, setStudentCount] = useState<string>("--");

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [staffRes, studentRes] = await Promise.all([
          fetch("/api/users/staff"),
          fetch("/api/users?role=STUDENT&status=ACTIVE&limit=1"),
        ]);
        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaffCount(String(Array.isArray(data) ? data.length : "--"));
        }
        if (studentRes.ok) {
          const data = await studentRes.json();
          setStudentCount(String(data.total ?? "--"));
        }
      } catch {
        // non-critical
      }
    }
    fetchCounts();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase flex items-center gap-3">
              Operational <span className="text-brand-secondary">Command</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-[0.3em] mt-1">
              Centralized orchestration hub for multi-campus institutional logistics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/director-audit-logs")} className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-brand-secondary/30 transition-all">
              <History size={16} />
              Command History
            </button>
            <button onClick={() => router.push("/school-config")} className="bg-white border-2 border-brand-secondary text-brand-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-brand-secondary/10 font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:bg-brand-secondary hover:text-white transition-all">
              <Settings size={16} />
              Global Config
            </button>
          </div>
        </div>

        {/* Rapid Action Strip */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <QuickAction label="Audit Finances" icon={<FileText size={18} />} onClick={() => router.push("/director-finances")} />
          <QuickAction label="Welfare Flag" icon={<ShieldAlert size={18} />} onClick={() => router.push("/parent-risk-families")} />
          <QuickAction label="Sync Systems" icon={<Activity size={18} />} highlight onClick={() => router.push("/operations-hub")} />
        </div>

        {/* Command Center Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Terminal Feed */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <div className="bg-white rounded-3xl overflow-hidden border border-brand-primary/8 shadow-sm">
              <div className="p-6 border-b border-brand-primary/8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} className="text-brand-secondary" />
                  <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro">Real-time Logistics Stream</h4>
                </div>
                <div className="flex items-center gap-3">
                  <Filter size={14} className="text-brand-tertiary" />
                  <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Filter Stream</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/[0.04] border border-brand-primary/8 flex items-center justify-center">
                  <Activity size={22} className="text-brand-primary/20" />
                </div>
                <div className="text-center">
                  <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/30">
                    Live Stream
                  </p>
                  <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/20 mt-1">
                    Coming Soon
                  </p>
                </div>
              </div>

              <div className="p-4 text-center border-t border-brand-primary/8">
                <button onClick={() => router.push("/director-audit-logs")} className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">
                  Load Forensic Data Logs
                </button>
              </div>
            </div>

            {/* Strategic Command Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CommandCard
                title="Staffing Pulse"
                desc="Institutional HR health and deployment status."
                stat={`${staffCount} Active`}
                trend="Staff on record"
              />
              <CommandCard
                title="Enrollment Velocity"
                desc="Real-time admissions and retention metrics."
                stat={`${studentCount} Pupils`}
                trend="Active enrollment"
                highlight
              />
            </div>
          </div>

          {/* Side Command Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl text-brand-primary flex flex-col gap-6 relative overflow-hidden border border-brand-primary/8 shadow-sm p-6">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-secondary">
                <Zap size={100} />
              </div>
              <h4 className="text-token-micro font-black uppercase tracking-[0.2em] opacity-40">Administrative Intelligence</h4>
              <div className="space-y-4 relative z-10">
                <div className="p-5 bg-brand-primary/[0.02] border border-brand-primary/8 rounded-2xl group cursor-pointer hover:bg-brand-primary/5 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Audit Required</p>
                    <ChevronRight size={14} className="text-brand-secondary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <h5 className="font-black text-sm mb-1 uppercase tracking-tight">Financial Closure</h5>
                  <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                    Term 1 fee reconciliation is at 84%. Initiate protocol?
                  </p>
                </div>
                <div className="p-5 bg-brand-primary/[0.02] border border-brand-primary/8 rounded-2xl group cursor-pointer hover:border-brand-secondary/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Retention Flare</p>
                    <ChevronRight size={14} className="text-brand-secondary opacity-40 group-hover:opacity-100 transition-all" />
                  </div>
                  <h5 className="font-black text-sm mb-1 uppercase tracking-tight">Student At-Risk</h5>
                  <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                    SS 2 absence surge. Strategic welfare sync required.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-brand-primary/8 p-6 flex flex-col gap-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-brand-secondary" />
                <h4 className="font-black text-token-micro uppercase tracking-widest text-brand-primary">Hub Sync Status</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-token-micro font-black uppercase tracking-tight text-brand-tertiary">Primary Campus</span>
                    <span className="text-token-micro font-black text-brand-secondary">OPTIMAL</span>
                  </div>
                  <div className="h-1.5 bg-brand-primary/8 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-secondary w-full rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-token-micro font-black uppercase tracking-tight text-brand-tertiary">Secondary Campus</span>
                    <span className="text-token-micro font-black text-brand-secondary">OPTIMAL</span>
                  </div>
                  <div className="h-1.5 bg-brand-primary/8 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-secondary w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickAction({ label, icon, highlight, onClick }: { label: string; icon: React.ReactNode; highlight?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-4 bg-white border px-6 py-5 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all min-w-[220px] group",
      highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
        highlight ? "bg-brand-secondary text-white" : "bg-brand-primary/5 text-brand-tertiary group-hover:bg-brand-secondary/10 group-hover:text-brand-secondary"
      )}>
        {icon}
      </div>
      <span className="text-token-micro font-black text-brand-primary uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function EventNode({ time, tag, content, status, alert, highlight }: { time: string; tag: string; content: string; status: string; alert?: boolean; highlight?: boolean }) {
  return (
    <div className={cn(
      "p-6 flex gap-6 transition-all border-l-4",
      alert ? "border-l-brand-error bg-brand-error/[0.01]" : highlight ? "border-l-brand-secondary bg-brand-secondary/[0.01]" : "border-l-transparent"
    )}>
      <div className="flex flex-col items-center">
        <span className="text-token-micro font-black text-brand-tertiary/60 whitespace-nowrap tabular-nums">{time}</span>
        <div className="w-[1px] flex-1 bg-brand-primary/5 my-2" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={cn(
            "text-token-micro font-black px-2 py-0.5 rounded border tracking-widest",
            alert ? "border-brand-error/30 text-brand-error" : highlight ? "border-brand-secondary/30 text-brand-secondary" : "border-brand-primary/10 text-brand-tertiary"
          )}>
            {tag}
          </span>
          <span className="text-token-micro font-black text-brand-tertiary/60 uppercase tracking-widest">{status}</span>
        </div>
        <p className="text-xs font-bold text-brand-primary/80 leading-relaxed max-w-2xl lowercase font-sans">
          {content}
        </p>
      </div>
    </div>
  );
}

function CommandCard({ title, desc, stat, trend, highlight }: { title: string; desc: string; stat: string; trend: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "bg-white rounded-3xl group hover:shadow-lg transition-all border shadow-sm p-6",
      highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-sm font-black text-brand-primary uppercase tracking-tight mb-2">{title}</h4>
          <p className="text-token-micro font-bold text-brand-tertiary uppercase max-w-[180px] leading-relaxed">{desc}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-display font-black text-brand-primary tracking-tighter tabular-nums block">{stat}</span>
          <div className={cn("w-full h-1 bg-brand-secondary mt-1 rounded-full transition-opacity", highlight ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
        </div>
      </div>
      <div className="pt-4 border-t border-brand-primary/8 flex justify-between items-center">
        <span className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-brand-secondary" : "text-brand-tertiary")}>{trend}</span>
        <div className="flex gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", highlight ? "bg-brand-secondary" : "bg-brand-primary/10")} />
          <div className="w-1.5 h-1.5 bg-brand-primary/5 rounded-full" />
          <div className="w-1.5 h-1.5 bg-brand-primary/[0.02] rounded-full" />
        </div>
      </div>
    </div>
  );
}
