"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Loader2,
  Lock,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PerformanceBarChart, RevenueGauge } from "@/app/components/Charts";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function PrincipalDashboard() {
  const { campus } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meanScore, setMeanScore] = useState(0);

  useEffect(() => {
    async function fetchPrincipalData() {
      try {
        const res = await fetch("/api/grades/pending-review?overrideFormMaster=true");
        const json = await res.json();

        setData(json);

        // Calculate institutional mean from the feed
        const allGrades = json.grades || [];
        if (allGrades.length > 0) {
          const total = allGrades.reduce((sum: number, g: any) => sum + (g.total || 0), 0);
          setMeanScore(Math.round(total / allGrades.length));
        }

      } catch (err) {
        console.error("Principal fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrincipalData();
  }, []);

  const anomalies = (data?.grades || [])
    .filter((g: any) => Math.abs((g.total || 0) - meanScore) > 20)
    .slice(0, 5);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "SECONDARY"} OVERSIGHT</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase italic italic">Academic Overview</h1>
          </div>
          <div className="flex items-center gap-3 bg-white border border-brand-primary/8 rounded-2xl px-5 py-3 shadow-md">
            <Lock size={16} className="text-brand-accent" />
            <span className="text-token-micro font-black text-brand-primary uppercase tracking-[0.2em]">{campus || "SECONDARY"} CAMPUS</span>
          </div>
        </div>

        {/* Operational Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Feed (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card border-l-4 border-l-brand-tertiary flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-tertiary/10 flex items-center justify-center">
                  <FileCheck className="text-brand-tertiary" size={24} />
                </div>
                <div>
                  <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Pending Signatures</p>
                  <p className="text-2xl font-display font-black text-brand-primary my-0.5">{data?.pendingCount || "0"}</p>
                  <p className="text-token-micro font-bold text-brand-tertiary">Grades awaiting review</p>
                </div>
              </div>
              <div className="card border-l-4 border-l-brand-accent flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                  <Zap className="text-brand-accent" size={24} />
                </div>
                <div>
                  <p className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Mastery Level</p>
                  <p className="text-2xl font-display font-black text-brand-primary my-0.5">{meanScore}%</p>
                  <p className="text-token-micro font-bold text-brand-accent">Institutional average</p>
                  <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-1">↑ +4pts from last term</p>
                </div>
              </div>
            </div>

            {/* Subject Mastery Performance */}
            <div className="card h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h4 className="font-black text-brand-primary tracking-tight">Subject Mastery Benchmark</h4>
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Principal Overview</p>
              </div>
              <div className="h-[280px]">
                {meanScore > 0 && <PerformanceBarChart
                  data={[meanScore, 75, 62, 88, 55]}
                  labels={["Inst. Mean", "Math", "English", "Science", "Civics"]}
                />}
              </div>
            </div>

            {/* Pending Approvals Table */}
            <div className="card text-white border-none p-0 overflow-hidden shadow-2xl" style={{ backgroundColor: '#1F2419' }}>
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <h4 className="font-black text-lg tracking-tight">Grade Review Queue</h4>
                <button className="text-token-micro font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all">Batch Approve</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/20 text-token-micro font-black uppercase tracking-widest text-white/50">
                    <tr>
                      <th className="px-8 py-4">Scholar</th>
                      <th className="px-8 py-4">Subject</th>
                      <th className="px-8 py-4 text-center">Score</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {loading ? (
                      <tr><td colSpan={4} className="py-20 text-center text-white/30 font-bold uppercase tracking-widest">Loading grades...</td></tr>
                    ) : data?.grades.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center text-white/30 font-bold uppercase tracking-widest">No pending approvals</td></tr>
                    ) : (
                      data.grades.slice(0, 8).map((g: any) => (
                        <tr key={g.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-4">
                            <p className="font-black text-white group-hover:text-brand-secondary transition-colors">{g.student.name}</p>
                            <p className="text-token-micro font-bold text-white/40 uppercase tracking-widest">{g.student.enrolledArm?.fullName || "—"}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="font-bold text-white/80">{g.subject.name}</p>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <span className={clsx(
                              "font-black py-1 px-3 rounded-md",
                              g.total >= 70 ? "bg-brand-secondary/20 text-brand-secondary" : "bg-white/10 text-white"
                            )}>
                              {g.total}%
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <ChevronRight className="inline-block text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" size={16} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-8">

            {/* Registry Health Gauge */}
            <div className="card flex flex-col items-center justify-center p-8 bg-white border border-brand-primary/8">
              <h4 className="font-black text-brand-primary mb-6 self-start uppercase text-xs tracking-widest">Review Progress</h4>
              <div className="w-44 h-44">
                <RevenueGauge collected={78} expected={100} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Grade Status</p>
                <p className="text-lg font-display font-black text-brand-success mt-1">Grade Optimal</p>
              </div>
            </div>

            {/* Anomaly Alerts */}
            <div className="card border-l-4 border-l-brand-error glass-premium flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-error" size={20} />
                <h4 className="font-black text-brand-primary tracking-tight">Academic Anomalies</h4>
              </div>

              <div className="space-y-4">
                {anomalies.map((g: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-brand-blush/50 p-4 rounded-xl border border-brand-primary/8">
                    <div className="w-2 h-2 rounded-full bg-brand-error shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-brand-primary truncate">{g.student.name}</p>
                      <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest">{g.subject.name}: {g.total}%</p>
                    </div>
                  </div>
                ))}
                {anomalies.length === 0 && !loading && (
                  <div className="py-8 text-center text-xs font-bold text-brand-primary/40 italic flex flex-col items-center gap-3">
                    <CheckCircle2 size={24} className="text-brand-success opacity-20" />
                    Registry is healthy.
                  </div>
                )}
              </div>

              <button className="btn-primary w-full py-4 text-token-micro uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={14} />
                Calibrate Alerts
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-3">
              <QuickLink label="Term Summary" />
              <QuickLink label="Student Lookup" />
              <QuickLink label="Operation Log" />
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickLink({ label }: { label: string }) {
  return (
    <button className="w-full flex justify-between items-center p-4 bg-white border border-brand-primary/8 rounded-xl hover:bg-brand-blush transition-colors group">
      <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">{label}</span>
      <ChevronRight size={14} className="text-brand-primary/30 group-hover:text-brand-primary transition-colors" />
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

