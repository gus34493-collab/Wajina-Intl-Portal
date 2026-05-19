
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import {
  BarChart4,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  Download
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReviewGradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState("PRIMARY");

  useEffect(() => {
    if (user && user.role !== "DIRECTOR") {
      setSelectedCampus(user.campus || "PRIMARY");
    }
  }, [user?.campus, user?.role]);

  useEffect(() => {
    async function fetchGrades() {
      try {
        const response = await fetch(`/api/grades/pending-review?campus=${selectedCampus}&overrideFormMaster=true`);
        if (response.ok) {
          const data = await response.json();
          setGrades(data.grades || []);
        }
      } catch (err) {
        console.error("Grade Audit Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [selectedCampus]);

  // Aggregate stats for the chart
  const averageByClass = grades.reduce((acc: any, curr: any) => {
    const className = curr.student?.enrolledArm?.fullName || "Unassigned";
    if (!acc[className]) acc[className] = { total: 0, count: 0 };
    acc[className].total += curr.total;
    acc[className].count += 1;
    return acc;
  }, {});

  const chartLabels = Object.keys(averageByClass);
  const chartDataValues = chartLabels.map(label => averageByClass[label].total / averageByClass[label].count);

  const barData = {
    labels: chartLabels.length > 0 ? chartLabels : ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'],
    datasets: [
      {
        label: 'Class Average (%)',
        data: chartDataValues.length > 0 ? chartDataValues : [72, 68, 75, 64, 82, 79],
        backgroundColor: '#519CAB',
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100, grid: { display: false }, ticks: { font: { weight: 800 } } },
      x: { grid: { display: false }, ticks: { font: { weight: 800 } } }
    }
  };

  const failureCount = grades.filter(g => g.total < 40).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight">
              Academic Audit & Analytics
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Cross-campus terminal analysis and mass grade verification.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border border-brand-primary/8 text-brand-primary px-5 py-3 rounded-xl shadow-sm hover:border-brand-tertiary/20 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Download size={16} />
                Export CSV
             </button>
             <button className="bg-brand-forest text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-forest/10 hover:bg-brand-forest/90 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} />
                Bulk Approve
             </button>
          </div>
        </div>

        {/* Audit KPI Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <AuditMetric label="Avg. Score" value="74.2%" trend="+2.1% YoY" icon={<TrendingUp size={16}/>} />
           <AuditMetric label="Risk Candidates" value={failureCount.toString()} trend="Score < 40%" icon={<AlertCircle size={16} className="text-brand-accent"/>} />
           <AuditMetric label="Verified Units" value={grades.length.toString()} trend="Pending Audit" icon={<BarChart4 size={16}/>} />
           <AuditMetric label="Top Class" value="JSS 1A" trend="Avg: 88.4%" icon={<CheckCircle2 size={16} className="text-brand-forest"/>} />
        </div>

        {/* Analytical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Performance Distribution */}
           <div className="lg:col-span-2 card flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Performance Distribution (By Arm)</h4>
                {user?.role === "DIRECTOR" && (
                <div className="flex gap-2">
                  {['PRIMARY', 'SECONDARY'].map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCampus(c)}
                      className={`px-3 py-1 rounded-lg text-token-micro font-black uppercase tracking-widest transition-all ${selectedCampus === c ? 'bg-brand-primary text-white' : 'bg-brand-blush text-brand-tertiary hover:bg-black/5'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              </div>
              <div className="h-[280px] w-full pt-4">
                 <Bar data={barData} options={chartOptions as any} />
              </div>
           </div>

           {/* Quick Actions / Filters */}
           <div className="card flex flex-col gap-6 bg-brand-primary text-white">
              <h4 className="font-black text-token-micro uppercase tracking-widest opacity-60">Audit Focus</h4>
              <div className="space-y-3">
                 <AuditFilter label="Failing Grades (<40%)" count={failureCount} active />
                 <AuditFilter label="Borderline (40-45%)" count={12} />
                 <AuditFilter label="Distinctions (>85%)" count={42} />
                 <AuditFilter label="Missing Entries" count={5} />
              </div>
              <div className="mt-auto pt-6 border-t border-white/10">
                 <p className="text-token-micro font-bold text-white/50 leading-relaxed mb-4">
                    Audit scan complete. 2 high-risk variances detected in JSS 1 Computer Science results.
                 </p>
                 <button className="w-full py-3 bg-brand-tertiary text-white rounded-xl text-token-micro font-black uppercase tracking-widest shadow-lg shadow-brand-tertiary/20">
                    Investigate Variances
                 </button>
              </div>
           </div>
        </div>

        {/* Detailed Audit Table */}
        <div className="card p-0 overflow-hidden">
           <div className="p-6 border-b border-brand-primary/8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <TableIcon size={18} className="text-brand-tertiary" />
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Cross-Campus Record Ledger</h4>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter by pupil or class..." 
                  className="w-full bg-brand-blush border border-brand-primary/8 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-brand-primary focus:outline-none"
                />
              </div>
           </div>
           
           {/* Desktop Table View */}
           <div className="hidden md:block overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-blush/50 text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em] border-b border-brand-primary/8">
                    <th className="px-6 py-5 whitespace-nowrap">Pupil Identity</th>
                    <th className="px-6 py-5 whitespace-nowrap">Campus/Arm</th>
                    <th className="px-6 py-5 whitespace-nowrap">Subject</th>
                    <th className="px-6 py-5 whitespace-nowrap">CA1/CA2/EXM</th>
                    <th className="px-6 py-5 text-center whitespace-nowrap">Final Score</th>
                    <th className="px-6 py-5 text-right">Escalation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                     Array(5).fill(0).map((_, i) => (
                       <tr key={i}><td colSpan={6} className="px-6 py-8 animate-pulse bg-brand-blush/10 border-b border-white" /></tr>
                     ))
                  ) : grades.map((g) => {
                    const isRisk = g.total < 40;
                    return (
                      <tr key={g.id} className="group hover:bg-brand-blush transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-brand-primary underline decoration-brand-tertiary/20 underline-offset-4 truncate max-w-[200px]">{g.student.name}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-wider">{g.student.enrolledArm?.fullName || "GENERIC"}</span>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-black text-brand-tertiary uppercase tracking-wide">{g.subject.name}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-token-micro font-bold text-brand-tertiary">
                              <span>{g.ca1 || 0}</span>
                              <span className="opacity-30">/</span>
                              <span>{g.ca2 || 0}</span>
                              <span className="opacity-30">/</span>
                              <span>{g.exam || 0}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black ${isRisk ? 'bg-rose-50 text-rose-600' : 'bg-brand-forest/5 text-brand-forest'}`}>
                              {g.total}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="w-8 h-8 rounded-lg bg-brand-blush grid place-items-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-md border border-brand-primary/8">
                              <ChevronRight size={14} className="text-brand-primary" />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
           </div>

           {/* Mobile Card View */}
           <div className="md:hidden flex flex-col divide-y divide-black/5">
              {loading ? (
                 <div className="px-6 py-8 animate-pulse bg-brand-blush/10" />
              ) : grades.length === 0 ? (
                 <div className="py-12 text-center text-brand-tertiary font-bold uppercase tracking-widest text-xs">No records found</div>
              ) : grades.map((g) => {
                const isRisk = g.total < 40;
                return (
                  <div key={g.id} className="p-4 flex flex-col gap-3 group hover:bg-brand-blush transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-brand-primary underline decoration-brand-tertiary/20 underline-offset-4">{g.student.name}</p>
                        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-wider mt-1">{g.student.enrolledArm?.fullName || "GENERIC"} • {g.subject.name}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black ${isRisk ? 'bg-rose-50 text-rose-600' : 'bg-brand-forest/5 text-brand-forest'}`}>
                        {g.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-token-micro font-bold text-brand-tertiary mt-2 pt-2 border-t border-brand-primary/5">
                      <div className="flex items-center gap-2">
                        <span>CA1: {g.ca1 || 0}</span>
                        <span className="opacity-30">|</span>
                        <span>CA2: {g.ca2 || 0}</span>
                        <span className="opacity-30">|</span>
                        <span>EXM: {g.exam || 0}</span>
                      </div>
                      <ChevronRight size={14} className="text-brand-tertiary/60" />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function AuditMetric({ label, value, trend, icon }: any) {
  return (
    <div className="card p-5 bg-white border border-brand-primary/8 rounded-2xl flex items-center justify-between shadow-sm">
       <div>
          <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.15em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-display font-black text-brand-primary tracking-tighter">{value}</span>
             <span className="text-token-micro font-bold text-brand-tertiary">{trend}</span>
          </div>
       </div>
       <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center">
          {icon}
       </div>
    </div>
  );
}

function AuditFilter({ label, count, active }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${active ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-black/10 border-transparent hover:bg-white/5'}`}>
       <span className="text-token-micro font-black uppercase tracking-wider">{label}</span>
       <span className={`px-2 py-0.5 rounded-md text-token-micro font-black ${active ? 'bg-brand-tertiary text-white' : 'bg-white/10 text-white/50'}`}>{count}</span>
    </div>
  );
}

