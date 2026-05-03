"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { FilePen, Trophy, BarChart3, ChevronRight, Calendar } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function HODDashboard() {
  const { campus } = useAuth();
  const [achievers, setAchievers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: "--", elite: "--", avg: "--%" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [perfRes, reqRes] = await Promise.all([
          fetch("/api/academic/department-stats"),
          fetch("/api/requests?category=ACADEMIC&limit=5"),
        ]);
        if (perfRes.ok) {
          const d = await perfRes.json();
          setAchievers(d.achievers || []);
          setStats({
            pending: d.pendingCount || "--",
            elite: d.eliteCount || "--",
            avg: d.deptAverage ? `${d.deptAverage}%` : "--%",
          });
        }
        if (reqRes.ok) {
          const d = await reqRes.json();
          setTasks(d.requests || []);
        }
      } catch (err) {
        console.error("HOD Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} UNIT</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase mb-1">Academic Excellence</h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-tertiary" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><FilePen size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">ACTIVE SUBMISSIONS</p>
              <p className="text-2xl font-display font-black text-brand-primary my-0.5">{stats.pending}</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest">{campus || "PRIMARY"} UNIT</p>
            </div>
          </div>
          <div className="card flex items-center gap-8 bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10"><Trophy size={24} className="text-brand-accent" /></div>
            <div className="relative z-10">
              <p className="text-token-micro font-black uppercase tracking-[0.3em] opacity-50 mb-1">ELITE SCHOLARS</p>
              <p className="text-2xl font-display font-black my-0.5 text-brand-accent">{stats.elite}</p>
              <p className="text-token-micro font-black text-white/40 uppercase tracking-widest">80% BENCHMARK</p>
            </div>
          </div>
          <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><BarChart3 size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">DEPT. AVERAGE</p>
              <p className="text-2xl font-display font-black text-brand-primary my-0.5">{stats.avg}</p>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">OPTIMAL STABILITY</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 card flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary text-lg">Departmental High Achievers</h4>
              <button className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary bg-brand-blush px-3 py-2 rounded-lg">View Hall of Fame</button>
            </div>
            <div className="flex flex-col gap-4">
              {achievers.length === 0 ? (
                <p className="text-xs text-brand-tertiary text-center py-8 italic">Syncing performance logs...</p>
              ) : (
                achievers.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-accent/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 grid place-items-center shrink-0"><Trophy size={16} className="text-brand-accent" /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">{a.name}</p>
                        <p className="text-token-micro font-bold text-brand-tertiary">{a.subject} • {a.score}%</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-brand-tertiary opacity-50 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 card flex flex-col">
            <h4 className="font-black text-brand-primary mb-8 text-lg">Academic Task Queue</h4>
            <div className="flex flex-col gap-4">
              {tasks.length === 0 ? (
                <p className="text-xs text-brand-tertiary text-center py-8 italic">Loading unit tasks...</p>
              ) : (
                tasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-tertiary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{t.title}</p>
                      <p className="text-token-micro font-bold text-brand-tertiary">{t.sender?.name || "Staff"}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-tertiary opacity-50 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

