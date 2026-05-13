"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { FilePen, Trophy, BarChart3, ChevronRight, Bell } from "lucide-react";
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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} UNIT</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Academic <span className="text-brand-secondary">Excellence</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              HD
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <FilePen size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Active Submissions</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.pending}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              {campus || "PRIMARY"} Unit
            </span>
          </div>

          <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-white" />
              </div>
              <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Elite Scholars</p>
            </div>
            <p className="text-5xl font-display font-black text-white leading-none tracking-tighter">{stats.elite}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white/10 text-white text-token-micro font-black uppercase tracking-widest">
              80% Benchmark
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Dept. Average</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.avg}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              Optimal Stability
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-brand-primary">Departmental High Achievers</h4>
              <button className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">View Hall of Fame</button>
            </div>
            <div className="flex flex-col gap-3">
              {achievers.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <Trophy size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest italic">Syncing performance logs…</p>
                </div>
              ) : (
                achievers.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-secondary/10 grid place-items-center shrink-0">
                        <Trophy size={16} className="text-brand-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">{a.name}</p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">{a.subject} · {a.score}%</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <h4 className="font-black text-brand-primary mb-6">Academic Task Queue</h4>
            <div className="flex flex-col gap-3">
              {tasks.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <FilePen size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest italic">Loading unit tasks…</p>
                </div>
              ) : (
                tasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{t.title}</p>
                      <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">{t.sender?.name || "Staff"}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/20 group-hover:translate-x-0.5 transition-all shrink-0" />
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
