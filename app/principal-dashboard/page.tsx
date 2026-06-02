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
  Loader2,
  Bell,
  UserPlus,
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

  const subjectMap: Record<string, { sum: number; count: number }> = {};
  for (const g of data?.grades || []) {
    const name: string = g.subject.name;
    if (!subjectMap[name]) subjectMap[name] = { sum: 0, count: 0 };
    subjectMap[name].sum += g.total || 0;
    subjectMap[name].count += 1;
  }
  const topSubjects = Object.entries(subjectMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 4)
    .map(([name, { sum, count }]) => ({ name: name.slice(0, 8), avg: Math.round(sum / count) }));
  const chartData = [meanScore, ...topSubjects.map((s) => s.avg)];
  const chartLabels = ["Mean", ...topSubjects.map((s) => s.name)];

  const reviewedCount = data ? Math.max(0, (data.total || 0) - (data.pendingCount || 0)) : 0;
  const gaugeTotal = data?.total || 1;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Good morning, Principal
            </h1>
            <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              {campus || "Secondary"} Campus
            </span>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-secondary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="text-brand-secondary" size={20} />
                  </div>
                  <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50">
                    Pending Signatures
                  </p>
                </div>
                <p className="text-5xl font-display font-black text-brand-primary leading-none">
                  {loading ? <Loader2 size={32} className="animate-spin text-brand-primary/30" /> : (data?.pendingCount ?? 0)}
                </p>
                <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
                  Grades awaiting review
                </span>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                    <Zap className="text-brand-accent" size={20} />
                  </div>
                  <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50">
                    Mastery Score
                  </p>
                </div>
                <p className="text-5xl font-display font-black text-brand-primary leading-none">
                  {loading ? <Loader2 size={32} className="animate-spin text-brand-primary/30" /> : `${meanScore}%`}
                </p>
                <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
                  Institutional average
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-brand-primary tracking-tight">Subject Mastery Benchmark</h4>
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest hidden sm:block">Principal Overview</p>
              </div>
              <div className="h-[280px]">
                {chartData.length > 0 && <PerformanceBarChart data={chartData} labels={chartLabels} />}
              </div>
            </div>

            {/* Grade Review Queue */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 overflow-hidden">
              <div className="px-6 md:px-8 py-5 border-b border-brand-primary/8 flex justify-between items-center">
                <h4 className="font-black text-brand-primary tracking-tight text-lg">Grade Review Queue</h4>
                <button className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline transition-colors">
                  Batch Approve
                </button>
              </div>

              <div className="divide-y divide-brand-primary/6">
                {loading ? (
                  <div className="py-20 text-center">
                    <Loader2 size={28} className="animate-spin text-brand-primary/20 mx-auto" />
                    <p className="mt-3 text-token-micro font-bold text-brand-primary/30 uppercase tracking-widest">Loading grades…</p>
                  </div>
                ) : !data?.grades?.length ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <CheckCircle2 size={28} className="text-brand-success opacity-30" />
                    <p className="text-token-micro font-bold text-brand-primary/30 uppercase tracking-widest">No pending approvals</p>
                  </div>
                ) : (
                  data.grades.slice(0, 8).map((g: any) => (
                    <div key={g.id} className="flex items-center gap-4 px-6 md:px-8 py-4 group hover:bg-brand-blush/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 text-brand-secondary font-black text-sm grid place-items-center shrink-0 uppercase">
                        {(g.student.name || "?").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-brand-primary truncate leading-tight">{g.student.name}</p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest truncate">
                          {g.student.enrolledArm?.fullName || "—"}
                        </p>
                      </div>
                      <p className="hidden sm:block font-bold text-brand-primary/60 text-sm w-28 truncate shrink-0">{g.subject.name}</p>
                      <span className={cn(
                        "font-black py-1 px-3 rounded-full text-sm shrink-0",
                        g.total >= 70 ? "bg-brand-secondary/10 text-brand-secondary" : "bg-brand-primary/6 text-brand-primary/50"
                      )}>
                        {g.total}%
                      </span>
                      <ChevronRight size={16} className="text-brand-primary/20 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right 1/3 */}
          <div className="flex flex-col gap-8">

            {/* Gauge */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col items-center">
              <h4 className="font-black text-brand-primary self-start text-token-micro uppercase tracking-widest mb-6">Review Progress</h4>
              <div className="w-44 h-44">
                <RevenueGauge collected={reviewedCount} expected={gaugeTotal} />
              </div>
              <div className="mt-6 text-center">
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Grade Status</p>
                <p className="text-lg font-display font-black text-brand-success mt-1">Grade Optimal</p>
              </div>
            </div>

            {/* Anomalies */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-error shrink-0" size={20} />
                <h4 className="font-black text-brand-primary tracking-tight">Academic Anomalies</h4>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {anomalies.map((g: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 bg-brand-blush/50 p-3 rounded-xl border border-brand-primary/6"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-error shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-brand-primary truncate">{g.student.name}</p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest truncate">
                          {g.subject.name}: {g.total}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {anomalies.length === 0 && !loading && (
                  <div className="py-8 text-center flex flex-col items-center gap-3">
                    <CheckCircle2 size={24} className="text-brand-success opacity-25" />
                    <p className="text-xs font-bold text-brand-primary/40 italic">Registry is healthy.</p>
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
    <button className="w-full flex justify-between items-center p-4 bg-white border border-brand-primary/8 rounded-2xl hover:bg-brand-blush transition-colors group shadow-sm">
      <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">{label}</span>
      <ChevronRight size={14} className="text-brand-primary/30 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
