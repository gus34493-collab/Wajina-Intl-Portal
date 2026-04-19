"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  BarChart3, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  History,
  ShieldCheck,
  Search,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { RevenueGauge } from "@/app/components/Charts";

export default function BursarDashboard() {
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanceData() {
      try {
        const res = await fetch("/api/finance/stats");
        const json = await res.json();
        setFinance(json);
      } catch (err) {
        console.error("Finance fetch failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinanceData();
  }, []);

  const collectionRate = finance?.summary?.total > 0 
    ? ((finance.summary.paid / finance.summary.total) * 100).toFixed(1) 
    : "0";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight uppercase italic">Financial Registry</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Institutional liquidity, fee collections, and expense governance.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-black/5 rounded-2xl px-5 py-3 shadow-md">
            <ShieldCheck size={16} className="text-brand-success" />
            <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-[0.2em]">Audit Stable</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <KPICard 
             label="Term Collection" 
             value={finance ? `₦${(finance.summary.paid / 1000000).toFixed(1)}M` : "₦0.0M"} 
             sub="Verified Revenue" 
             icon={<CreditCard className="text-brand-moonstone" />} 
             color="moonstone" 
           />
           <KPICard 
             label="Outstanding Debt" 
             value={finance ? `₦${(finance.summary.outstanding / 1000000).toFixed(1)}M` : "₦0.0M"} 
             sub="Term Receivables" 
             icon={<Wallet className="text-brand-saffron" />} 
             color="saffron" 
           />
           <KPICard 
             label="Collection Rate" 
             value={`${collectionRate}%`} 
             sub="Institutional Yield" 
             icon={<TrendingUp className="text-brand-moonstone" />} 
             color="moonstone" 
             dark
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Ledger Health (Left 2/3) */}
           <div className="lg:col-span-2 flex flex-col gap-8">
             <div className="card">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest">Revenue Allocation Pulse</h3>
                   <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-brand-gunmetal transition-colors">
                         <Filter size={12} /> Filter
                      </button>
                      <button className="text-[10px] font-black text-brand-moonstone uppercase tracking-widest">Growth Analytics</button>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-brand-bg text-[9px] font-black uppercase text-text-muted tracking-[0.2em]">
                            <th className="px-8 py-4 rounded-l-xl">Account Domain</th>
                            <th className="px-8 py-4">Total Budget</th>
                            <th className="px-8 py-4">Realized</th>
                            <th className="px-8 py-4 rounded-r-xl">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                         <LedgerRow label="Tuition Fees" budget="₦42.0M" realized="₦38.2M" status="Optimal" />
                         <LedgerRow label="Logistics & Transport" budget="₦8.5M" realized="₦4.1M" status="Low" />
                         <LedgerRow label="Resource Materials" budget="₦4.2M" realized="₦2.5M" status="Optimal" />
                         <LedgerRow label="Examination Fees" budget="₦3.3M" realized="₦0.4M" status="Critical" />
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Recent Transactions */}
             <div className="card p-0 overflow-hidden shadow-premium border-none">
                <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white">
                   <h3 className="text-sm font-black text-brand-gunmetal uppercase tracking-widest flex items-center gap-2">
                     <History size={18} className="text-brand-moonstone" />
                     Recent Ledger Movements
                   </h3>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                      <input 
                        placeholder="Search transactions..."
                        className="bg-brand-bg border border-black/5 rounded-lg py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-moonstone/10"
                      />
                   </div>
                </div>
                <div className="divide-y divide-black/5">
                   <TransactionItem id="TX-9921" label="School Fee Payment" member="Ayobami T." amount="+ ₦240,000" date="2 mins ago" />
                   <TransactionItem id="TX-9920" label="Resource Requisition" member="Science Dept" amount="- ₦12,500" date="1 hour ago" isNegative />
                   <TransactionItem id="TX-9919" label="Admission Deposit" member="John Doe (App)" amount="+ ₦25,000" date="3 hours ago" />
                   <TransactionItem id="TX-9918" label="Staff Utility Bonus" member="Accounts" amount="- ₦45,000" date="Ides of March" isNegative />
                </div>
             </div>
           </div>

           {/* Fiscal Intelligence (Right 1/3) */}
           <div className="flex flex-col gap-8">
              
              {/* Collection Integrity Gauge */}
              <div className="card flex flex-col items-center justify-center p-8 bg-white border border-black/5 shadow-2xl">
                  <h4 className="font-black text-brand-gunmetal mb-6 self-start uppercase text-xs tracking-widest">Collection Yield</h4>
                  <div className="w-52 h-52">
                    <RevenueGauge collected={parseFloat(collectionRate)} expected={100} />
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sustainability Baseline</p>
                    <p className="text-lg font-display font-black text-brand-success mt-1 italic">Vibrant Liquidity</p>
                  </div>
              </div>

              {/* Action Center */}
              <div className="bg-brand-gunmetal rounded-2xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col gap-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-saffron italic underline decoration-brand-saffron/30">Governance Hub</h3>
                    <p className="text-[11px] font-medium text-white/50 leading-relaxed pr-8">Initialize term clearance protocols or update departmental expense limits.</p>
                    
                    <div className="mt-4 flex flex-col gap-3">
                       <button className="w-full bg-white text-brand-gunmetal py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                         Term Liquidation <ArrowUpRight size={14} className="text-brand-success" />
                       </button>
                       <button className="w-full bg-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all">
                         Export PDF Ledger
                       </button>
                    </div>
                 </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="flex flex-col gap-3">
                 <QuickLink label="Debt Collection Register" />
                 <QuickLink label="Expense Approval Queue" />
                 <QuickLink label="Salary Disbursement" />
              </div>

           </div>

        </div>
      </div>
    </DashboardShell>
  );
}

