"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { Clock, Presentation, ChevronRight, Upload, Table, Calendar } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function TeacherDashboard() {
  const { campus } = useAuth();
  const [gradingFeed, setGradingFeed] = useState<any[]>([]);
  const [stats, setStats] = useState({ upcoming: "--", classesToday: "--", compliance: "0%" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/academic/teacher-stats");
        if (res.ok) {
          const d = await res.json();
          setStats({
            upcoming: d.upcomingGrades || "--",
            classesToday: d.classesToday || "--",
            compliance: d.compliance ? `${d.compliance}%` : "0%",
          });
          setGradingFeed(d.recentGrading || []);
        }
      } catch (err) {
        console.error("Teacher Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} FACULTY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase leading-none">
              My <span className="text-brand-accent">Workspace</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-brand-primary/5 rounded-2xl px-5 py-3.5 shadow-sm self-start">
            <Calendar size={18} className="text-brand-accent" />
            <span className="text-xs font-black text-brand-primary tracking-widest uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="card flex flex-col items-center justify-center text-center p-12 bg-white">
            <h3 className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] self-start mb-10">GRADING PROGRESS</h3>
            <div className="w-48 h-48 rounded-full border-8 border-brand-primary/5 flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-2 rounded-full border-4 border-brand-accent/20" />
              <span className="text-4xl font-display font-black text-brand-primary">{stats.compliance}</span>
            </div>
            <p className="text-token-micro font-black text-brand-accent mt-10 uppercase tracking-widest">This Week's Progress</p>
          </div>

          <div className="flex flex-col gap-5 md:gap-8">
            <div className="card flex-1 flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300">
               <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                 <Clock size={24} className="text-brand-accent" />
               </div>
               <div className="space-y-1">
                 <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">UPCOMING GRADES</p>
                 <p className="text-4xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">{stats.upcoming}</p>
               </div>
            </div>
            <div className="card flex-1 flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300">
               <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500">
                 <Presentation size={24} className="text-brand-accent" />
               </div>
               <div className="space-y-1">
                 <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">CLASSES TODAY</p>
                 <p className="text-4xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">{stats.classesToday}</p>
               </div>
            </div>
          </div>

          <div className="card flex flex-col bg-white p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">RECENT GRADES</h3>
              <div className="bg-brand-accent/10 px-3 py-1 rounded-full">
                 <span className="text-token-micro font-black text-brand-accent uppercase tracking-widest">7 Days</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
               <div className="text-center space-y-2">
                  <Table size={32} className="mx-auto text-brand-primary opacity-10 mb-3" />
                  <p className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/30">No grades submitted yet.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
          <div className="card flex flex-col">
            <h4 className="font-black text-brand-primary mb-8">Recent Grading Activity</h4>
            <div className="flex flex-col gap-4">
              {gradingFeed.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <Clock size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No grading activity yet.</p>
                </div>
              ) : (
                gradingFeed.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{g.subject} — {g.className}</p>
                      <p className="text-token-micro font-bold text-brand-primary/50">{g.studentsGraded} students • {g.date}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group p-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-base font-black uppercase tracking-[0.2em] mb-10 relative z-10">Quick Access</h4>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <a href="/gradebook" className="bg-white/5 p-8 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 group/btn">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center mb-6 group-hover/btn:bg-brand-accent group-hover/btn:text-brand-primary transition-colors">
                  <Table size={24} className="text-brand-accent group-hover/btn:text-brand-primary" />
                </div>
                <span className="font-black text-xs block uppercase tracking-widest text-white/60 group-hover/btn:text-white transition-colors">Master Gradebook</span>
              </a>
              <a href="/teacher-submissions-review" className="bg-white/5 p-8 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 group/btn">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center mb-6 group-hover/btn:bg-brand-accent group-hover/btn:text-brand-primary transition-colors">
                  <Upload size={24} className="text-brand-accent group-hover/btn:text-brand-primary" />
                </div>
                <span className="font-black text-xs block uppercase tracking-widest text-white/60 group-hover/btn:text-white transition-colors">Portal Submission</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

