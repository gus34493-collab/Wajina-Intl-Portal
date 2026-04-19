"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Loader2,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeacherData() {
      try {
        const [rRes, sRes] = await Promise.all([
          fetch("/api/requests?status=PENDING"),
          fetch("/api/structure/subjects")
        ]);
        const rData = await rRes.json();
        const sData = await sRes.json();
        
        setData(rData);
        setSubjects(sData.subjects || []);

      } catch (err) {
        console.error("Teacher fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherData();
  }, []);

  const pendingGrading = (data?.requests || []).filter((r: any) => r.category === 'GRADING' || r.title.toLowerCase().includes('result'));

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase">Instructional Cockpit</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Managing assigned subjects, terminal results, and instructional compliance.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-black/5 rounded-2xl px-5 py-3 shadow-md">
            <Clock size={16} className="text-brand-saffron" />
            <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-[0.2em]">Live Term: 2026/1</span>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
             label="Assigned Domains" 
             value={subjects.length || "0"} 
             sub="Active Subjects" 
             icon={<BookOpen className="text-brand-moonstone" />} 
             color="moonstone" 
          />
          <KPICard 
             label="Grading Tasks" 
             value={pendingGrading.length || "0"} 
             sub="Awaiting Entry" 
             icon={<ClipboardList className="text-brand-saffron" />} 
             color="saffron" 
          />
          <KPICard 
             label="Compliance Rating" 
             value="94%" 
             sub="Submission Pulse" 
             icon={<BarChart3 className="text-brand-moonstone" />} 
             color="moonstone" 
             dark
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Subject Management */}
            <div className="card">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                    <FileText size={18} className="text-brand-moonstone" />
                    Assigned Marksheets
                  </h3>
                  <button className="text-[10px] font-black text-brand-moonstone uppercase tracking-widest">Global Overview</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-32 bg-brand-bg rounded-2xl animate-pulse" />
                    ))
                  ) : subjects.length === 0 ? (
                    <div className="col-span-2 py-20 text-center opacity-40 italic text-xs font-black text-text-muted uppercase tracking-widest">
                      No subjects identified in academic registry.
                    </div>
                  ) : (
                    subjects.map((sub: any, i: number) => (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -4 }}
                        className="p-6 bg-brand-bg rounded-2xl border border-black/5 flex flex-col justify-between h-40 group hover:border-brand-moonstone/20 transition-all cursor-pointer"
                        onClick={() => window.location.href = `/gradebook?subjectId=${sub.id}`}
                      >
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="text-xs font-black text-brand-gunmetal group-hover:text-brand-moonstone transition-colors">{sub.name}</p>
                               <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest leading-none">{sub.class.name} • {sub.class.campus}</p>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                               <TrendingUp size={14} className="text-brand-success" />
                            </div>
                         </div>
                         <div className="flex items-center justify-between mt-8">
                            <span className="text-[10px] font-black uppercase text-brand-moonstone tracking-widest">Open Gradebook</span>
                            <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                         </div>
                      </motion.div>
                    ))
                  )}
               </div>
            </div>

            {/* Teaching Schedule (Mock) */}
            <div className="card bg-brand-gunmetal text-white border-none shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Calendar size={80} />
               </div>
               <div className="relative z-10 flex flex-col gap-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-saffron italic">Daily Locus Pulse</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                     <ScheduleItem time="08:30" subject="Mathematics" locus="SS3 Alpha" />
                     <ScheduleItem time="10:45" subject="Further Math" locus="SS2 Beta" />
                     <ScheduleItem time="13:15" subject="Calculus" locus="SS1 Gamma" />
                     <ScheduleItem time="14:50" subject="Lab Prep" locus="Science Annex" />
                  </div>
               </div>
            </div>

          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-8">
            
            {/* Task Compliance Gauge (Simplified) */}
            <div className="card flex flex-col items-center justify-center p-8 bg-white border border-black/5 shadow-2xl">
                <h4 className="font-black text-brand-gunmetal mb-6 self-start uppercase text-xs tracking-widest">Instructional Health</h4>
                <div className="w-44 h-44 rounded-full border-[10px] border-brand-bg flex items-center justify-center relative">
                   <div className="absolute inset-0 rounded-full border-[10px] border-brand-moonstone border-t-transparent -rotate-45" />
                   <div className="text-center">
                      <p className="text-2xl font-display font-black text-brand-gunmetal">85%</p>
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Optimal</p>
                   </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Grading Velocity</p>
                  <p className="text-xs font-bold text-brand-success mt-1">Registry Verified</p>
                </div>
            </div>

            {/* Urgent Alerts Feed */}
            <div className="card border-l-4 border-l-brand-error glass-premium flex flex-col gap-6">
               <div className="flex items-center gap-2">
                 <AlertCircle className="text-brand-error" size={20} />
                 <h4 className="font-black text-brand-gunmetal tracking-tight uppercase text-xs tracking-widest">Grading Backlog</h4>
               </div>

               <div className="space-y-4">
                  {pendingGrading.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-brand-bg p-4 rounded-xl border border-black/5 hover:bg-white transition-colors cursor-pointer group">
                       <div className="w-2 h-2 rounded-full bg-brand-error shrink-0" />
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-brand-gunmetal truncate group-hover:text-brand-moonstone transition-colors">{t.title}</p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Due in 48h</p>
                       </div>
                    </div>
                  ))}
                  {pendingGrading.length === 0 && !loading && (
                    <div className="py-8 text-center text-xs font-bold text-text-muted italic flex flex-col items-center gap-3">
                       <CheckCircle2 size={24} className="text-brand-success opacity-20" />
                       All work up to date.
                    </div>
                  )}
               </div>

               <button className="btn-primary w-full py-4 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                 <ClipboardList size={14} />
                 Bulk Result Entry
               </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-3">
               <QuickLink label="Lesson Note Submission" />
               <QuickLink label="Time-table Archive" />
               <QuickLink label="Request Resource" />
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ScheduleItem({ time, subject, locus }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
       <div className="text-[10px] font-black text-brand-saffron uppercase">{time}</div>
       <div>
          <p className="text-xs font-black text-white leading-none">{subject}</p>
          <p className="text-[9px] font-black text-white/40 uppercase mt-1">{locus}</p>
       </div>
    </div>
  );
}

function KPICard({ label, value, sub, icon, color, dark = false }: any) {
  return (
    <div className={clsx(
      "card h-44 border-none flex flex-col justify-between p-8 group hover:-translate-y-1 transition-all shadow-premium",
      dark ? "bg-brand-gunmetal text-white" : "bg-white text-brand-gunmetal"
    )}>
       <div className="flex justify-between items-center">
          <h3 className={clsx("text-[11px] font-black uppercase tracking-widest", dark ? "text-white/40" : "text-text-muted")}>{label}</h3>
          <div className="p-3 bg-brand-bg rounded-xl">
             {icon}
          </div>
       </div>
       <div>
          <div className="text-4xl font-display font-black tracking-tighter italic mb-1">{value}</div>
          <p className={clsx("text-[10px] font-black uppercase tracking-widest", dark ? "text-brand-saffron" : "text-brand-success")}>{sub}</p>
       </div>
    </div>
  );
}

function QuickLink({ label }: { label: string }) {
  return (
    <button className="w-full flex justify-between items-center p-4 bg-white border border-black/5 rounded-xl hover:bg-brand-bg transition-colors group">
      <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-widest">{label}</span>
      <ChevronRight size={14} className="text-text-muted group-hover:text-brand-moonstone transition-colors" />
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
