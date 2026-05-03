"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  CreditCard, 
  CheckCircle2, 
  Save, 
  TrendingUp, 
  Filter, 
  ChevronRight,
  Info,
  Layers,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function FeeConfigurationPage() {
  const [activeTab, setActiveTab] = useState("TERMLY");
  const [isSaving, setIsSaving] = useState(false);
  const [entranceFee, setEntranceFee] = useState(25000);

  useEffect(() => {
     fetch("/api/admissions/config")
       .then(res => res.json())
       .then(data => {
          if (data && data.length > 0) setEntranceFee(data[0].entranceFee || 25000);
       });
  }, []);

  // Mock State for Fee Structure
  const [fees, setFees] = useState([
    { id: 1, level: "Early Years (Toddler/Nursery)", tuition: 150000, admin: 25000, uniform: 45000, portal: 15000 },
    { id: 2, level: "Primary (Year 1 - 6)", tuition: 225000, admin: 35000, uniform: 55000, portal: 15000 },
    { id: 3, level: "Junior Secondary (Year 7 - 9)", tuition: 310000, admin: 45000, uniform: 65000, portal: 20000 },
    { id: 4, level: "Senior Secondary (Year 10 - 12)", tuition: 385000, admin: 55000, uniform: 65000, portal: 20000 },
  ]);

  const handleUpdateFee = (id: number, field: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    setFees(prev => prev.map(f => f.id === id ? { ...f, [field]: numValue } : f));
  };

  const handleSyncGlobal = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "ADMISSIONS") {
         await Promise.all([
            fetch("/api/admissions/config", { method: "PATCH", body: JSON.stringify({ campus: "PRIMARY", entranceFee }) }),
            fetch("/api/admissions/config", { method: "PATCH", body: JSON.stringify({ campus: "SECONDARY", entranceFee }) })
         ]);
      }
      toast.success("Institutional Fee Structure Synchronized & Published");
    } catch(err) {
      toast.error("Failed to synchronize");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Governance Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[brand-secondary] animate-pulse" />
                <span className="text-token-micro font-black uppercase text-brand-tertiary tracking-[0.4em]">Financial Governance</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-none uppercase">Fee <span className="text-[brand-secondary]">Architecture</span></h1>
             <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-widest mt-2">Strategic control of institutional tuition and operational levies.</p>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-8 h-14 rounded-2xl font-black text-token-micro uppercase tracking-widest hover:border-[brand-secondary]/30 transition-all flex items-center gap-3">
                 <Layers size={16} />
                 Session Default
              </button>
              <button 
                onClick={handleSyncGlobal}
                disabled={isSaving}
                className="bg-white border-2 border-[brand-secondary] text-brand-primary px-10 h-14 rounded-2xl font-black text-token-micro uppercase tracking-widest hover:bg-[brand-secondary] transition-all shadow-lg shadow-[brand-secondary]/10 flex items-center gap-3"
              >
                 <Zap size={16} />
                 {isSaving ? "Synchronizing..." : "Publish Structure"}
              </button>
           </div>
        </div>

        {/* Global Finance Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <SummaryCard 
              label="Avg. Session Revenue" 
              value="₦32.4M" 
              accent="Per Campus" 
              icon={<TrendingUp className="text-brand-primary" />} 
              highlight
           />
           <SummaryCard 
              label="Termly Components" 
              value="3" 
              accent="Mandatory Levies" 
              icon={<CreditCard className="text-brand-primary" />} 
           />
           <SummaryCard 
              label="Annual Components" 
              value="2" 
              accent="Non-Recurring" 
              icon={<Layers className="text-brand-primary" />} 
           />
        </div>

        {/* Configuration Matrix */}
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-primary/8 pb-8">
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setActiveTab("TERMLY")}
                   className={cn(
                     "px-8 py-4 rounded-2xl text-token-micro font-black uppercase tracking-widest transition-all",
                     activeTab === "TERMLY" ? "bg-black text-white shadow-xl" : "text-brand-tertiary hover:bg-black/5 hover:text-brand-primary"
                   )}
                 >
                    Termly Structuring
                 </button>
                 <button 
                    onClick={() => setActiveTab("ANNUAL")}
                    className={cn(
                      "px-8 py-4 rounded-2xl text-token-micro font-black uppercase tracking-widest transition-all",
                      activeTab === "ANNUAL" ? "bg-black text-white shadow-xl" : "text-brand-tertiary hover:bg-black/5 hover:text-brand-primary"
                    )}
                 >
                    Annualized Levies
                 </button>
                 <button 
                    onClick={() => setActiveTab("ADMISSIONS")}
                    className={cn(
                      "px-8 py-4 rounded-2xl text-token-micro font-black uppercase tracking-widest transition-all",
                      activeTab === "ADMISSIONS" ? "bg-black text-white shadow-xl" : "text-brand-tertiary hover:bg-black/5 hover:text-brand-primary"
                    )}
                 >
                    Admissions
                 </button>
              </div>
              <div className="flex items-center gap-3 text-brand-tertiary bg-white border border-brand-primary/8 px-6 py-3.5 rounded-2xl italic font-black text-token-micro uppercase tracking-widest">
                 <Info size={14} />
                 Changes reflect in next automated billing cycle
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
               {activeTab === "ADMISSIONS" ? (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="card group bg-white border border-brand-primary/8 shadow-xl p-10 flex flex-col md:flex-row md:items-center gap-10 hover:shadow-2xl transition-all"
                 >
                    <div className="flex-1">
                       <p className="text-token-micro font-black text-[brand-secondary] uppercase tracking-[0.3em] mb-2">Pre-Enrollment</p>
                       <h4 className="text-xl font-display font-black text-brand-primary uppercase tracking-tight">Entrance Exam Fee</h4>
                       <div className="flex items-center gap-3 mt-4">
                          <div className="w-1 h-1 rounded-full bg-black/10" />
                          <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Global Application Levy</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0 md:w-2/3">
                       <FeeInput 
                          label="Entrance Fee (Global)" 
                          value={entranceFee} 
                          onChange={(val) => setEntranceFee(parseInt(val.replace(/[^0-9]/g, "")) || 0)} 
                       />
                    </div>
                 </motion.div>
               ) : (
                 fees.map((fee) => (
                   <motion.div 
                      key={fee.id}
                      initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card group bg-white border border-brand-primary/8 shadow-xl p-10 flex flex-col md:flex-row md:items-center gap-10 hover:shadow-2xl transition-all"
                 >
                    <div className="flex-1">
                       <p className="text-token-micro font-black text-[brand-secondary] uppercase tracking-[0.3em] mb-2">{fee.id === 4 ? "Upper Tier" : "Institutional Grade"}</p>
                       <h4 className="text-xl font-display font-black text-brand-primary uppercase tracking-tight">{fee.level}</h4>
                       <div className="flex items-center gap-3 mt-4">
                          <div className="w-1 h-1 rounded-full bg-black/10" />
                          <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Multi-campus global rate</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0 md:w-2/3">
                       {activeTab === "TERMLY" ? (
                         <>
                           <FeeInput 
                              label="Tuition (Per Term)" 
                              value={fee.tuition} 
                              onChange={(val) => handleUpdateFee(fee.id, 'tuition', val)} 
                           />
                           <FeeInput 
                              label="Administrative Levy" 
                              value={fee.admin} 
                              onChange={(val) => handleUpdateFee(fee.id, 'admin', val)} 
                           />
                         </>
                       ) : (
                         <>
                           <FeeInput 
                              label="Uniform & Kit" 
                              value={fee.uniform} 
                              onChange={(val) => handleUpdateFee(fee.id, 'uniform', val)} 
                           />
                           <FeeInput 
                              label="Institutional Portal" 
                              value={fee.portal} 
                              onChange={(val) => handleUpdateFee(fee.id, 'portal', val)} 
                           />
                         </>
                       )}
                    </div>
                 </motion.div>
              ))
             )}
           </div>
        </div>

        {/* Security Alert */}
        <div className="card bg-black border-none p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.03] pointer-events-none" />
           <p className="text-token-micro font-black text-white/40 uppercase tracking-[0.5em] mb-4">Verification Gateway</p>
           <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-6">Unauthorized fee alterations are strictly prohibited.</h3>
           <p className="text-white/30 text-token-micro font-black uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
              Updating the fee architecture triggers a non-repudiable log entry. All parents will be automatically notified of structural adjustments via the family dashboard.
           </p>
        </div>

      </div>
    </DashboardShell>
  );
}

