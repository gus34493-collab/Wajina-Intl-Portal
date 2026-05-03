
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  ShieldAlert, 
  UserX, 
  MessageSquareWarning, 
  History, 
  Search,
  Filter,
  Plus,
  ChevronRight,
  TrendingDown,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function ParentRiskFamiliesPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("OPEN");

  useEffect(() => {
    async function fetchRisks() {
      try {
        const response = await fetch(`/api/risks?status=${activeTab}`);
        if (response.ok) {
          const data = await response.json();
          setRisks(data || []);
        }
      } catch (err) {
        console.error("Welfare Audit Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRisks();
  }, [activeTab]);

  const criticalCount = risks.filter(r => r.severity === 'CRITICAL').length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Institutional Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight">
              Welfare & Risk Monitoring
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Active tracking of student engagement anomalies and family risk profiles.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/10 hover:bg-brand-primary/90 transition-all font-black text-xs uppercase tracking-widest self-start">
            <Plus size={16} />
            Log New Risk Anomaly
          </button>
        </div>

        {/* Global Welfare KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <RiskMetric label="Critical Risks" value={criticalCount.toString()} trend="Action Required" icon={<ShieldAlert size={16} className="text-rose-600"/>} pulse />
           <RiskMetric label="High Absenteeism" value="12" trend="Last 5 Days" icon={<UserX size={16}/>} />
           <RiskMetric label="Academic Flags" value="8" trend="Declining Avg" icon={<TrendingDown size={16} className="text-brand-accent"/>} />
           <RiskMetric label="Resolved (Term)" value="45" trend="Welfare Success" icon={<CheckCircle size={16} className="text-brand-forest"/>} />
        </div>

        {/* Audit & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 border border-brand-primary/5 p-2 rounded-2xl">
          <div className="flex items-center gap-1">
            <FilterTab active={activeTab === "OPEN"} onClick={() => setActiveTab("OPEN")} label="Active Audit Cases" count={risks.length} />
            <FilterTab active={activeTab === "RESOLVED"} onClick={() => setActiveTab("RESOLVED")} label="Resolution Archive" />
          </div>
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={14} />
            <input 
              type="text" 
              placeholder="Search student or parent..." 
              className="w-full bg-white border border-brand-primary/8 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-tertiary/20"
            />
          </div>
        </div>

        {/* Risk Registry Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-56 card animate-pulse" />)
          ) : risks.length === 0 ? (
            <div className="col-span-full h-80 card border-dashed flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 rounded-full bg-brand-blush grid place-items-center mb-6">
                  <History size={32} className="text-brand-tertiary opacity-20" />
               </div>
               <h4 className="font-black text-brand-primary">Welfare Registry Clear</h4>
               <p className="text-xs text-brand-tertiary mt-1 max-w-xs leading-relaxed">
                  There are no open risk anomalies for this campus segment. High engagement levels detected.
               </p>
            </div>
          ) : (
            risks.map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function RiskMetric({ label, value, trend, icon, pulse }: any) {
  return (
    <div className="bg-white border border-brand-primary/8 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-brand-tertiary/20 transition-all">
      <div>
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-display font-black text-brand-primary mt-1">{value}</p>
        <p className="text-token-micro font-bold text-brand-tertiary mt-1">{trend}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-brand-blush flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
    </div>
  );
}

function FilterTab({ label, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-brand-tertiary hover:bg-black/5'}`}
    >
      {label}
      {count !== undefined && <span className={`px-1.5 py-0.5 rounded-md text-token-micro ${active ? 'bg-white/10' : 'bg-black/5'}`}>{count}</span>}
    </button>
  );
}

function RiskCard({ risk }: any) {
  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'border-red-500/20 bg-rose-600/5 text-rose-600';
      case 'HIGH': return 'border-brand-accent/20 bg-brand-accent/5 text-brand-accent';
      default: return 'border-brand-tertiary/20 bg-brand-tertiary/5 text-brand-tertiary';
    }
  };

  const styles = getSeverityStyles(risk.severity);

  return (
    <div className={`card group p-0 overflow-hidden flex flex-col border-2 transition-all hover:translate-y-[-2px] ${styles.split(' ')[0]}`}>
      <div className={`p-6 border-b flex justify-between items-start ${styles.split(' ')[0]} ${styles.split(' ')[1]}`}>
         <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center shadow-sm">
               <ShieldAlert size={20} className={styles.split(' ')[2]} />
            </div>
            <div>
               <h4 className="font-black text-brand-primary tracking-tight underline decoration-black/5 decoration-2 underline-offset-4">{risk.title || "Welfare Flag"}</h4>
               <p className="text-token-micro font-bold opacity-60 uppercase mt-1 tracking-wider">Reported by {risk.creator?.name || "Anonymous Staff"}</p>
            </div>
         </div>
         <span className={`px-3 py-1 rounded-full text-token-micro font-black tracking-widest uppercase shadow-sm bg-white ${styles.split(' ')[2]}`}>
            {risk.severity}
         </span>
      </div>

      <div className="p-8 flex-1 flex flex-col gap-6">
         <p className="text-xs text-brand-primary/80 leading-relaxed font-medium">
            {risk.description || "Detailed telemetry for this risk profile is currently being aggregated from teacher session notes."}
         </p>
         
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-blush rounded-2xl p-4 flex items-center gap-3">
               <Clock size={16} className="text-brand-tertiary" />
               <span className="text-token-micro font-black text-brand-primary uppercase tracking-tight">{new Date(risk.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="bg-brand-blush rounded-2xl p-4 flex items-center gap-3">
               <MessageSquareWarning size={16} className="text-brand-tertiary" />
               <span className="text-token-micro font-black text-brand-primary uppercase tracking-tight">Active Audit</span>
            </div>
         </div>
      </div>

      <div className="p-4 bg-brand-blush/50 border-t border-brand-primary/5 flex gap-3">
         <button className="flex-1 bg-white border border-brand-primary/8 rounded-xl py-3 text-token-micro font-black text-brand-primary uppercase tracking-widest hover:border-brand-tertiary/20 transition-all shadow-sm">
            Welfare History
         </button>
         <button className="flex-[1.5] bg-brand-primary text-white rounded-xl py-3 text-token-micro font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/10">
            Escalate to Principal
            <ChevronRight size={14} />
         </button>
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: any) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

