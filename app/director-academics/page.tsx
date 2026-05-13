
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  TrendingUp,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  Download,
  AlertCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

export default function DirectorAcademicsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAcademics() {
      try {
        const response = await fetch("/api/grades/pending-review?campus=ALL");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Director Academics Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAcademics();
  }, []);

  // Derive real KPIs from fetched grade data
  const allGrades = stats?.grades || [];
  const terminalAvg = allGrades.length > 0
    ? (allGrades.reduce((s: number, g: any) => s + (g.total || 0), 0) / allGrades.length).toFixed(1) + "%"
    : "—";
  const distinctionRate = allGrades.length > 0
    ? Math.round(allGrades.filter((g: any) => (g.total || 0) >= 70).length / allGrades.length * 100) + "%"
    : "—";
  const reviewedCount = stats ? Math.max(0, (stats.total || 0) - (stats.pendingCount || 0)) : 0;
  const gradeCoverage = stats?.total > 0 ? Math.round(reviewedCount / stats.total * 100) + "%" : "—";

  const radarData = {
    labels: ['STEM', 'Arts', 'Social Sciences', 'Languages', 'Vocational'],
    datasets: [
      {
        label: 'Primary Campus',
        data: [85, 72, 90, 88, 75],
        backgroundColor: 'rgba(106, 181, 71, 0.1)',
        borderColor: '#6AB547',
        borderWidth: 2,
      },
      {
        label: 'Secondary Campus',
        data: [78, 88, 75, 92, 82],
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderColor: '#000000',
        borderWidth: 1,
      }
    ]
  };

  const trendData = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
      {
        label: 'Average Performance (%)',
        data: [68, 72, 75, 74, 78],
        fill: true,
        borderColor: '#6AB547',
        backgroundColor: 'rgba(106, 181, 71, 0.05)',
        tension: 0.4,
      }
    ]
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Strategic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase">
              Academic <span className="text-brand-secondary">Governance</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-widest mt-1">
              Top-tier oversight of curriculum delivery, performance trends, and educational quality.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-brand-secondary/30 transition-all">
                <Download size={16} />
                Quality Audit Pack
             </button>
             <div className="bg-white border-2 border-brand-secondary text-brand-primary px-6 py-3.5 rounded-2xl font-black text-token-micro uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-secondary/10">
                <ShieldCheck size={16} className="text-brand-secondary" />
                Verified Standards
             </div>
          </div>
        </div>

        {/* Executive Academic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <AcademicKPI label="Terminal Average" value={loading ? "—" : terminalAvg} trend="Current Term" positive icon={<TrendingUp size={18}/>} highlight />
           <AcademicKPI label="Grade Coverage" value={loading ? "—" : gradeCoverage} trend="Reviewed / Total" positive icon={<BookOpen size={18}/>} />
           <AcademicKPI label="Teacher Appraisal" value="8.4/10" trend="Peer Reviewed" icon={<Award size={18}/>} />
           <AcademicKPI label="Distinction Rate" value={loading ? "—" : distinctionRate} trend="Score ≥ 70%" icon={<GraduationCap size={18}/>} highlight />
        </div>

        {/* Analytical Intelligence Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Subject Area Balance */}
           <div className="card bg-white flex flex-col gap-8 border border-brand-primary/8 shadow-xl">
              <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Subject Sector Balance</h4>
              <div className="h-[300px] w-full pt-4">
                 <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { font: { weight: 800, size: 9 } } } } } as any} />
              </div>
           </div>

           {/* Performance Trajectory */}
           <div className="lg:col-span-2 card bg-white flex flex-col gap-8 border border-brand-primary/8 shadow-xl">
              <div className="flex justify-between items-center">
                 <div>
                    <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Institutional Growth (Academic)</h4>
                    <p className="text-token-micro font-black text-brand-tertiary mt-1 uppercase tracking-widest">5-Year Comparative Baseline</p>
                 </div>
                 <div className="bg-brand-secondary/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-brand-secondary/20">
                    <Activity size={14} className="text-brand-secondary animate-pulse" />
                    <span className="text-token-micro font-black text-brand-secondary uppercase">Quality Verified</span>
                 </div>
              </div>
              <div className="h-[300px] w-full pt-4">
                 <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 60, grid: { display: false }, ticks: { font: { weight: 800 } } }, x: { grid: { display: false }, ticks: { font: { weight: 800 } } } } } as any} />
              </div>
           </div>
        </div>

        {/* Detailed Strategic Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="card bg-white border border-brand-primary/8 shadow-xl border-l-[6px] border-l-brand-secondary">
              <div className="flex justify-between items-center mb-8">
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Campus Performance Matrix</h4>
                 <button className="text-token-micro font-black text-brand-secondary uppercase flex items-center gap-1 hover:underline">Forensic Audit <ChevronRight size={12} /></button>
              </div>
              <div className="space-y-6">
                 <PerformanceRow label="Primary Campus" avg="82.4%" trend="+1.2%" status="EXCELLING" highlight />
                 <PerformanceRow label="Secondary Campus" avg="74.1%" trend="-0.5%" status="MONITORING" />
              </div>
           </div>

           <div className="card bg-white text-brand-primary overflow-hidden relative border border-brand-primary/8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                    <Layers size={18} className="text-brand-tertiary" />
                 </div>
                 <h4 className="font-black text-token-micro uppercase tracking-widest opacity-40">High-Risk Curriculum Gaps</h4>
              </div>
              <div className="space-y-4 relative z-10">
                 <div className="p-5 bg-black/[0.02] border border-brand-primary/8 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                       <p className="text-xs font-black uppercase tracking-tight">Further Mathematics</p>
                       <span className="px-2 py-0.5 bg-rose-600/10 text-rose-600 text-token-micro font-black uppercase tracking-widest">Critical Alert</span>
                    </div>
                    <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                       Teacher shortage in the Secondary wing is affecting Term 3 syllabic coverage.
                    </p>
                 </div>
                 <div className="p-5 bg-black/[0.02] border border-brand-primary/8 rounded-2xl border-l-2 border-l-brand-secondary">
                    <div className="flex justify-between items-center mb-3">
                       <p className="text-xs font-black uppercase tracking-tight">Digital Literacy K3</p>
                       <span className="px-2 py-0.5 bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">Infrastructure Lag</span>
                    </div>
                    <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed uppercase">
                       Lab 1 equipment depreciation is slowing down practical curriculum deployment.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Global Academic Intelligence Alert */}
        <div className="card border-dashed border-2 border-brand-secondary/20 bg-white p-8 flex items-start gap-6 shadow-xl">
           <AlertCircle size={24} className="text-brand-secondary shrink-0" />
           <div>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.2em] mb-2">Institutional Quality Directive</p>
              <p className="text-token-caption font-bold text-brand-primary/60 leading-relaxed uppercase tracking-tight font-sans">
                 All results for the 2025/26 First Term have been cryptographically sealed. Any variations post-audit will require a formal Board submission and Director-level auth key.
              </p>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function AcademicKPI({ label, value, trend, positive, icon, highlight }: any) {
   return (
      <div className={cn(
        "card bg-white flex items-center justify-between p-6 group hover:shadow-2xl transition-all border shadow-lg",
        highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
      )}>
         <div>
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-3">
               <span className="text-3xl font-display font-black text-brand-primary tracking-tighter tabular-nums">{value}</span>
               <span className={cn(
                 "text-token-micro font-black uppercase tracking-widest",
                 highlight ? "text-brand-secondary" : "text-brand-tertiary"
               )}>{trend}</span>
            </div>
         </div>
         <div className={cn(
           "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
           highlight ? "bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20" : "bg-black/5 text-brand-tertiary group-hover:bg-brand-secondary/5"
         )}>
            {icon}
         </div>
      </div>
   );
}

function PerformanceRow({ label, avg, trend, status, highlight }: any) {
   return (
      <div className="flex items-center justify-between p-5 bg-black/[0.02] rounded-[1.25rem] border border-brand-primary/8 group hover:bg-black/[0.04] transition-all cursor-default">
         <div className="flex items-center gap-5">
            <div className={cn(
              "w-1.5 h-12 rounded-full transition-all",
              highlight ? "bg-brand-secondary" : "bg-black/10 group-hover:bg-black/20"
            )} />
            <div>
               <p className="text-sm font-black text-brand-primary uppercase tracking-tight">{label}</p>
               <div className="flex gap-3 mt-1.5">
                  <span className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-brand-secondary" : "text-brand-tertiary")}>{status}</span>
                  <span className="text-token-micro font-bold text-brand-tertiary/60 uppercase tracking-widest whitespace-nowrap">Trajectory {trend}</span>
               </div>
            </div>
         </div>
         <div className="text-right">
            <p className="text-3xl font-display font-black text-brand-primary tracking-tighter tabular-nums">{avg}</p>
         </div>
      </div>
   );
}
