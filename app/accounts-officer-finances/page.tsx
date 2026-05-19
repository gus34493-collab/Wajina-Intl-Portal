"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceStats {
  paid: number;
  total: number;
  outstanding: number;
}

interface ComplianceSummary {
  paid: number;
  partPaid: number;
  unpaid: number;
  total: number;
}

interface Transaction {
  id: string;
  label: string;
  member: string;
  amount: string;
  date: string;
  isIncome: boolean;
}

export default function AccountsOfficerFinancesPage() {
  const { user, campus } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [statsRes, complianceRes, txRes] = await Promise.all([
          fetch("/api/finance/stats"),
          fetch("/api/finance/compliance-stats"),
          fetch("/api/finance/transactions?limit=10"),
        ]);
        if (statsRes.ok) setStats((await statsRes.json()).summary);
        if (complianceRes.ok) setCompliance((await complianceRes.json()).summary);
        if (txRes.ok) setTransactions((await txRes.json()).transactions ?? []);
      } catch (err) {
        console.error("[accounts-officer-finances]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const fmt = (n: number) => `₦${(n / 1_000_000).toFixed(2)}M`;
  const rate = stats && stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
  const campusLabel = campus === "PRIMARY" ? "Primary Campus" : campus === "SECONDARY" ? "Secondary Campus" : "Campus";

  const paidPct   = compliance && compliance.total > 0 ? Math.round((compliance.paid     / compliance.total) * 100) : 0;
  const partPct   = compliance && compliance.total > 0 ? Math.round((compliance.partPaid / compliance.total) * 100) : 0;
  const unpaidPct = compliance && compliance.total > 0 ? Math.round((compliance.unpaid   / compliance.total) * 100) : 0;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campusLabel}</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase">
              Campus <span className="text-brand-secondary">Finances</span>
            </h1>
            <p className="text-brand-primary/40 text-token-micro font-black uppercase tracking-widest mt-1">
              Revenue · Collections · Compliance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = "/fee-compliance"}
              className="flex items-center gap-2 bg-white border border-brand-primary/10 text-brand-primary px-5 py-3 rounded-xl font-black text-token-micro uppercase tracking-widest hover:bg-brand-blush transition-all"
            >
              Fee Compliance
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => window.location.href = "/expense-approval"}
              className="flex items-center gap-2 bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/10 font-black text-token-micro uppercase tracking-widest hover:bg-brand-primary/95 transition-all"
            >
              Expense Queue
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            label="Total Collected"
            value={loading ? "—" : fmt(stats?.paid ?? 0)}
            sub={`${rate}% collection rate`}
            icon={<TrendingUp size={16} />}
            highlight
          />
          <KPI
            label="Total Expected"
            value={loading ? "—" : fmt(stats?.total ?? 0)}
            sub="Current session"
            icon={<BarChart3 size={16} />}
          />
          <KPI
            label="Outstanding"
            value={loading ? "—" : fmt(stats?.outstanding ?? 0)}
            sub={stats?.outstanding === 0 ? "All fees cleared" : "Pending collection"}
            icon={<AlertCircle size={16} />}
            warn={(stats?.outstanding ?? 0) > 0}
          />
          <KPI
            label="Fee Compliance"
            value={loading ? "—" : `${rate}%`}
            sub="Confirmed / expected"
            icon={<CheckCircle2 size={16} />}
            highlight={rate >= 80}
          />
        </div>

        {/* Compliance Breakdown + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Compliance Breakdown */}
          <div className="bg-white border border-brand-primary/8 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Student Payment Status</h4>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-brand-primary/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ComplianceBar label="Full Payment" count={compliance?.paid ?? 0} pct={paidPct} color="bg-brand-secondary" textColor="text-brand-secondary" />
                <ComplianceBar label="Part Payment" count={compliance?.partPaid ?? 0} pct={partPct} color="bg-orange-400" textColor="text-orange-500" />
                <ComplianceBar label="No Payment"   count={compliance?.unpaid ?? 0} pct={unpaidPct} color="bg-rose-500" textColor="text-rose-500" />
              </div>
            )}

            <div className="pt-4 border-t border-brand-primary/5 flex justify-between items-center">
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">Total Students</p>
              <p className="text-2xl font-display font-black text-brand-primary">{compliance?.total ?? "—"}</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white border border-brand-primary/8 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-brand-primary/8 flex items-center justify-between">
              <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Recent Transactions</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                <span className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl bg-brand-primary/5 animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                  No transactions recorded yet
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-primary/8 bg-brand-blush/30">
                      <th className="px-6 py-3 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Student</th>
                      <th className="px-6 py-3 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Type</th>
                      <th className="px-6 py-3 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Date</th>
                      <th className="px-6 py-3 text-token-micro font-black text-brand-tertiary uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-brand-blush/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-brand-primary">{tx.member}</td>
                        <td className="px-6 py-4 text-xs font-black text-brand-tertiary uppercase tracking-wide">{tx.label}</td>
                        <td className="px-6 py-4 text-xs font-bold text-brand-primary/50">{tx.date}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "flex items-center justify-end gap-1 text-xs font-black",
                            tx.isIncome ? "text-brand-secondary" : "text-rose-500"
                          )}>
                            {tx.isIncome
                              ? <ArrowUpRight size={12} />
                              : <ArrowDownRight size={12} />}
                            {tx.amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KPI({ label, value, sub, icon, highlight = false, warn = false }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  highlight?: boolean; warn?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-3xl p-6 border flex flex-col gap-4 shadow-sm",
      highlight ? "bg-brand-primary border-transparent text-white" :
      warn      ? "bg-rose-50 border-rose-100" :
                  "bg-white border-brand-primary/8"
    )}>
      <div className="flex justify-between items-start">
        <p className={cn("text-token-micro font-black uppercase tracking-[0.2em]",
          highlight ? "text-white/50" : warn ? "text-rose-400" : "text-brand-primary/40"
        )}>{label}</p>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
          highlight ? "bg-white/10" : warn ? "bg-rose-100" : "bg-brand-blush"
        )}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("text-3xl font-display font-black tracking-tighter",
          highlight ? "text-white" : warn ? "text-rose-600" : "text-brand-primary"
        )}>{value}</p>
        <p className={cn("text-token-micro font-black uppercase tracking-widest mt-1",
          highlight ? "text-brand-secondary" : warn ? "text-rose-400" : "text-brand-primary/40"
        )}>{sub}</p>
      </div>
    </div>
  );
}

function ComplianceBar({ label, count, pct, color, textColor }: {
  label: string; count: number; pct: number; color: string; textColor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-brand-primary uppercase tracking-wide">{label}</span>
        <span className={cn("text-token-micro font-black", textColor)}>{pct}% · {count}</span>
      </div>
      <div className="h-2 bg-brand-primary/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
