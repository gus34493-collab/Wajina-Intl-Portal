
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  TrendingUp, 
  Users, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Download,
  Calendar,
  Layers
} from "lucide-react";
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RetentionAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRetention() {
      try {
        const response = await fetch("/api/analytics/retention");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error("Retention Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRetention();
  }, []);

  const lineData = {
    labels: data?.retentionData.labels || [],
    datasets: [
      {
        label: 'Enrollment Growth',
        data: data?.retentionData.enrollment || [],
        fill: true,
        borderColor: '#519CAB',
        backgroundColor: 'rgba(81, 156, 171, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#519CAB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Attrition (Student Exit)',
        data: data?.retentionData.attrition || [],
        borderColor: '#FFC64F',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: { font: { weight: 800, size: 10 }, padding: 20 }
      },
    },
    scales: {
      y: { grid: { display: false }, ticks: { font: { weight: 800 } } },
      x: { grid: { display: false }, ticks: { font: { weight: 800 } } }
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Strategic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight">
               Institutional Retention Intelligence
             </h1>
             <p className="text-brand-primary/60 text-sm font-medium mt-1">
               Multi-year longitudinal analysis of student growth and attrition dynamics.
             </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border border-brand-primary/8 text-brand-primary px-5 py-3 rounded-xl shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Download size={16} />
                Export Strategic Pack
             </button>
             <div className="bg-brand-primary text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} />
                Session 2025/26
             </div>
          </div>
        </div>

        {/* Dense Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <ExecutiveMetric 
              label="Total Enrollment" 
              value={data?.stats.totalStudents || "482"} 
              trend="+12 students" 
              icon={<Users size={20} className="text-brand-tertiary" />} 
           />
           <ExecutiveMetric 
              label="Average Retention" 
              value={data?.stats.avgRetention || "92.5%"} 
              trend="Institutional stability" 
              icon={<Target size={20} className="text-brand-forest" />} 
              variant="success"
           />
           <ExecutiveMetric 
              label="Growth Trajectory" 
              value={data?.retentionData.growth || "+12.4%"} 
              trend="YoY Projected" 
              icon={<TrendingUp size={20} className="text-brand-accent" />} 
           />
        </div>

        {/* Analytical Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Longitudinal Chart */}
           <div className="lg:col-span-2 card flex flex-col gap-8">
              <div className="flex justify-between items-center">
                 <div>
                    <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Growth vs. Attrition Dynamics</h4>
                    <p className="text-token-micro font-bold text-brand-tertiary mt-1 uppercase">5-Year Historical Baseline</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">
                       <div className="w-2 h-2 rounded-full bg-brand-tertiary" />
                       Net Growth
                    </span>
                    <span className="flex items-center gap-1.5 text-token-micro font-black text-brand-accent uppercase tracking-widest">
                       <div className="w-2 h-2 rounded-full bg-brand-accent" />
                       Exit Rate
                    </span>
                 </div>
              </div>
              <div className="h-[350px] w-full">
                 {loading ? <div className="w-full h-full bg-brand-blush rounded-2xl animate-pulse" /> : <Line data={lineData} options={chartOptions as any} />}
              </div>
           </div>

           {/* Campus & segment stability */}
           <div className="flex flex-col gap-6">
              <div className="card bg-brand-primary text-white flex flex-col gap-8">
                 <div className="flex items-center gap-3">
                    <Layers size={18} className="text-brand-tertiary" />
                    <h4 className="font-black text-token-micro uppercase tracking-widest">Campus Stability Matrix</h4>
                 </div>
                 <div className="space-y-8">
                    {data?.campusBreakdown.map((campus: any) => (
                      <div key={campus.name} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-md font-display font-black text-white">{campus.name}</p>
                               <p className="text-token-micro font-bold text-white/50 uppercase">{campus.count} Active Pupils</p>
                            </div>
                            <span className="text-xl font-display font-black text-brand-tertiary">{campus.retention}</span>
                         </div>
                         <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                               className="h-full bg-brand-tertiary rounded-full" 
                               style={{ width: campus.retention }} 
                            />
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="mt-4 pt-6 border-t border-white/10">
                    <button className="w-full py-3 bg-white/5 rounded-xl border border-white/10 text-token-micro font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                       Drill-down Analytics
                    </button>
                 </div>
              </div>

              <div className="card flex flex-col gap-4 border-l-4 border-l-brand-accent">
                 <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest">Strategic Alert</p>
                 <h4 className="text-xs font-black text-brand-primary">SS 1 Attrition Risk Detected</h4>
                 <p className="text-token-micro font-bold text-brand-primary/60 leading-relaxed">
                    Exit interviews suggest 15% of JSS 3 students are considering external secondary options. Strategic intervention recommended before Terminal 3.
                 </p>
                 <button className="flex items-center gap-2 text-token-micro font-black text-brand-tertiary uppercase tracking-widest hover:gap-3 transition-all">
                    Initiate Retention Protocol
                    <ChevronRight size={12} />
                 </button>
              </div>
           </div>
        </div>

        {/* Benchmarking Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <BenchCard 
              label="Parent Recommendation Rate" 
              value="8.4/10" 
              sub="Net Promoter Score" 
              icon={<ArrowUpRight size={18} className="text-brand-forest"/>} 
           />
           <BenchCard 
              label="Avg. Tenure per Family" 
              value="6.2 Years" 
              sub="Institutional Loyalty Index" 
              icon={<ArrowUpRight size={18} className="text-brand-forest"/>} 
           />
        </div>
      </div>
    </DashboardShell>
  );
}

function ExecutiveMetric({ label, value, trend, icon, variant = "default" }: any) {
  return (
    <div className="card group hover:border-brand-tertiary/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
        <div className="w-10 h-10 rounded-xl bg-brand-blush group-hover:bg-brand-tertiary/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-display font-black text-brand-primary tracking-tighter mb-1">{value}</h2>
        <p className={`text-token-micro font-black uppercase tracking-widest ${variant === 'success' ? 'text-brand-forest' : 'text-brand-tertiary'}`}>
           {trend}
        </p>
      </div>
    </div>
  );
}

function BenchCard({ label, value, sub, icon }: any) {
  return (
    <div className="card flex items-center justify-between py-6">
       <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-blush grid place-items-center">
             {icon}
          </div>
          <div>
             <h4 className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mb-0.5">{label}</h4>
             <p className="text-lg font-display font-black text-brand-primary">{value}</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-token-micro font-bold text-brand-tertiary uppercase">{sub}</p>
       </div>
    </div>
  );
}

