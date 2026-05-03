
"use client";

import { useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Zap, 
  Settings, 
  Users, 
  FileText, 
  ShieldAlert, 
  Activity, 
  ChevronRight, 
  Bell, 
  History,
  LayoutDashboard,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OperationsHubPage() {
  const [activeTab, setActiveTab] = useState("COMMAND");

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase flex items-center gap-3">
              Operational <span className="text-[brand-secondary]">Command</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-[0.3em] mt-1">
              Centralized orchestration hub for multi-campus institutional logistics.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-[brand-secondary]/30 transition-all">
                <History size={16} />
                Command History
             </button>
             <button className="bg-white border-2 border-[brand-secondary] text-brand-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-[brand-secondary]/10 font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:bg-[brand-secondary] transition-all">
                <Settings size={16} />
                Global Config
             </button>
          </div>
        </div>

        {/* Rapid Action Strip */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           <QuickAction label="Onboard Staff" icon={<Users size={18}/>} color="bg-black/5" />
           <QuickAction label="Audit Finances" icon={<FileText size={18}/>} color="bg-black/5" />
           <QuickAction label="Welfare Flag" icon={<ShieldAlert size={18}/>} color="bg-black/5" />
           <QuickAction label="Sync Systems" icon={<Activity size={18}/>} color="bg-[brand-secondary]/10" highlight />
        </div>

        {/* Command Center Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Terminal Feed */}
           <div className="lg:col-span-3 flex flex-col gap-8">
              {/* Active Logistics Feed */}
              <div className="card p-0 overflow-hidden border border-brand-primary/8 shadow-xl bg-white relative">
                 <div className="p-6 border-b border-brand-primary/8 flex items-center justify-between bg-black/[0.01]">
                    <div className="flex items-center gap-3">
                       <LayoutDashboard size={18} className="text-[brand-secondary]" />
                       <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro">Real-time Logistics Stream</h4>
                    </div>
                    <div className="flex items-center gap-3">
                       <Filter size={14} className="text-brand-tertiary" />
                       <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Filter Analytical Stream</span>
                    </div>
                 </div>
                 
                 <div className="divide-y divide-black/[0.03]">
                    <EventNode 
                       time="09:42 AM" 
                       tag="ACADEMIC" 
                       content="Result publication threshold reached for JSS 1 Alpha. Final audit initiated by Form Master." 
                       status="PROCESSED"
                    />
                    <EventNode 
                       time="08:15 AM" 
                       tag="SECURITY" 
                       content="Director key accessed for Student Previous Results archive (Session 2023/24)." 
                       status="VERIFIED"
                       alert
                    />
                    <EventNode 
                       time="07:30 AM" 
                       tag="FINANCIAL" 
                       content="Bulk tuition reconciliation completed for Primary Campus segment. ₦12.5M verified." 
                       status="FINALIZED"
                    />
                    <EventNode 
                       time="06:00 AM" 
                       tag="SYSTEM" 
                       content="Daily cloud backup successful. Integrity check: 100%. Latency: 42ms." 
                       status="OPTIMAL"
                       highlight
                    />
                 </div>

                 <div className="p-4 bg-black/[0.01] text-center border-t border-brand-primary/8">
                    <button className="text-token-micro font-black uppercase tracking-widest text-[brand-secondary] hover:underline">
                       Load Forensic Data Logs
                    </button>
                 </div>
              </div>

              {/* Strategic Command Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <CommandCard 
                    title="Staffing Pulse" 
                    desc="Institutional HR health and deployment status." 
                    stat="142 Active" 
                    trend="+2 Provisioning" 
                 />
                 <CommandCard 
                    title="Enrollment Velocity" 
                    desc="Real-time admissions and retention metrics." 
                    stat="482 Pupils" 
                    trend="92% Retention" 
                    highlight
                 />
              </div>
           </div>

           {/* Side Command Column */}
           <div className="flex flex-col gap-6">
              <div className="card bg-white text-brand-primary flex flex-col gap-8 relative overflow-hidden border border-brand-primary/8 shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-5 text-[brand-secondary]">
                    <Zap size={100} />
                 </div>
                 <h4 className="text-token-micro font-black uppercase tracking-[0.2em] opacity-40">Administrative Intelligence</h4>
                 <div className="space-y-6 relative z-10">
                    <div className="p-5 bg-black/[0.02] border border-brand-primary/8 rounded-2xl group cursor-pointer hover:bg-black/[0.04] transition-all">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Audit Required</p>
                          <ChevronRight size={14} className="text-[brand-secondary] opacity-0 group-hover:opacity-100 transition-all translate-x-1" />
                       </div>
                       <h5 className="font-black text-sm mb-1 uppercase tracking-tight">Financial Closure</h5>
                       <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                          Term 1 fee reconciliation is at 84%. Initiate protocol?
                       </p>
                    </div>
                    <div className="p-5 bg-black/[0.02] border border-brand-primary/8 rounded-2xl group cursor-pointer hover:border-[brand-secondary]/30 transition-all">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-token-micro font-black text-[brand-secondary] uppercase tracking-widest">Retention Flare</p>
                          <ChevronRight size={14} className="text-[brand-secondary] opacity-40 group-hover:opacity-100 transition-all" />
                       </div>
                       <h5 className="font-black text-sm mb-1 uppercase tracking-tight">Student At-Risk</h5>
                       <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                          SS 2 absence surge. Strategic welfare sync required.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="card border-brand-primary/8 bg-white flex flex-col gap-5 shadow-xl">
                 <div className="flex items-center gap-3">
                    <Activity size={18} className="text-[brand-secondary]" />
                    <h4 className="font-black text-token-micro uppercase tracking-widest text-brand-primary">Hub Sync Status</h4>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-token-micro font-black uppercase tracking-tight text-brand-tertiary">Primary Campus</span>
                          <span className="text-token-micro font-black text-[brand-secondary]">OPTIMAL</span>
                       </div>
                       <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[brand-secondary] w-full" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-token-micro font-black uppercase tracking-tight text-brand-tertiary">Secondary Campus</span>
                          <span className="text-token-micro font-black text-[brand-secondary]">OPTIMAL</span>
                       </div>
                       <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[brand-secondary] w-full" />
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

function QuickAction({ label, icon, color, highlight }: any) {
   return (
      <button className={cn(
        "flex items-center gap-4 bg-white border px-6 py-5 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all min-w-[240px] group",
        highlight ? "border-[brand-secondary]/30" : "border-brand-primary/8"
      )}>
         <div className={cn(
           "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
           highlight ? "bg-[brand-secondary] text-brand-primary" : "bg-black/5 text-brand-tertiary group-hover:bg-[brand-secondary]/10 group-hover:text-[brand-secondary]"
         )}>
            {icon}
         </div>
         <span className="text-token-micro font-black text-brand-primary uppercase tracking-[0.2em]">{label}</span>
      </button>
   );
}

function EventNode({ time, tag, content, status, alert, highlight }: any) {
   return (
      <div className={cn(
        "p-6 flex gap-8 transition-all border-l-4",
        alert ? "border-l-red-500 bg-rose-600/[0.01]" : highlight ? "border-l-[brand-secondary] bg-[brand-secondary]/[0.01]" : "border-l-transparent"
      )}>
         <div className="flex flex-col items-center">
            <span className="text-token-micro font-black text-brand-tertiary/60 whitespace-nowrap tabular-nums">{time}</span>
            <div className="w-[1px] flex-1 bg-black/[0.05] my-2" />
         </div>
         <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <span className={cn(
                 "text-token-micro font-black px-2 py-0.5 rounded border tracking-widest",
                 alert ? "border-red-500/30 text-rose-600" : highlight ? "border-[brand-secondary]/30 text-[brand-secondary]" : "border-brand-primary/10 text-brand-tertiary"
               )}>
                  {tag}
               </span>
               <span className="text-token-micro font-black text-brand-tertiary/60 uppercase tracking-widest">{status}</span>
            </div>
            <p className="text-xs font-bold text-brand-primary/80 leading-relaxed max-w-2xl lowercase font-sans">
               {content}
            </p>
         </div>
         <button className="w-8 h-8 rounded-lg bg-black/5 opacity-0 group-hover:opacity-100 transition-all grid place-items-center">
            <ChevronRight size={14} className="text-brand-tertiary" />
         </button>
      </div>
   );
}

function CommandCard({ title, desc, stat, trend, highlight }: any) {
   return (
      <div className={cn(
        "card bg-white group hover:shadow-2xl transition-all border shadow-lg",
        highlight ? "border-[brand-secondary]/30" : "border-brand-primary/8"
      )}>
         <div className="flex justify-between items-start mb-8">
            <div>
               <h4 className="text-sm font-black text-brand-primary uppercase tracking-tight mb-2">{title}</h4>
               <p className="text-token-micro font-bold text-brand-tertiary uppercase max-w-[180px] leading-relaxed">{desc}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-display font-black text-brand-primary tracking-tighter tabular-nums block">{stat}</span>
              <div className={cn("w-full h-1 bg-[brand-secondary] mt-1 rounded-full", highlight ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")} />
            </div>
         </div>
         <div className="pt-5 border-t border-brand-primary/8 flex justify-between items-center">
            <span className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-[brand-secondary]" : "text-brand-tertiary")}>{trend}</span>
            <div className="flex gap-1.5">
               <div className={cn("w-1.5 h-1.5 rounded-full", highlight ? "bg-[brand-secondary]" : "bg-black/10")} />
               <div className="w-1.5 h-1.5 bg-black/5 rounded-full" />
               <div className="w-1.5 h-1.5 bg-black/[0.02] rounded-full" />
            </div>
         </div>
      </div>
   );
}

