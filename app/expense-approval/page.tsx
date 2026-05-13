
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  Download,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExpenseApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch(`/api/requests?category=FINANCIAL&status=${activeTab}`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Expense Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [activeTab]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Financial Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase flex items-center gap-3">
              Expense <span className="text-brand-secondary">Verification</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-[0.3em] mt-1">
              Bursary-level audit and tactical approval of institutional financial outflows.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start">
             <button className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-3.5 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-brand-secondary/30 transition-all">
                <Download size={16} />
                Disbursement Ledger
             </button>
             <button className="bg-white border-2 border-brand-secondary text-brand-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-brand-secondary/10 font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:bg-brand-secondary transition-all">
                <FileText size={16} />
                New Requisition
             </button>
          </div>
        </div>

        {/* Global Finance Pulse */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <FinanceKPI label="Pending Approval" value="₦2.4M" sub="12 Requisitions" icon={<Clock size={18}/>} highlight />
           <FinanceKPI label="Monthly Outflow" value="₦12.8M" sub="OPEX Cluster" icon={<TrendingUp size={18}/>} />
           <FinanceKPI label="Institutional Cap" value="₦45.0M" sub="Q2 Budget" icon={<ShieldCheck size={18}/>} />
           <FinanceKPI label="Disbursed (Term)" value="₦34.2M" sub="Term 1 Final" icon={<CheckCircle2 size={18}/>} highlight />
        </div>

        {/* Audit & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-brand-primary/8 p-3 rounded-[1.5rem] shadow-xl">
          <div className="flex items-center gap-1">
            <FilterTab active={activeTab === "PENDING"} onClick={() => setActiveTab("PENDING")} label="Pending Audit" count={requests.filter(r => r.status === 'PENDING').length || 4} />
            <FilterTab active={activeTab === "APPROVED"} onClick={() => setActiveTab("APPROVED")} label="Approved Journal" />
            <FilterTab active={activeTab === "REJECTED"} onClick={() => setActiveTab("REJECTED")} label="Rejected Archive" />
          </div>
          <div className="relative md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tertiary/60" size={16} />
            <input 
              type="text" 
              placeholder="Search Requisition ID..." 
              className="w-full bg-black/[0.02] border border-brand-primary/8 rounded-xl pl-10 pr-4 py-3 text-token-micro font-black text-brand-primary focus:border-brand-secondary/30 outline-none uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Expense Audit List */}
        <div className="flex flex-col gap-6">
           {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-32 card animate-pulse bg-white border border-brand-primary/8 shadow-xl" />)
           ) : requests.length === 0 ? (
              <div className="h-96 card bg-white border-dashed border-2 border-brand-primary/8 flex flex-col items-center justify-center text-center shadow-xl">
                 <div className="w-24 h-24 rounded-full bg-brand-secondary/5 grid place-items-center mb-8 relative">
                    <div className="absolute inset-0 bg-brand-secondary/10 rounded-full animate-ping" />
                    <CheckCircle2 size={40} className="text-brand-secondary relative z-10" />
                 </div>
                 <h4 className="font-black text-brand-primary uppercase tracking-widest text-sm">Expense Journal Synchronized</h4>
                 <p className="text-token-micro text-brand-tertiary mt-2 max-w-xs leading-relaxed uppercase font-black">
                    There are no pending requisitions for this campus cluster. All outflows are currently verified.
                 </p>
              </div>
           ) : (
             requests.map((req) => (
                <ExpenseCard key={req.id} req={req} />
             ))
           )}
           
           {/* Mocking if API empty for demonstration of "Dense-Premium" */}
           {requests.length === 0 && !loading && (
             <div className="space-y-6">
               <MockExpenseCard title="Science Lab Reagents Overhaul" sector="Academic OPEX" amount="₦450,000" sender="HOD Science" date="2h ago" priority="HIGH" highlight />
               <MockExpenseCard title="Main Wing Roof Maintenance" sector="Facilities" amount="₦1,250,000" sender="Operations Lead" date="5h ago" priority="CRITICAL" />
               <MockExpenseCard title="Staff Professional Dev Seminar" sector="HR/Admin" amount="₦185,000" sender="HR Manager" date="1d ago" priority="LOW" />
             </div>
           )}
        </div>

        {/* Bursary Alert */}
        <div className="card bg-white border-dashed border-2 border-brand-secondary/20 p-8 flex items-start gap-6 shadow-xl">
           <AlertCircle size={24} className="text-brand-secondary shrink-0" />
           <div>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.2em] mb-2">Institutional Spending Policy</p>
              <p className="text-token-caption font-bold text-brand-primary/60 leading-relaxed uppercase tracking-tight font-sans">
                 Any expenditure exceeding ₦500,000 requires a secondary authorization key from the VP Admin or Principal. Transactions above ₦2.5M must be escalated to the Director.
              </p>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function FinanceKPI({ label, value, sub, icon, highlight }: any) {
  return (
    <div className={cn(
      "bg-white border rounded-[1.5rem] p-6 flex items-center justify-between shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all",
      highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
    )}>
      <div>
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-display font-black text-brand-primary mt-1 tabular-nums tracking-tighter">{value}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
           <div className={cn("w-1 h-1 rounded-full", highlight ? "bg-brand-secondary" : "bg-black/10")} />
           <p className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-brand-secondary" : "text-brand-tertiary")}>{sub}</p>
        </div>
      </div>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
        highlight ? "bg-brand-secondary/10 text-brand-secondary" : "bg-black/[0.03] text-brand-tertiary/60"
      )}>
        {icon}
      </div>
    </div>
  );
}

