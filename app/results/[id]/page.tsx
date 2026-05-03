"use client";

import { useState, useEffect, use } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  ArrowLeft, 
  Printer, 
  FileCheck, 
  BarChart, 
  Award,
  BookOpen,
  User,
  Hash,
  Layers,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudentTranscript({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTranscript() {
      try {
        const res = await fetch(`/api/grades?studentId=${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Transcript fetch failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTranscript();
  }, [id]);

  const grades = data?.grades || [];
  const average = grades.length 
    ? (grades.reduce((sum: number, g: any) => sum + (g.total || 0), 0) / grades.length).toFixed(1)
    : "0.0";

  const getTier = (avg: number) => {
    if (avg >= 75) return "A (EXCELLENT)";
    if (avg >= 65) return "B (COMMENDABLE)";
    if (avg >= 55) return "C (SATISFACTORY)";
    if (avg >= 45) return "D (PASS)";
    return "F (INCOMPLETE)";
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 print:gap-4">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
           <button 
             onClick={() => window.history.back()}
             className="flex items-center gap-2 text-xs font-black text-brand-tertiary hover:text-brand-primary transition-colors uppercase tracking-widest"
           >
              <ArrowLeft size={16} /> Return to Archive
           </button>
           <button 
             onClick={() => window.print()}
             className="bg-brand-primary text-white rounded-xl px-5 py-3 flex items-center gap-2 shadow-2xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
           >
              <Printer size={16} /> Print Official Record
           </button>
        </div>

        {/* Identification Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white border border-brand-primary/8 rounded-[32px] p-8 shadow-premium print:border-none print:shadow-none print:bg-transparent">
           <InfoCell label="Learner Identity" icon={<User size={14} />} val={grades[0]?.student?.name || "Synchronizing..."} />
           <InfoCell label="Identity Code" icon={<Hash size={14} />} val={id || "—"} />
           <InfoCell label="Academic Locus" icon={<Layers size={14} />} val={grades[0]?.student?.enrolledArm?.fullName || "—"} />
           <InfoCell label="Temporal Cycle" icon={<Calendar size={14} />} val={grades[0]?.term?.name || "Current Term"} />
        </div>

        {/* Results Matrix */}
        <div className="card p-0 overflow-hidden border-none shadow-2xl print:shadow-none print:border print:border-brand-primary/10">
           <div className="p-8 border-b border-brand-primary/8 flex justify-between items-center bg-white print:p-4">
              <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={18} className="text-brand-tertiary" />
                Subject Performance Matrix
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-brand-blush text-token-micro font-black uppercase tracking-[0.2em] text-brand-tertiary">
                       <th className="px-8 py-5">Subject Domain</th>
                       <th className="px-8 py-5">1st CA</th>
                       <th className="px-8 py-5">2nd CA</th>
                       <th className="px-8 py-5">3rd CA</th>
                       <th className="px-8 py-5">Exam</th>
                       <th className="px-8 py-5 text-right">Final Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-black/5">
                    {loading ? (
                       <tr><td colSpan={6} className="py-24 text-center font-black text-brand-tertiary uppercase tracking-widest italic animate-pulse">Decrypting Academic Records...</td></tr>
                    ) : grades.length === 0 ? (
                       <tr><td colSpan={6} className="py-24 text-center font-black text-brand-tertiary uppercase tracking-widest italic opacity-50">No validated results identified</td></tr>
                    ) : (
                      grades.map((g: any, i: number) => (
                        <tr key={i} className="hover:bg-brand-blush/50 transition-colors">
                           <td className="px-8 py-5 font-black text-brand-primary text-xs">{g.subject?.name}</td>
                           <td className="px-8 py-5 text-xs text-brand-tertiary font-bold opacity-60">{g.firstCA ?? "--"}</td>
                           <td className="px-8 py-5 text-xs text-brand-tertiary font-bold opacity-60">{g.secondCA ?? "--"}</td>
                           <td className="px-8 py-5 text-xs text-brand-tertiary font-bold opacity-60">{g.thirdCA ?? "--"}</td>
                           <td className="px-8 py-5 text-xs text-brand-tertiary font-bold opacity-60">{g.exam ?? "--"}</td>
                           <td className="px-8 py-5 text-right">
                              <span className={clsx(
                                "px-4 py-1.5 rounded-lg font-black text-token-caption shadow-sm",
                                (g.total || 0) >= 75 ? "bg-brand-success text-white" : (g.total || 0) >= 45 ? "bg-brand-accent text-brand-primary" : "bg-brand-error text-white"
                              )}>
                                {g.total || 0}/100
                              </span>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Statistical Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <MetricCard label="Cycle Average" val={`${average}%`} icon={<BarChart className="text-brand-tertiary" />} />
           <MetricCard label="Locus Position" val={grades[0]?.position || "--"} icon={<FileCheck className="text-brand-tertiary" />} />
           <MetricCard label="Mastery Tier" val={getTier(parseFloat(average))} icon={<Award className="text-brand-tertiary" />} />
        </div>

        {/* Print Disclaimer */}
        <div className="hidden print:block mt-20 border-t border-brand-primary/10 pt-8 text-center">
           <p className="text-token-micro font-black uppercase text-brand-primary tracking-widest">Wajina International Schools Academic Registry</p>
           <p className="text-token-micro font-bold text-brand-tertiary mt-1">This is a system-generated transcript and remains valid unless contested by the institutional directorate.</p>
        </div>

      </div>
    </DashboardShell>
  );
}

function InfoCell({ label, icon, val }: any) {
  return (
    <div className="flex flex-col gap-2">
       <div className="flex items-center gap-1.5 opacity-40">
          {icon}
          <label className="text-token-micro font-black uppercase tracking-widest">{label}</label>
       </div>
       <span className="text-sm font-black text-brand-primary truncate">{val}</span>
    </div>
  );
}

function MetricCard({ label, val, icon }: any) {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center gap-4 border-none shadow-premium print:border print:border-brand-primary/10 print:shadow-none">
       <div className="p-4 bg-brand-blush rounded-2xl">
          {icon}
       </div>
       <div>
          <p className="text-3xl font-display font-black text-brand-primary tracking-tighter italic">{val}</p>
          <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest mt-2">{label}</p>
       </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
