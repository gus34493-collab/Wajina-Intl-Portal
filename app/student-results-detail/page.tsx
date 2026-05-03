
"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  FileText, 
  MessageSquare, 
  Award, 
  TrendingUp, 
  Search,
  Download,
  Printer,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useSearchParams } from "next/navigation";

function StudentResultsDetailContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "results";
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch("/api/grades");
        if (response.ok) {
          const data = await response.json();
          setGrades(data.grades || []);
        }
      } catch (err) {
        console.error("Result Detail Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto py-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <a href="/student-dashboard" className="flex items-center gap-2 text-token-micro font-black uppercase tracking-widest text-brand-tertiary hover:text-brand-primary no-underline transition-all group">
             <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-all" />
             Back to Dashboard
          </a>
          <div className="flex items-center gap-3">
             <button className="bg-white border border-brand-primary/8 text-brand-primary px-5 py-3 rounded-xl shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Printer size={16} />
                Print Terminal Report
             </button>
             <button className="bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/20 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Download size={16} />
                Secure PDF Export
             </button>
          </div>
        </div>

        {/* Report Card Header */}
        <div className="card p-12 bg-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tertiary/5 rounded-full -mr-32 -mt-32" />
           <div className="w-32 h-32 rounded-3xl bg-brand-blush flex items-center justify-center border-2 border-brand-primary/5 shadow-inner">
              <GraduationCap className="text-brand-tertiary" size={64} />
           </div>
           <div className="flex-1 text-center md:text-left">
              <span className="text-token-micro font-black bg-brand-tertiary/10 text-brand-tertiary px-3 py-1 rounded-full uppercase tracking-widest">Formal Report Card</span>
              <h1 className="text-4xl font-display font-black text-brand-primary tracking-tighter mt-4 mb-2">Academic Performance Summary</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-4">
                 <span className="flex items-center gap-2"><Calendar size={14}/> 2025/26 Session</span>
                 <span className="flex items-center gap-2 text-brand-forest"><div className="w-2 h-2 bg-brand-forest rounded-full"/> First Term</span>
                 <span className="flex items-center gap-2">Class: SS 1 Alpha</span>
              </div>
           </div>
           <div className="bg-brand-primary rounded-[2.5rem] p-8 text-center text-white min-w-[180px] shadow-2xl shadow-brand-primary/30 border border-white/10">
              <p className="text-token-micro font-black uppercase tracking-widest opacity-60 mb-1">Terminal Average</p>
              <h2 className="text-5xl font-display font-black tracking-tighter">78.4</h2>
              <p className="text-token-micro font-black uppercase tracking-widest mt-2 text-brand-accent">Grade: A</p>
           </div>
        </div>

        {/* Dense Grid Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="card p-0 overflow-hidden border-2 border-brand-tertiary/10">
                 <div className="bg-brand-blush p-6 border-b border-brand-primary/8 flex items-center gap-3">
                    <FileText size={18} className="text-brand-tertiary" />
                    <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro">Detailed Subject Assessment</h4>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                         <tr className="bg-white text-token-micro font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/8">
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">CA 1</th>
                            <th className="px-6 py-4">CA 2</th>
                            <th className="px-6 py-4">Exam</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-center">Grade</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-black/5">
                          {loading ? (
                            Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={6} className="h-16 animate-pulse bg-brand-blush/20 border-b border-white"/></tr>)
                          ) : grades.map(g => (
                            <tr key={g.id} className="group hover:bg-brand-blush/30 transition-all">
                               <td className="px-6 py-5">
                                  <p className="text-sm font-black text-brand-primary uppercase tracking-tight">{g.subject.name}</p>
                               </td>
                               <td className="px-6 py-5 text-xs font-bold text-brand-tertiary">{g.firstCA}</td>
                               <td className="px-6 py-5 text-xs font-bold text-brand-tertiary">{g.secondCA}</td>
                               <td className="px-6 py-5 text-xs font-black text-brand-tertiary">{g.exam}</td>
                               <td className="px-6 py-5">
                                  <span className="text-sm font-black text-brand-primary">{g.total}</span>
                               </td>
                               <td className="px-6 py-5 text-center">
                                  <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center text-token-micro font-black ${g.total >= 70 ? 'bg-brand-forest text-white' : 'bg-brand-accent text-brand-primary'}`}>
                                     {g.grade || "C"}
                                  </span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              {/* Teacher Remarks */}
              <div className="card flex flex-col gap-6">
                 <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-brand-tertiary" />
                    <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro">Master's Remarks</h4>
                 </div>
                 <div className="bg-brand-blush/50 rounded-2xl p-6 border border-brand-primary/5">
                    <p className="text-xs text-brand-primary/80 leading-relaxed font-medium italic">
                      "An exceptional performance this term. Your dedication to Mathematics and Physics is clearly reflected in your results. Continue to maintain this rigor in the coming session."
                    </p>
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-brand-primary/5">
                       <div className="w-8 h-8 rounded-lg bg-brand-tertiary/10 grid place-items-center"><Award size={14} className="text-brand-tertiary" /></div>
                       <p className="text-token-micro font-black text-brand-primary uppercase tracking-widest">Mr. Adebayo S. (Form Master)</p>
                    </div>
                 </div>
              </div>

              {/* Cognitive Progress */}
              <div className="card bg-brand-primary text-white">
                 <div className="flex items-center gap-3 mb-8">
                    <TrendingUp size={18} className="text-brand-tertiary" />
                    <h4 className="font-black text-token-micro uppercase tracking-widest opacity-60">Cognitive Trajectory</h4>
                 </div>
                 <div className="space-y-6">
                    <ProgressBar label="Communication" value={85} />
                    <ProgressBar label="Numerical Reasoning" value={92} />
                    <ProgressBar label="Cultural Awareness" value={74} />
                 </div>
              </div>

              <div className="card bg-brand-accent/5 border-brand-accent/20 p-6 flex items-start gap-4">
                 <AlertCircle size={20} className="text-brand-accent shrink-0" />
                 <div>
                    <h4 className="font-black text-xs text-brand-primary uppercase tracking-tight mb-1">Result Query?</h4>
                    <p className="text-token-micro font-bold text-brand-primary/60 leading-relaxed mb-3">
                       If you have questions regarding these grades, you can initiate a formal result audit request.
                    </p>
                    <button className="text-token-micro font-black text-brand-primary uppercase tracking-[0.15em] border-b-2 border-brand-accent pb-0.5">
                       Open Audit Request
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function StudentResultsDetailPage() {
  return (
    <Suspense fallback={
       <DashboardShell>
         <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
           <Loader2 className="w-12 h-12 text-brand-tertiary animate-spin mb-4" />
           <p className="text-token-micro font-black uppercase tracking-[0.2em] text-brand-primary/60">Decrypting Academic Records...</p>
         </div>
       </DashboardShell>
    }>
      <StudentResultsDetailContent />
    </Suspense>
  );
}


function GraduationCap({ size, className }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ProgressBar({ label, value }: any) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-token-micro font-black uppercase tracking-widest">
          <span className="opacity-60">{label}</span>
          <span className="text-brand-tertiary">{value}%</span>
       </div>
       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-brand-tertiary rounded-full" style={{ width: `${value}%` }} />
       </div>
    </div>
  );
}

