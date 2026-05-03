"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  BadgeCheck, 
  ChevronRight,
  TrendingUp,
  UserPlus,
  Briefcase,
  MoreVertical,
  Settings,
  UserX,
  ShieldOff,
  Trash2,
  ArrowUpCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function StaffDirectoryPage() {
  const [summary, setSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Management State
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingPromotionRole, setPendingPromotionRole] = useState("");

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setEmployees(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to fetch HR data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleAdminAction = async (action: 'SUSPEND' | 'REMOVE' | 'PROMOTE', targetUser: any) => {
    setActionLoading(true);
    try {
      let body: any = { userId: targetUser.id };
      
      if (action === 'SUSPEND' || action === 'REMOVE') {
        body.status = 'DISABLED';
      } else if (action === 'PROMOTE') {
        if (!pendingPromotionRole) {
           toast.error("Please select a role for promotion");
           setActionLoading(false);
           return;
        }
        body.role = pendingPromotionRole;
      }

      const res = await fetch('/api/hr/admin-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(`Action successfully applied to ${targetUser.name}`);
        fetchHRData(); // Refresh list
        setIsManageModalOpen(false);
        setSelectedStaff(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Action failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[brand-secondary] animate-pulse" />
                <span className="text-token-micro font-black uppercase text-brand-tertiary tracking-[0.4em]">Governance & HR</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-none uppercase">Personnel <span className="text-[brand-secondary]">Registry</span></h1>
             <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-widest mt-2">Central repository for administrative, instructional, and operational personnel.</p>
           </div>
           
           <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-tertiary/60" size={18} />
              <Input 
                 placeholder="Search institutional staff..." 
                 className="bg-white border-2 border-brand-primary/8 text-brand-primary pl-12 rounded-2xl h-14 shadow-sm focus:border-[brand-secondary]/30 transition-all font-bold uppercase text-xs"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        {/* Global HR KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <SummaryCard 
              label="Active Workforce" 
              value={summary?.activeStaff || "--"} 
              accent="Current Headcount" 
              icon={<Users className="text-brand-primary" />} 
              highlight
           />
           <SummaryCard 
              label="Pending Onboarding" 
              value={summary?.pendingOnboarding || "--"} 
              accent="Staff in Pipeline" 
              icon={<UserPlus className="text-brand-primary" />} 
           />
           <SummaryCard 
              label="Coverage Index" 
              value="100%" 
              accent="Campus Capacity" 
              icon={<ShieldCheck className="text-brand-primary" />} 
           />
        </div>

        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h4 className="font-black text-brand-tertiary text-token-micro uppercase tracking-[0.3em]">Institutional Records • {filteredStaff.length} Total</h4>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                 Array(6).fill(0).map((_, i) => (
                    <div key={i} className="card h-64 animate-pulse bg-white border-brand-primary/8 shadow-xl p-10" />
                 ))
              ) : filteredStaff.length === 0 ? (
                 <div className="col-span-full py-20 text-center card bg-white border border-brand-primary/8 shadow-xl">
                    <p className="text-brand-tertiary text-token-micro uppercase font-black tracking-widest italic font-sans">No records found matching search string.</p>
                 </div>
              ) : filteredStaff.map((staff) => (
                  <motion.div 
                     key={staff.id}
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className={cn(
                        "card group hover:shadow-2xl hover:translate-y-[-4px] transition-all p-10 flex flex-col gap-8 relative overflow-hidden bg-white border shadow-xl",
                        staff.status === 'DISABLED' ? "border-red-500/10 grayscale" : "border-brand-primary/8 hover:border-[brand-secondary]/30"
                     )}
                  >
                     {staff.status === 'DISABLED' && (
                        <div className="absolute top-0 left-0 right-0 py-1.5 bg-rose-600/10 text-rose-600 text-token-micro font-black uppercase tracking-[0.2em] text-center border-b border-red-500/20">
                           Institutional Access Revoked
                        </div>
                     )}

                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                           <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors font-display font-black text-xl border",
                              staff.status === 'DISABLED' ? "bg-rose-50 text-rose-400 border-red-100" : "bg-black/[0.03] border-brand-primary/8 text-brand-primary group-hover:bg-[brand-secondary]/10 group-hover:border-[brand-secondary]/20"
                           )}>
                              {staff.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-brand-primary leading-tight truncate max-w-[150px] uppercase tracking-tight">{staff.name}</h4>
                              <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mt-1">{staff.role}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[brand-secondary]/10 px-3 py-1 rounded-full border border-[brand-secondary]/20">
                           <div className="w-1 h-1 rounded-full bg-[brand-secondary] animate-pulse" />
                           <span className="text-token-micro font-black text-[brand-secondary] uppercase tracking-widest leading-none">85%</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-5 pt-8 border-t border-brand-primary/8">
                        <div className="flex items-center justify-between text-token-micro font-black uppercase tracking-widest">
                           <span className="text-brand-tertiary">Campus Location</span>
                           <span className="text-brand-primary">{staff.campus}</span>
                        </div>
                        <div className="flex items-center justify-between text-token-micro font-black uppercase tracking-widest">
                           <span className="text-brand-tertiary">Registry Status</span>
                           <div className={cn(
                             "flex items-center gap-1.5 font-black uppercase",
                             staff.status === 'DISABLED' ? "text-rose-600" : "text-[brand-secondary]"
                           )}>
                              <BadgeCheck size={12} />
                              Verified
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-4 mt-auto pt-8 border-t border-brand-primary/8">
                        <button 
                           onClick={() => {
                              setSelectedStaff(staff);
                              setPendingPromotionRole(staff.role);
                              setIsManageModalOpen(true);
                           }}
                           className="flex items-center gap-2 text-token-micro font-black uppercase tracking-widest text-[brand-secondary] hover:text-brand-primary transition-all"
                        >
                           <Settings size={14} />
                           Command Actions
                        </button>
                        <button className="flex items-center gap-2 text-token-micro font-black uppercase tracking-widest text-brand-tertiary/60 group-hover:text-brand-primary transition-all">
                           Profile
                           <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Management Modal */}
         {isManageModalOpen && selectedStaff && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  onClick={() => setIsManageModalOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
               />
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-brand-primary/8"
               >
                  <div className="p-10 border-b border-brand-primary/8 bg-black/[0.01]">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[brand-secondary]" />
                           <span className="text-token-micro font-black text-[brand-secondary] uppercase tracking-[0.3em]">Management Console</span>
                        </div>
                        <button onClick={() => setIsManageModalOpen(false)} className="text-brand-tertiary/60 hover:text-brand-primary transition-all"><X size={24} /></button>
                     </div>
                     <h3 className="text-3xl font-display font-black text-brand-primary uppercase tracking-tight leading-none mb-2">Administer Personnel</h3>
                     <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em]">{selectedStaff.name} • {selectedStaff.campus} Hub</p>
                  </div>

                  <div className="p-10 space-y-10">
                     {/* Promote Action */}
                     <div className="space-y-5 p-8 bg-black/[0.02] rounded-3xl border border-brand-primary/8">
                        <div className="flex items-center gap-3">
                           <ArrowUpCircle className="text-[brand-secondary]" size={20} />
                           <h4 className="font-black text-brand-primary text-token-micro uppercase tracking-widest">Promotion / Role Alignment</h4>
                        </div>
                        <div className="flex gap-4">
                           <select 
                              className="flex-1 h-14 bg-white border-2 border-brand-primary/8 rounded-2xl px-6 text-token-micro font-black uppercase tracking-widest focus:border-[brand-secondary]/30 transition-all outline-none"
                              value={pendingPromotionRole}
                              onChange={(e) => setPendingPromotionRole(e.target.value)}
                           >
                              {["TEACHER", "FORM_TEACHER", "HOD", "ASST_HEAD_TEACHER", "DEAN", "VP_ADMIN", "VP_ACADEMICS", "PRINCIPAL"].map(r => (
                                 <option key={r} value={r}>{r.split('_').join(' ')}</option>
                              ))}
                           </select>
                           <button 
                              disabled={actionLoading || pendingPromotionRole === selectedStaff.role}
                              onClick={() => handleAdminAction('PROMOTE', selectedStaff)}
                              className="bg-white border-2 border-[brand-secondary] text-brand-primary px-8 rounded-2xl font-black text-token-micro uppercase tracking-widest hover:bg-[brand-secondary] transition-all disabled:opacity-30 disabled:grayscale"
                           >
                              {actionLoading ? "SYNCING..." : "PROMOTE"}
                           </button>
                        </div>
                     </div>

                     {/* Dangerous Actions */}
                     <div className="grid grid-cols-2 gap-6">
                        <button 
                           disabled={actionLoading}
                           onClick={() => handleAdminAction('SUSPEND', selectedStaff)}
                           className={cn(
                              "flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border transition-all group",
                              selectedStaff.status === 'DISABLED' 
                                 ? "bg-black/[0.02] border-[brand-secondary] text-[brand-secondary]" 
                                 : "bg-black/[0.02] border-brand-primary/8 text-brand-primary hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50/30"
                           )}
                        >
                           {selectedStaff.status === 'DISABLED' ? <CheckCircle2 size={24} /> : <ShieldOff size={24} />}
                           <span className="text-token-micro font-black uppercase tracking-widest text-center">
                              {selectedStaff.status === 'DISABLED' ? "Reactivate Hub Access" : "Suspend (Temporary)"}
                           </span>
                        </button>

                        <button 
                           disabled={actionLoading}
                           onClick={() => {
                              if(confirm(`WARNING: Deactivating ${selectedStaff.name} is a permanent action. All historical data remains archived. Proceed?`)) {
                                 handleAdminAction('REMOVE', selectedStaff);
                              }
                           }}
                           className="flex flex-col items-center justify-center gap-4 p-8 bg-black/[0.02] border border-brand-primary/8 text-brand-primary hover:border-red-500 hover:text-rose-600 hover:bg-rose-50/30 transition-all"
                        >
                           <UserX size={24} />
                           <span className="text-token-micro font-black uppercase tracking-widest">Remove (Permanent)</span>
                        </button>
                     </div>
                  </div>

                  <div className="bg-black p-5 text-center">
                     <p className="text-token-micro font-black text-white/30 uppercase tracking-[0.5em] font-display">Wajina Institutional Security Protocol Active</p>
                  </div>
               </motion.div>
            </div>
         )}

      </div>
    </DashboardShell>
  );
}

function SummaryCard({ label, value, accent, icon, highlight }: { label: string, value: any, accent: string, icon: React.ReactNode, highlight?: boolean }) {
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

