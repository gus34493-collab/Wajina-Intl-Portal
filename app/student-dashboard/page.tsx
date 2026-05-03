"use client";

import DashboardShell from "@/app/components/DashboardShell";
import { TrendingUp, CalendarCheck, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const { campus } = useAuth();
  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} LEARNER</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase leading-none">
              LEARNING <span className="text-brand-accent">POD</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-brand-primary/5 rounded-2xl px-5 py-3.5 shadow-sm self-start">
            <Calendar size={18} className="text-brand-accent" />
            <span className="text-xs font-black text-brand-primary tracking-widest uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="card flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
               <TrendingUp size={24} className="text-brand-accent" />
            </div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">TERM GPA</p>
              <p className="text-2xl md:text-3xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">B+</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1 h-1 rounded-full bg-brand-secondary" />
                <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Top Percentile</p>
              </div>
            </div>
          </div>

          <div className="card flex items-center gap-6 bg-white group hover:translate-y-[-4px] transition-all duration-300 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
               <CalendarCheck size={24} className="text-brand-accent" />
            </div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">ATTENDANCE</p>
              <p className="text-2xl md:text-3xl font-display font-black text-brand-primary uppercase tracking-tighter leading-none">98.4%</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1 h-1 rounded-full bg-brand-secondary" />
                <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Optimal Registry</p>
              </div>
            </div>
          </div>

          <div className="card flex items-center gap-6 bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10">
               <Clock size={24} className="text-brand-accent" />
            </div>
            <div className="relative z-10">
              <p className="text-token-micro font-black uppercase tracking-[0.3em] opacity-50 mb-1">DEADLINES</p>
              <p className="text-2xl md:text-3xl font-display font-black uppercase tracking-tighter leading-none text-brand-accent">03</p>
              <p className="text-token-micro font-black text-white/40 uppercase tracking-widest mt-2 italic">Urgent Action Required</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
          {/* Subject Roster */}
          <div className="lg:col-span-2 card bg-white p-10">
            <div className="flex justify-between items-center mb-10">
              <h4 className="font-black text-brand-primary text-xl uppercase tracking-tight">Academic Roster</h4>
              <a href="/student-previous-results" className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-accent bg-brand-primary px-4 py-3 rounded-xl no-underline hover:scale-105 transition-transform shadow-lg">Institutional Transcript</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "Mathematics", score: "78% (A)", grade: "Gold" },
                { name: "English Language", score: "82% (A)", grade: "Gold" },
                { name: "Physics", score: "74% (B)", grade: "Silver" },
                { name: "Chemistry", score: "81% (A)", grade: "Gold" },
              ].map((s, i) => (
                <div key={i} className="p-6 bg-white/50 rounded-[1.5rem] border border-brand-primary/5 shadow-sm group hover:border-brand-accent/30 transition-all">
                  <p className="font-black text-brand-primary text-sm mb-2 uppercase tracking-tight">{s.name}</p>
                  <div className="flex items-center justify-between">
                     <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">{s.score}</p>
                     <div className="w-2 h-2 rounded-full bg-brand-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="card bg-white p-10">
            <h4 className="font-black text-brand-primary text-xl mb-8 uppercase tracking-tight">Timeline</h4>
            <div className="flex flex-col gap-6">
              {[
                { time: "08:00 - 08:45", subject: "Biology (Lab 1)", active: true },
                { time: "08:45 - 09:30", subject: "Further Maths", active: false },
                { time: "09:30 - 10:15", subject: "Civic Education", active: false },
              ].map((s, i) => (
                <div key={i} className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer",
                  s.active ? "bg-brand-primary text-white border-none shadow-xl scale-105" : "bg-white/50 border-brand-primary/5 text-brand-primary"
                )}>
                  <p className="text-token-micro font-black uppercase tracking-[0.2em] mb-1 opacity-60">{s.time}</p>
                  <p className="text-sm font-black uppercase tracking-tight">{s.subject}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 bg-brand-primary text-white rounded-xl text-token-micro font-black uppercase tracking-[0.3em] hover:bg-brand-accent hover:text-brand-primary transition-all shadow-lg shadow-brand-primary/10">Full Registry Schedule</button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

