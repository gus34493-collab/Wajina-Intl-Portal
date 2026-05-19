"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  TrendingUp,
  CheckCircle2,
  Search,
  ChevronRight,
  Users,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useAuth } from "@/app/components/AuthContext";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function FeeCompliancePage() {
  const { user, campus } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>(campus || "PRIMARY");

  useEffect(() => {
    if (user && user.role !== "DIRECTOR") {
      setSelectedCampus(user.campus || "PRIMARY");
    }
  }, [user?.campus, user?.role]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, listRes] = await Promise.all([
          fetch(`/api/finance/compliance-stats`),
          fetch(`/api/finance/student-compliance-list${searchQuery ? `?query=${searchQuery}` : ""}`)
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setSummary(data.summary);
        }
        if (listRes.ok) {
          const data = await listRes.json();
          setStudents(data.students);
        }
      } catch (err) {
        console.error("Compliance Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery]);

  const pieData = {
    labels: ['Full Payment', 'Part Payment', 'No Payment'],
    datasets: [
      {
        data: summary ? [summary.paid, summary.partPaid, summary.unpaid] : [0, 0, 0],
        backgroundColor: [
          '#8BC34A', // Lemon Green
          '#F4BF4F', // Saffron/Yellow
          '#EF4444', // Red
        ],
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter',
            weight: 800,
            size: 10
          }
        }
      },
      tooltip: {
        backgroundColor: '#16302B',
        titleFont: { weight: 800 },
        bodyFont: { weight: 600 },
        padding: 12,
        cornerRadius: 12
      }
    },
    cutout: '70%',
  };

  const campusName = campus === "PRIMARY" ? "Primary Campus" : campus === "SECONDARY" ? "Secondary Campus" : "Global Institution";
  const classRange = campus === "PRIMARY" ? "Creche — Primary 6" : "JSS 1 — SS 3";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campusName} Command</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase mb-2">
              Fee Compliance Registry
            </h1>
            <p className="text-brand-primary/60 text-xs font-bold uppercase tracking-wide opacity-60">
              Operational Oversight • {classRange}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const rows = students.map((s: any) =>
                  `${s.name},${s.className},${s.armName},${s.status}`
                ).join("\n");
                const csv = `Student Name,Class,Arm,Status\n${rows}`;
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `fee-compliance-${selectedCampus.toLowerCase()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 bg-white border border-brand-primary/10 text-brand-primary px-4 py-3 rounded-xl shadow-sm hover:bg-brand-blush transition-all font-black text-token-micro uppercase tracking-widest"
            >
              <Download size={14} />
              Export Ledger
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/10 hover:bg-brand-primary/95 transition-all font-black text-token-micro uppercase tracking-widest"
            >
              <FileText size={14} />
              Audit Report
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard 
             label="TOTAL STUDENTS"
             value={summary?.total || "0"}
             icon={<Users size={20} className="text-brand-primary" />}
             loading={loading}
          />
          <KPICard 
             label="PAID STUDENTS"
             value={summary?.paid || "0"}
             trend="Full Coverage"
             icon={<CheckCircle2 size={20} className="text-brand-secondary" />}
             loading={loading}
          />
          <KPICard 
             label="PART-PAID"
             value={summary?.partPaid || "0"}
             trend="Pending Balance"
             icon={<TrendingUp size={20} className="text-orange-500" />}
             loading={loading}
          />
          <KPICard 
             label="UNPAID STUDENTS"
             value={summary?.unpaid || "0"}
             trend="Action Required"
             icon={<AlertTriangle size={20} className="text-rose-600" />}
             variant="dark"
             loading={loading}
          />
        </div>

        {/* Analytics & List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Status Distribution Pie */}
          <div className="lg:col-span-2 card flex flex-col items-center justify-center gap-6 min-h-[450px]">
            <div className="w-full text-center">
              <h4 className="font-black text-brand-primary text-sm uppercase tracking-widest mb-1">Status Distribution</h4>
              <p className="text-token-micro font-bold text-brand-tertiary uppercase">Payment Volume Analysis</p>
            </div>
            <div className="flex-1 w-full max-h-[250px] relative">
              <Pie data={pieData} options={pieOptions} />
            </div>
            <div className="w-full pt-4 border-t border-brand-primary/8 grid grid-cols-3 gap-2">
               <div className="text-center">
                  <p className="text-token-micro font-black text-brand-secondary">{(summary?.paid / summary?.total * 100 || 0).toFixed(0)}%</p>
                  <p className="text-token-micro font-bold text-brand-tertiary uppercase">Paid</p>
               </div>
               <div className="text-center">
                  <p className="text-token-micro font-black text-orange-400">{(summary?.partPaid / summary?.total * 100 || 0).toFixed(0)}%</p>
                  <p className="text-token-micro font-bold text-brand-tertiary uppercase">Part</p>
               </div>
               <div className="text-center">
                  <p className="text-token-micro font-black text-rose-500">{(summary?.unpaid / summary?.total * 100 || 0).toFixed(0)}%</p>
                  <p className="text-token-micro font-bold text-brand-tertiary uppercase">Unpaid</p>
               </div>
            </div>
          </div>

          {/* Student Registry Table */}
          <div className="lg:col-span-4 card flex flex-col p-0 overflow-hidden min-h-[500px]">
             <div className="p-6 border-b border-brand-primary/8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h4 className="font-black text-brand-primary text-sm uppercase tracking-widest">Student Compliance Registry</h4>
                   <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-wider">Class, Arm, and Student Name mapping</p>
                </div>
                <div className="relative group min-w-[280px]">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary group-focus-within:text-brand-secondary transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Search students..." 
                      className="w-full bg-brand-blush/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-brand-primary placeholder:text-brand-tertiary focus:ring-1 focus:ring-brand-secondary transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>

             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-brand-primary/8">
                      <tr>
                         <th className="px-6 py-4 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Student Name</th>
                         <th className="px-6 py-4 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Class</th>
                         <th className="px-6 py-4 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Arm</th>
                         <th className="px-6 py-4 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Status</th>
                         <th className="px-6 py-4 text-center"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-black/[0.03]">
                      {loading ? (
                         Array(8).fill(0).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                               <td colSpan={5} className="px-6 py-5"><div className="h-4 bg-brand-blush rounded w-full"></div></td>
                            </tr>
                         ))
                      ) : students.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-brand-tertiary italic">No records found matching your query.</td>
                         </tr>
                      ) : (
                         students.map((s) => (
                            <tr key={s.id} className="hover:bg-brand-blush/30 transition-all cursor-pointer group">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center font-black text-token-micro text-brand-primary uppercase">
                                        {s.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                                     </div>
                                     <span className="text-sm font-bold text-brand-primary">{s.name}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-xs font-bold text-brand-primary/70">{s.className}</td>
                               <td className="px-6 py-4 text-xs font-bold text-brand-primary/70">{s.armName}</td>
                               <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest ${
                                     s.status === 'PAID' ? 'bg-brand-secondary/10 text-brand-secondary' :
                                     s.status === 'PART-PAID' ? 'bg-orange-500/10 text-orange-500' :
                                     'bg-rose-600/10 text-rose-600'
                                  }`}>
                                     {s.status}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-center">
                                  <ChevronRight size={14} className="text-brand-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-block" />
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KPICard({ label, value, trend, icon, variant = "light", loading }: any) {
  if (loading) return <div className="h-32 card animate-pulse" />;
  
  return (
    <div className={`card group hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 ${variant === 'dark' ? 'bg-brand-primary text-white border-none' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <p className={`text-token-micro font-black uppercase tracking-[0.2em] ${variant === 'dark' ? 'text-white/40' : 'text-brand-primary/40'}`}>{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'dark' ? 'bg-white/10' : 'bg-brand-blush group-hover:bg-brand-secondary/5'}`}>
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-display font-black tracking-tighter mb-1">{value}</h2>
        <p className={`text-token-micro font-black uppercase tracking-widest ${variant === 'dark' ? 'text-brand-secondary' : 'text-brand-primary/60'}`}>{trend || "Active Count"}</p>
      </div>
    </div>
  );
}