function LedgerRow({ label, budget, realized, status }: any) {
  const isOptimal = status === 'Optimal';
  return (
    <tr className="group hover:bg-brand-bg transition-colors">
       <td className="px-8 py-5">
          <p className="text-xs font-black text-brand-gunmetal group-hover:text-brand-moonstone transition-colors truncate max-w-[150px]">{label}</p>
       </td>
       <td className="px-8 py-5">
          <p className="text-xs font-bold text-text-muted">{budget}</p>
       </td>
       <td className="px-8 py-5">
          <p className="text-xs font-black text-brand-gunmetal">{realized}</p>
       </td>
       <td className="px-8 py-5">
          <span className={clsx(
            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
            isOptimal ? "bg-brand-success/10 text-brand-success" : status === 'Low' ? "bg-brand-saffron/10 text-brand-saffron" : "bg-brand-error/10 text-brand-error"
          )}>
            {status}
          </span>
       </td>
    </tr>
  );
}

function TransactionItem({ id, label, member, amount, date, isNegative = false }: any) {
  return (
     <div className="p-8 hover:bg-brand-bg transition-colors flex justify-between items-center group">
        <div className="flex items-center gap-6">
           <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform", isNegative ? "bg-brand-bg text-brand-error" : "bg-brand-moonstone/10 text-brand-moonstone")}>
              {isNegative ? <Wallet size={20} /> : <CreditCard size={20} />}
           </div>
           <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">{id}</p>
              <p className="text-xs font-black text-brand-gunmetal mt-0.5">{label}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase mt-0.5">{member}</p>
           </div>
        </div>
        <div className="text-right">
           <p className={clsx("text-sm font-black italic", isNegative ? "text-brand-error" : "text-brand-success")}>{amount}</p>
           <p className="text-[10px] font-bold text-text-muted mt-0.5">{date}</p>
        </div>
     </div>
  );
}

function QuickLink({ label }: any) {
   return (
     <button className="flex justify-between items-center p-4 bg-white border border-black/5 rounded-xl hover:bg-brand-bg transition-all group">
        <span className="text-[10px] font-black text-brand-gunmetal uppercase tracking-widest">{label}</span>
        <ChevronRight size={14} className="text-text-muted group-hover:text-brand-moonstone transition-colors" />
     </button>
   );
}

function KPICard({ label, value, sub, icon, color, dark = false }: any) {
  return (
    <div className={clsx(
      "card h-44 border-none flex flex-col justify-between p-8 group hover:-translate-y-1 transition-all shadow-premium",
      dark ? "bg-brand-gunmetal text-white" : "bg-white text-brand-gunmetal"
    )}>
       <div className="flex justify-between items-center">
          <h3 className={clsx("text-[11px] font-black uppercase tracking-widest", dark ? "text-white/40" : "text-text-muted")}>{label}</h3>
          <div className="p-3 bg-brand-bg rounded-xl">
             {icon}
          </div>
       </div>
       <div>
          <div className="text-4xl font-display font-black tracking-tighter italic mb-1 truncate">{value}</div>
          <p className={clsx("text-[10px] font-black uppercase tracking-widest", dark ? "text-brand-saffron" : "text-brand-success")}>{sub}</p>
       </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
