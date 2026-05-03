"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Award, 
  FileCheck, 
  FileText, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function TestimonialsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("TESTIMONIAL");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch certs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [type]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-tertiary/10 grid place-items-center text-brand-tertiary">
                   <Award size={20} />
                </div>
                <span className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest">Graduation & Certification</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-tight">Institutional Document Authority</h1>
             <p className="text-brand-primary/60 text-lg font-medium mt-1 max-w-2xl">Official issuance and cryptographic validation of student attestations and valedictory testimonials.</p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="bg-white border border-brand-primary/8 rounded-2xl p-1 flex shadow-sm">
                 <TypeToggle label="Testimonials" active={type === "TESTIMONIAL"} onClick={() => setType("TESTIMONIAL")} />
                 <TypeToggle label="Attestations" active={type === "ATTESTATION"} onClick={() => setType("ATTESTATION")} />
              </div>
              <button className="bg-brand-primary text-white p-5 rounded-2xl flex items-center justify-center press-effect shadow-xl shadow-brand-primary/20">
                 <Plus size={24} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           
           {/* Summary Sidebar */}
           <div className="lg:col-span-1 space-y-8">
              <div className="card glass-premium p-10 flex flex-col gap-8">
                 <div className="flex flex-col gap-1">
                    <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Total Issued</p>
                    <p className="text-4xl font-display font-black text-brand-primary">{records.length}</p>
                 </div>
                 <div className="w-full h-1.5 bg-brand-blush rounded-full overflow-hidden">
                    <div className="bg-brand-tertiary w-full h-full rounded-full" />
                 </div>
                 <div className="flex flex-col gap-4 pt-4 border-t border-brand-primary/8">
                    <StatusSummary label="Approved" count={0} color="text-brand-success" />
                    <StatusSummary label="Pending Sign" count={records.length} color="text-brand-accent" />
                    <StatusSummary label="Draft" count={0} color="text-brand-tertiary" />
                 </div>
              </div>

              <div className="card bg-brand-primary text-white p-10 flex flex-col gap-6">
                 <ShieldCheck size={32} className="text-brand-tertiary" />
                 <div>
                    <h5 className="font-black text-lg leading-tight mb-2">Automated Verification</h5>
                    <p className="text-xs font-bold text-white/60 leading-relaxed">Every document carries a unique QR-bound cryptographic seal for external verification by universities and employers.</p>
                 </div>
                 <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-colors text-token-micro font-black uppercase tracking-widest rounded-xl">
                    Verify Document Logic
                 </button>
              </div>
           </div>

           {/* Records Display */}
           <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {loading ? (
                    Array(4).fill(0).map((_, i) => (
                       <div key={i} className="card h-64 animate-pulse bg-white/50" />
                    ))
                 ) : records.length === 0 ? (
                    <div className="col-span-full py-32 text-center card bg-white">
                       <FileText className="mx-auto text-brand-tertiary/10 mb-6" size={64} />
                       <h3 className="text-xl font-black text-brand-primary">No Active Issuances</h3>
                       <p className="text-brand-tertiary text-sm mt-1">Start by issuing a new {type.toLowerCase()} record.</p>
                    </div>
                 ) : records.map((record) => (
                    <motion.div 
                       key={record.id}
                       initial={{ opacity: 0, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="card group hover:border-brand-tertiary/20 transition-all p-10 flex flex-col gap-8 relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Award size={80} className="text-brand-tertiary" />
                       </div>

                       <div className="flex flex-col gap-1 z-10">
                          <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{type}</span>
                          <h4 className="text-xl font-black text-brand-primary tracking-tight">{record.student.name}</h4>
                          <p className="text-xs font-bold text-brand-tertiary uppercase tracking-widest">{record.student.enrolledClass?.name || "Graduand"}</p>
                       </div>

                       <div className="flex items-center gap-8 pt-6 border-t border-brand-primary/8 z-10">
                          <div className="flex flex-col gap-0.5">
                             <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-tighter">Status</p>
                             <div className="flex items-center gap-1.5 text-brand-accent">
                                <Plus size={12} className="animate-pulse" />
                                <span className="text-token-micro font-black uppercase">PENDING APPROVAL</span>
                             </div>
                          </div>
                          <button className="ml-auto w-12 h-12 rounded-2xl bg-brand-blush grid place-items-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all">
                             <ArrowUpRight size={20} />
                          </button>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </DashboardShell>
  );
}

function TypeToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-3 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all ${
        active ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20" : "text-brand-tertiary hover:text-brand-primary"
      }`}
    >
      {label}
    </button>
  );
}

function StatusSummary({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex items-center justify-between text-token-caption font-black uppercase tracking-tight">
       <span className="text-brand-tertiary">{label}</span>
       <span className={color}>{count}</span>
    </div>
  );
}

