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
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function BursarDashboard() {
  const { user, campus } = useAuth();
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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} CAMPUS</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase italic">Financial Registry</h1>
            <p className="text-brand-primary/50 text-sm font-medium mt-1">Fee collections, outstanding balances, and expense management.</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-brand-primary/8 rounded-2xl px-5 py-3 shadow-md">
            <ShieldCheck size={16} className="text-brand-success" />
            <span className="text-token-micro font-black text-brand-primary uppercase tracking-[0.2em]">Books Balanced</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <KPICard
             label="Term Collection"
             value={finance ? `₦${(finance.summary.paid / 1000000).toFixed(1)}M` : "₦0.0M"}
             sub="Collected This Term"
             icon={<CreditCard className="text-brand-primary" />}
             trend="+8% from last term"
             trendUp
           />
           <KPICard
             label="Outstanding Debt"
             value={finance ? `₦${(finance.summary.outstanding / 1000000).toFixed(1)}M` : "₦0.0M"}
             sub="Still Outstanding"
             icon={<Wallet className="text-brand-accent" />}
             trend="-14% from last term"
             trendUp={false}
           />
           <KPICard
             label="Collection Rate"
             value={`${collectionRate}%`}
             sub={`${campus || "PRIMARY"} Rate`}
             icon={<TrendingUp className="text-brand-primary" />}
             trend="+3pts this term"
             trendUp
             dark
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Ledger Health (Left 2/3) */}
           <div className="lg:col-span-2 flex flex-col gap-8">
             <div className="card">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Fee Collection Summary</h3>
                   <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-token-micro font-black text-brand-primary/50 hover:text-brand-primary transition-colors">
                         <Filter size={12} /> Filter
                      </button>
                      <button className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest hover:text-brand-primary transition-colors">View Full Report</button>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-brand-blush text-token-micro font-black uppercase text-brand-primary/40 tracking-[0.2em]">
                            <th className="px-8 py-4 rounded-l-xl">Category</th>
                            <th className="px-8 py-4">Total Budget</th>
                            <th className="px-8 py-4">Collected</th>
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
                <div className="p-8 border-b border-brand-primary/8 flex justify-between items-center bg-white">
                   <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                     <History size={18} className="text-brand-accent" />
                     Recent Transactions
                   </h3>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40" size={14} />
                      <input
                        placeholder="Search transactions..."
                        className="bg-brand-blush border border-brand-primary/8 rounded-lg py-2 pl-9 pr-4 text-token-micro font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-accent/10"
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
              <div className="card flex flex-col items-center justify-center p-8 bg-white border border-brand-primary/8 shadow-2xl">
                  <h4 className="font-black text-brand-primary mb-6 self-start uppercase text-xs tracking-widest">Collection Rate</h4>
                  <div className="w-52 h-52">
                    <RevenueGauge collected={parseFloat(collectionRate)} expected={100} />
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Payment Status</p>
                    <p className="text-lg font-display font-black text-brand-success mt-1 italic">On Track</p>
                  </div>
              </div>

              {/* Action Center */}
              <div className="bg-brand-primary rounded-2xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col gap-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-accent">Quick Actions</h3>
                    <p className="text-token-caption font-medium text-white/50 leading-relaxed pr-8">Manage term payments and update department budgets.</p>

                    <div className="mt-4 flex flex-col gap-3">
                       <button className="w-full bg-white text-brand-primary py-3 rounded-xl font-black text-token-micro uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                         Run Term Clearance <ArrowUpRight size={14} className="text-brand-success" />
                       </button>
                       <button className="w-full bg-white/10 text-white py-3 rounded-xl font-black text-token-micro uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-all">
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
    <tr className="group hover:bg-brand-blush transition-colors">
       <td className="px-8 py-5">
          <p className="text-xs font-black text-brand-primary group-hover:text-brand-secondary transition-colors truncate max-w-[150px]">{label}</p>
       </td>
       <td className="px-8 py-5">
          <p className="text-xs font-bold text-brand-primary/60">{budget}</p>
       </td>
       <td className="px-8 py-5">
          <p className="text-xs font-black text-brand-primary">{realized}</p>
       </td>
       <td className="px-8 py-5">
          <span className={clsx(
            "text-token-micro font-black uppercase px-2 py-0.5 rounded-md",
            isOptimal ? "bg-brand-success/10 text-brand-success" : status === 'Low' ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-error/10 text-brand-error"
          )}>
            {status}
          </span>
       </td>
    </tr>
  );
}

function TransactionItem({ id, label, member, amount, date, isNegative = false }: any) {
  return (
     <div className="p-8 hover:bg-brand-blush transition-colors flex justify-between items-center group">
        <div className="flex items-center gap-6">
           <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-brand-primary/8 group-hover:scale-110 transition-transform", isNegative ? "bg-brand-blush text-brand-error" : "bg-brand-secondary/10 text-brand-secondary")}>
              {isNegative ? <Wallet size={20} /> : <CreditCard size={20} />}
           </div>
           <div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">{id}</p>
              <p className="text-xs font-black text-brand-primary mt-0.5">{label}</p>
              <p className="text-token-micro font-bold text-brand-primary/50 uppercase mt-0.5">{member}</p>
           </div>
        </div>
        <div className="text-right">
           <p className={clsx("text-sm font-black italic", isNegative ? "text-brand-error" : "text-brand-success")}>{amount}</p>
           <p className="text-token-micro font-bold text-brand-primary/40 mt-0.5">{date}</p>
        </div>
     </div>
  );
}

function QuickLink({ label }: any) {
   return (
     <button className="flex justify-between items-center p-4 bg-white border border-brand-primary/8 rounded-xl hover:bg-brand-blush transition-all group">
        <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">{label}</span>
        <ChevronRight size={14} className="text-brand-primary/30 group-hover:text-brand-primary transition-colors" />
     </button>
   );
}

function KPICard({ label, value, sub, icon, dark = false, trend, trendUp }: any) {
  return (
    <div className={cn(
      "card h-52 border-none flex flex-col justify-between p-10 group hover:-translate-y-1 transition-all duration-500",
      dark ? "bg-brand-primary text-white shadow-2xl" : "bg-white text-brand-primary shadow-xl"
    )}>
       <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={cn("text-token-micro font-black uppercase tracking-[0.3em]", dark ? "text-white/40" : "text-brand-primary/40")}>{label}</h3>
            <p className={cn("text-token-micro font-black uppercase tracking-widest", dark ? "text-brand-accent" : "text-brand-accent")}>{sub}</p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-brand-accent transition-colors">
             {icon}
          </div>
       </div>
       <div className="flex flex-col gap-2">
          <div className="text-4xl font-display font-black tracking-tighter uppercase leading-none truncate">{value}</div>
          {trend && (
            <p className={cn("text-token-micro font-black uppercase tracking-widest", trendUp ? "text-brand-secondary" : "text-brand-error")}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
       </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

