
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Settings, 
  Database, 
  ShieldCheck, 
  Server, 
  Globe, 
  LayoutDashboard, 
  Bell, 
  ChevronRight,
  Save,
  RefreshCw,
  Cpu,
  Unplug
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DirectorOperationsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    schoolName: "Wajina International Schools",
    currentSession: "2025/2026 Academic Session",
    currentTerm: "First Term",
    systemStatus: "OPTIMAL",
    lastBackup: "2h ago",
    dataSync: "ENABLED"
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Global Institutional Configuration Synchronized");
    }, 1200);
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Operations Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tight uppercase flex items-center gap-3">
              Institutional <span className="text-[brand-secondary]">Operations</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-[0.3em] mt-1">
              Cluster-wide system parameters, architectural defaults, and institutional synchronization.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
             <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-[brand-secondary]/30 transition-all">
                <RefreshCw size={16} />
                Hard Reset
             </button>
             <button 
                onClick={handleSave}
                className="bg-white border-2 border-[brand-secondary] text-brand-primary px-8 py-3.5 rounded-2xl shadow-lg shadow-[brand-secondary]/10 font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:bg-[brand-secondary] transition-all"
             >
                <Save size={16} />
                {loading ? "Syncing..." : "Sync Global Config"}
             </button>
          </div>
        </div>

        {/* System Health Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <HealthKPI label="System Status" value="OPTIMAL" status="green" icon={<Cpu size={18}/>} highlight />
           <HealthKPI label="Database Sync" value="SYNCCED" status="green" icon={<Database size={18}/>} />
           <HealthKPI label="Identity Hub" value="SECURE" status="green" icon={<ShieldCheck size={18}/>} />
           <HealthKPI label="External API" value="ACTIVE" status="green" icon={<Globe size={18}/>} />
        </div>

        {/* Configuration Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
           {/* General Settings */}
           <div className="lg:col-span-2 flex flex-col gap-5 md:gap-8">
              <div className="card bg-white flex flex-col gap-8 border border-brand-primary/8 shadow-xl">
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest opacity-40">Institutional Identity</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Institutional Name" value={config.schoolName} />
                    <Field label="Current Meta-Session" value={config.currentSession} />
                    <Field label="Active Educational Term" value={config.currentTerm} />
                    <Field label="Admissions Status" value="OPEN (WINTER)" />
                 </div>
              </div>

              <div className="card bg-white flex flex-col gap-8 border border-brand-primary/8 shadow-xl">
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest opacity-40">Architectural Defaults</h4>
                 <div className="space-y-4">
                    <ConfigToggle label="Automated Term Cutover" enabled />
                    <ConfigToggle label="Real-time Financial Sync" enabled />
                    <ConfigToggle label="Strict RBAC Enforcement" enabled />
                    <ConfigToggle label="External Parent API" disabled />
                 </div>
              </div>
           </div>

           {/* Deployment Status */}
           <div className="flex flex-col gap-5 md:gap-6">
              <div className="card bg-white text-brand-primary flex flex-col gap-8 border border-brand-primary/8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 text-[brand-secondary]">
                    <Server size={100} />
                 </div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                       <Cpu size={18} className="text-brand-tertiary" />
                    </div>
                    <h4 className="font-black text-token-micro uppercase tracking-widest opacity-60">Deployment Topology</h4>
                 </div>
                 <div className="space-y-6 relative z-10">
                    <TopologyNode label="Main Production Cluster" status="CONNECTED" />
                    <TopologyNode label="Legacy Financial Vault" status="BRIDGE_ACTIVE" />
                    <TopologyNode label="CDN: Asset Hub" status="CONNECTED" />
                 </div>
                 <div className="mt-4 pt-6 border-t border-brand-primary/8 relative z-10">
                    <button className="w-full py-4 bg-black/5 border border-brand-primary/8 rounded-xl text-token-micro font-black uppercase tracking-widest hover:bg-[brand-secondary]/10 hover:text-[brand-secondary] transition-all">
                       View Load Balancing
                    </button>
                 </div>
              </div>

              <div className="card bg-white border-dashed border-2 border-[brand-secondary]/20 flex flex-col gap-5 p-8 shadow-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <Bell size={18} className="text-[brand-secondary]" />
                    <h4 className="font-black text-token-micro uppercase tracking-widest text-brand-primary">Operations Alert</h4>
                 </div>
                 <p className="text-token-caption font-bold text-brand-primary/50 leading-relaxed uppercase tracking-tight font-sans">
                    Term 2 configuration is currently locked until Jan 15th 2026. Review Session weights before the automated cutover.
                 </p>
                 <button className="mt-4 text-token-micro font-black text-[brand-secondary] uppercase tracking-widest flex items-center gap-1 hover:underline">
                    Review Cutover Schedule <ChevronRight size={12} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function HealthKPI({ label, value, status, icon, highlight }: any) {
   return (
      <div className={cn(
        "card bg-white p-4 md:p-6 rounded-[1.5rem] flex items-center justify-between shadow-xl border transition-all",
        highlight ? "border-[brand-secondary]/30" : "border-brand-primary/8"
      )}>
         <div>
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mb-2">{label}</p>
            <div className="flex items-center gap-3">
               <div className={cn(
                 "w-2 h-2 rounded-full animate-pulse",
                 status === 'green' ? 'bg-[brand-secondary]' : 'bg-rose-600'
               )} />
               <span className="text-sm font-black text-brand-primary tracking-tight tabular-nums">{value}</span>
            </div>
         </div>
         <div className={cn(
           "w-12 h-12 rounded-xl flex items-center justify-center",
           highlight ? "bg-[brand-secondary]/10 text-[brand-secondary]" : "bg-black/5 text-brand-tertiary/60"
         )}>{icon}</div>
      </div>
   );
}

function Field({ label, value }: any) {
   return (
      <div className="space-y-3">
         <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
         <div className="p-5 bg-black/[0.02] border border-brand-primary/8 rounded-2xl text-token-caption font-bold text-brand-primary uppercase tracking-tight">
            {value}
         </div>
      </div>
   );
}

function ConfigToggle({ label, enabled }: any) {
   return (
      <div className="flex items-center justify-between p-5 bg-black/[0.02] rounded-[1.25rem] border border-brand-primary/8 hover:bg-black/[0.04] transition-all cursor-pointer group">
         <span className="text-token-caption font-black text-brand-primary uppercase tracking-tight">{label}</span>
         <div className={cn(
           "w-12 h-6 rounded-full p-1 transition-all",
           enabled ? "bg-[brand-secondary]" : "bg-black/10"
         )}>
            <div className={cn(
              "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
              enabled ? "translate-x-6" : "translate-x-0"
            )} />
         </div>
      </div>
   );
}

function TopologyNode({ label, status }: any) {
   return (
      <div className="flex flex-col gap-3">
         <div className="flex justify-between items-center text-token-micro font-black uppercase tracking-widest">
            <span className="text-brand-tertiary">{label}</span>
            <span className={status === 'CONNECTED' ? 'text-[brand-secondary]' : 'text-brand-tertiary/60'}>{status}</span>
         </div>
         <div className="h-1 bg-black/5 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all duration-1000",
              status === 'CONNECTED' ? 'bg-[brand-secondary]' : 'bg-black/10'
            )} style={{ width: '100%' }} />
         </div>
      </div>
   );
}


