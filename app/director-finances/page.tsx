
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap
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
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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
  ArcElement
);

export default function DirectorFinancesPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinances() {
      try {
        const response = await fetch("/api/finance/stats?campus=ALL");
        if (response.ok) {
          const data = await response.json();
          setStats(data.summary);
        }
      } catch (err) {
        console.error("Director Finance Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinances();
  }, []);

  const totalRevenue = stats?.paid || 45250000;
  const totalOpex = 12500000; // Mocked for strategic overview
  const netSurplus = totalRevenue - totalOpex;

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Net Collections (M)',
        data: [12, 19, 25, 22, 30, (totalRevenue / 1000000)],
        fill: true,
        borderColor: '#519CAB',
        backgroundColor: 'rgba(81, 156, 171, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const doughnutData = {
    labels: ['Tuition', 'Transport', 'Uniforms', 'Books'],
    datasets: [{
      data: [65, 15, 10, 10],
      backgroundColor: ['#064E3B', '#519CAB', '#FFC64F', '#20373B'],
      borderWidth: 0,
      hoverOffset: 20
    }]
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase">
              Financial <span className="text-[brand-secondary]">Intelligence</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-widest mt-1">
              Top-tier oversight of cashflow trajectories and operational expenditure.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-[brand-secondary]/30 transition-all">
                <Download size={16} />
                Strategic Report
             </button>
             <button className="bg-white border-2 border-[brand-secondary] text-brand-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-[brand-secondary]/10 font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:bg-[brand-secondary] transition-all">
                <Zap size={16} />
                Reconciliation
             </button>
          </div>
        </div>

        {/* Dense Financial KPI Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <FinanceKPI label="Net Revenue" value={`₦${(totalRevenue/1000000).toFixed(1)}M`} trend="+4.2% YoY" positive />
           <FinanceKPI label="Operational OPEX" value={`₦${(totalOpex/1000000).toFixed(1)}M`} trend="Within Budget" positive secondary />
           <FinanceKPI label="Net Surplus" value={`₦${(netSurplus/1000000).toFixed(1)}M`} trend="+12.5% vs Prev" positive secondary />
           <FinanceKPI label="Fee Compliance" value="84.2%" trend="Targeting 92%" icon={<PieChart size={16}/>} highlight />
        </div>

        {/* Strategic Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Revenue Trajectory */}
           <div className="lg:col-span-2 card bg-white flex flex-col gap-6 border border-brand-primary/8 shadow-xl">
              <div className="flex justify-between items-center">
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Revenue Growth Trajectory (H1 2026)</h4>
                 <div className="bg-[brand-secondary]/10 px-3 py-1 rounded-full flex items-center gap-2 border border-[brand-secondary]/20">
                    <div className="w-1.5 h-1.5 bg-[brand-secondary] rounded-full animate-pulse" />
                    <span className="text-token-micro font-black text-[brand-secondary] uppercase">Live Ledger Stream</span>
                 </div>
              </div>
              <div className="h-[300px] w-full pt-4">
                 <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { weight: 800 } } } } } as any} />
              </div>
           </div>

           {/* Collection Breakdown */}
           <div className="card bg-white flex flex-col gap-8 border border-brand-primary/8 shadow-xl">
              <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Revenue Composition</h4>
              <div className="h-[200px] w-full relative">
                 <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-token-micro font-black text-brand-tertiary uppercase">Primary</p>
                    <p className="text-2xl font-display font-black text-brand-primary leading-none">65%</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <RevenueSource label="Tuition & Fees" percentage={65} color="bg-[brand-secondary]" />
                 <RevenueSource label="Transportation" percentage={15} color="bg-black/10" />
                 <RevenueSource label="Books & Supplies" percentage={10} color="bg-black/5" />
              </div>
           </div>
        </div>

        {/* Executive Oversight Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="card bg-white text-brand-primary flex flex-col gap-6 relative overflow-hidden border border-brand-primary/8 shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[brand-secondary]">
                 <ShieldCheck size={120} />
              </div>
              <h4 className="text-token-micro font-black uppercase tracking-[0.2em] opacity-40">Strategic Outflow Monitor</h4>
              <div className="flex flex-col gap-6 relative z-10">
                 <div className="flex items-center justify-between p-5 bg-black/5 rounded-2xl border border-brand-primary/8 group cursor-pointer hover:bg-black/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-black/5 grid place-items-center text-brand-tertiary group-hover:bg-[brand-secondary]/10 group-hover:text-[brand-secondary] transition-all">
                          <DollarSign size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-brand-primary lowercase">Staff Salary Disbursment</p>
                          <p className="text-token-micro font-bold text-brand-tertiary uppercase mt-0.5">June Cycle • 142 Personnel</p>
                       </div>
                    </div>
                    <ArrowUpRight size={18} className="text-brand-tertiary/60 group-hover:text-[brand-secondary] transition-all" />
                 </div>
                 <div className="flex items-center justify-between p-5 bg-black/5 rounded-2xl border border-brand-primary/8 group cursor-pointer hover:bg-black/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-black/5 grid place-items-center text-brand-tertiary group-hover:bg-[brand-secondary]/10 group-hover:text-[brand-secondary] transition-all">
                          <Layers size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-brand-primary lowercase">OPEX: Facility Overhaul</p>
                          <p className="text-token-micro font-bold text-brand-tertiary uppercase mt-0.5">Primary Wing A • Maintenance</p>
                       </div>
                    </div>
                    <ArrowUpRight size={18} className="text-brand-tertiary/60 group-hover:text-[brand-secondary] transition-all" />
                 </div>
              </div>
        </div>

           <div className="card bg-white flex flex-col gap-6 border border-brand-primary/8 shadow-xl">
              <div className="flex justify-between items-center text-brand-primary">
                 <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Campus Liquidity Matrix</h4>
                 <button className="text-token-micro font-black text-[brand-secondary] uppercase tracking-widest flex items-center gap-1 hover:underline">
                    Detailed Analytics <ChevronRight size={12} />
                 </button>
              </div>
              <div className="space-y-6">
                 <LiquidityItem label="Primary Campus" liquidity="₦24.2M" status="HIGH" color="text-[brand-secondary]" />
                 <LiquidityItem label="Secondary Campus" liquidity="₦12.8M" status="STABLE" color="text-brand-tertiary" />
                 <LiquidityItem label="Strategic Reserves" liquidity="₦45.0M" status="SECURE" color="text-[brand-secondary]" />
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function FinanceKPI({ label, value, trend, positive, icon, highlight, secondary }: any) {
   return (
      <div className={cn(
          "card bg-white p-6 rounded-3xl flex flex-col gap-5 transition-all shadow-xl border",
          highlight ? "border-[brand-secondary]/30" : "border-brand-primary/8"
      )}>
         <div className="flex justify-between items-center">
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                highlight ? "bg-[brand-secondary]/10 text-[brand-secondary]" : secondary ? "bg-black/5 text-brand-tertiary/60" : "bg-black/5 text-brand-tertiary"
            )}>{icon || <TrendingUp size={16}/>}</div>
         </div>
         <div>
            <h2 className="text-3xl font-display font-black text-brand-primary tracking-tighter">{value}</h2>
            <div className="flex items-center gap-2 mt-2">
                <div className={cn("w-1 h-1 rounded-full", positive && highlight ? "bg-[brand-secondary]" : "bg-black/20")} />
                <p className={cn(
                    "text-token-micro font-black uppercase tracking-widest",
                    positive && highlight ? "text-[brand-secondary]" : "text-brand-tertiary"
                )}>
                   {trend}
                </p>
            </div>
         </div>
      </div>
   );
}

function RevenueSource({ label, percentage, color }: any) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between text-token-micro font-black text-brand-primary uppercase tracking-widest">
            <span className="opacity-40">{label}</span>
            <span>{percentage}%</span>
         </div>
         <div className="h-1 bg-black/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}

function LiquidityItem({ label, liquidity, status, color }: any) {
   return (
      <div className="flex items-center justify-between p-5 bg-black/[0.02] rounded-[1.25rem] border border-brand-primary/8 hover:bg-black/[0.04] transition-all cursor-default">
         <div>
            <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{label}</p>
            <p className={`text-token-micro font-black uppercase mt-1 tracking-widest ${color}`}>{status}</p>
         </div>
         <p className="text-2xl font-display font-black text-brand-primary tracking-tighter">{liquidity}</p>
      </div>
   );
}

