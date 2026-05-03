"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  FilePlus, 
  Send, 
  ChevronRight, 
  AlertCircle,
  Receipt,
  Building,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInstitutionalRequest } from "@/app/actions/requests";

export default function IssueExpensePage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    details: "",
    amount: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setStatus("IDLE");

    try {
      const res = await createInstitutionalRequest({
        title: formData.title,
        details: formData.details,
        amount: parseFloat(formData.amount),
        senderId: user.id,
        senderRole: user.role,
        campus: user.campus || "PRIMARY"
      });

      if (res.success) {
        setStatus("SUCCESS");
        setFormData({ title: "", details: "", amount: "" });
      } else {
        setStatus("ERROR");
      }
    } catch (err) {
      setStatus("ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-4xl mx-auto py-12 px-6">
        
        {/* Header Unit */}
        <div className="flex flex-col gap-4 text-center items-center">
           <div className="w-16 h-16 rounded-[2rem] bg-brand-primary text-white flex items-center justify-center shadow-2xl shadow-brand-primary/20 mb-4">
              <FilePlus size={32} />
           </div>
           <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight">Propose Expenditure</h1>
           <p className="text-brand-primary/60 text-lg font-medium max-w-md">Submit a new spending request to the institutional headquarters for authorization.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
           
           {/* Form Container */}
           <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="card p-10 flex flex-col gap-8 shadow-premium border-brand-primary/8 bg-white">
                 
                 <div className="space-y-2">
                    <label className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest pl-1">Request Title</label>
                    <Input 
                       required
                       placeholder="e.g. Laboratory Chemicals Restock"
                       className="py-7 rounded-2xl border-brand-primary/8 bg-brand-blush/50 focus:ring-brand-tertiary/10"
                       value={formData.title}
                       onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest pl-1">Estimated Amount (₦)</label>
                       <Input 
                          required
                          type="number"
                          placeholder="0,00"
                          className="py-7 rounded-2xl border-brand-primary/8 bg-brand-blush/50"
                          value={formData.amount}
                          onChange={e => setFormData({ ...formData, amount: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest pl-1">Department</label>
                       <div className="py-4 px-6 rounded-2xl bg-brand-blush border border-brand-primary/8 flex items-center justify-between text-xs font-black text-brand-primary uppercase">
                          Academic Core
                          <Building size={14} className="text-brand-tertiary" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest pl-1">Detailed Rationale</label>
                    <textarea 
                       required
                       rows={4}
                       placeholder="Explain why this expenditure is mission-critical..."
                       className="w-full p-6 rounded-2xl border-brand-primary/8 bg-brand-blush/50 focus:ring-brand-tertiary/10 text-brand-primary text-sm font-medium outline-none resize-none"
                       value={formData.details}
                       onChange={e => setFormData({ ...formData, details: e.target.value })}
                    />
                 </div>

                 <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-8 rounded-[1.5rem] bg-brand-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all press-effect"
                 >
                    {isSubmitting ? "Transmitting..." : (
                      <>
                        <Send size={18} className="mr-3" />
                        Submit for Authorization
                      </>
                    )}
                 </Button>

                 {status === "SUCCESS" && (
                    <div className="p-6 bg-brand-success/10 rounded-2xl flex items-center gap-4 text-brand-success border border-brand-success/20">
                       <Receipt size={24} />
                       <div>
                          <p className="font-black uppercase text-xs">Request Transmitted</p>
                          <p className="text-token-micro font-bold">Awaiting executive review.</p>
                       </div>
                    </div>
                 )}
              </form>
           </div>

           {/* Informational Sidebar */}
           <div className="lg:col-span-2 space-y-6">
              <div className="card glass-premium p-8 border-l-4 border-l-brand-accent">
                 <div className="flex items-start gap-4">
                    <Info size={20} className="text-brand-accent" />
                    <div>
                        <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-caption mb-2">Fiscal Policy</h4>
                        <p className="text-xs font-bold text-brand-primary/60 leading-relaxed">All expenditure requests over ₦100,000 require manual Director approval. Ensure your rationale is forensic and complete.</p>
                    </div>
                 </div>
              </div>

              <div className="card bg-brand-blush p-8 flex flex-col gap-6">
                 <div className="flex items-center justify-between text-token-micro font-black text-brand-tertiary uppercase tracking-widest">
                    <span>Audit Trail Status</span>
                    <span className="text-brand-success">Locked</span>
                 </div>
                 <div className="space-y-4">
                    <LogStep label="Request Origin" time="Now" active />
                    <LogStep label="Bursary Verification" time="Pending" />
                    <MotionChevron />
                    <LogStep label="Executive Authorization" time="Pending" />
                 </div>
              </div>
           </div>

        </div>

      </div>
    </DashboardShell>
  );
}

function LogStep({ label, time, active = false }: { label: string, time: string, active?: boolean }) {
  return (
    <div className="flex items-center justify-between">
       <span className={`text-token-caption font-bold ${active ? "text-brand-primary" : "text-brand-tertiary"}`}>{label}</span>
       <span className="text-token-micro font-black uppercase text-brand-tertiary">{time}</span>
    </div>
  );
}

function MotionChevron() {
   return (
      <div className="flex flex-center justify-center py-1 opacity-20">
         <ChevronRight rotate={90} size={14} className="rotate-90" />
      </div>
   );
}