function FilterTab({ label, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-3.5 rounded-2xl text-token-micro font-black uppercase tracking-widest transition-all flex items-center gap-3",
        active ? "bg-black text-white shadow-xl" : "text-brand-tertiary hover:bg-black/[0.03]"
      )}
    >
      {label}
      {count !== undefined && <span className={cn(
        "px-2 py-0.5 rounded-lg text-token-micro leading-none",
        active ? "bg-white/10 text-white" : "bg-black/5 text-brand-tertiary"
      )}>{count}</span>}
    </button>
  );
}

function MockExpenseCard({ title, sector, amount, sender, date, priority, highlight }: any) {
  return (
    <div className={cn(
      "card bg-white group hover:translate-x-1 hover:shadow-2xl transition-all border-l-[6px] shadow-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8",
      highlight ? "border-l-brand-secondary" : "border-l-black/5"
    )}>
       <div className="flex gap-6 items-start flex-1">
          <div className="w-14 h-14 rounded-2xl bg-black/[0.03] border border-brand-primary/8 grid place-items-center text-brand-primary shrink-0 group-hover:bg-brand-secondary/10 group-hover:text-brand-secondary transition-all">
             <CreditCard size={24} />
          </div>
          <div>
             <div className="flex items-center gap-4 mb-2">
                <h4 className="font-black text-brand-primary uppercase tracking-tight text-sm">{title}</h4>
                <span className={cn(
                  "px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
                  priority === 'CRITICAL' ? "bg-rose-600/10 text-rose-600 border border-red-500/20" : highlight ? "bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20" : "bg-black/[0.05] text-brand-tertiary border border-brand-primary/8"
                )}>
                   {priority}
                </span>
             </div>
             <div className="flex flex-wrap gap-x-6 gap-y-2 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-brand-secondary" /> {sector}</span>
                <span>Verified by {sender}</span>
                <span className="tabular-nums opacity-60">{date}</span>
             </div>
          </div>
       </div>
       
       <div className="flex flex-col md:items-end gap-1.5 min-w-[140px]">
          <p className="text-3xl font-display font-black text-brand-primary tracking-tighter tabular-nums leading-none">{amount}</p>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
             <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.2em]">Authorized for Audit</p>
          </div>
       </div>

       <div className="flex items-center gap-3 md:border-l border-brand-primary/8 md:pl-8">
          <button className="w-12 h-12 rounded-2xl bg-rose-600/5 text-rose-600 border border-red-500/10 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">
             <XCircle size={20} />
          </button>
          <button className={cn(
            "h-12 px-8 rounded-2xl font-black text-token-micro uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg active:scale-95",
            highlight ? "bg-brand-secondary text-brand-primary shadow-brand-secondary/20" : "bg-black text-white"
          )}>
             <CheckCircle2 size={18} />
             Authorize
          </button>
       </div>
    </div>
  );
}

function ExpenseCard({ req }: any) {
   return (
      <MockExpenseCard 
         title={req.title} 
         sector={req.category || "General"} 
         amount={`₦${req.amount || 0}`} 
         sender={req.sender?.name || "Unknown"} 
         date={new Date(req.createdAt).toLocaleDateString()} 
         priority="NORMAL" 
      />
   );
}

function ShieldCheck({ size, className }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