function SummaryCard({ label, value, accent, icon, highlight }: any) {
   return (
      <div className={cn(
        "card bg-white flex items-center gap-10 group shadow-xl transition-all border",
        highlight ? "border-[brand-secondary]/30" : "border-brand-primary/8 hover:border-brand-primary/10"
      )}>
         <div className={cn(
            "w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500",
            highlight ? "bg-[brand-secondary]/10 text-brand-primary border border-[brand-secondary]/20" : "bg-black/[0.03] text-brand-tertiary group-hover:bg-[brand-secondary]/5"
         )}>
            <div className="scale-125">{icon}</div>
         </div>
         <div>
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.3em] mb-1.5">{label}</p>
            <p className="text-4xl font-display font-black text-brand-primary leading-none tabular-nums tracking-tighter">{value}</p>
            <div className="flex items-center gap-2 mt-2">
                <div className={cn("w-1 h-1 rounded-full", highlight ? "bg-[brand-secondary]" : "bg-black/10")} />
                <p className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-[brand-secondary]" : "text-brand-tertiary")}>{accent}</p>
            </div>
         </div>
      </div>
   );
}

function FeeInput({ label, value, onChange }: { label: string, value: number, onChange: (val: string) => void }) {
   return (
      <div className="space-y-3">
         <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
         <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-brand-tertiary/60 text-sm">₦</span>
            <input 
               type="text" 
               value={value.toLocaleString()}
               onChange={(e) => onChange(e.target.value)}
               className="w-full bg-black/[0.02] border-2 border-brand-primary/8 rounded-2xl h-16 pl-12 pr-6 font-display font-black text-brand-primary text-xl tracking-tighter focus:border-[brand-secondary]/30 outline-none transition-all"
            />
         </div>
      </div>
   );
}

