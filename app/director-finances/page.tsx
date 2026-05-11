
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  TrendingUp, DollarSign, AlertCircle, CheckCircle2,
  Download, ChevronRight, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceStats {
  paid: number;
  total: number;
  outstanding: number;
}

interface OverviewData {
  weeklyRevenue: { labels: string[]; data: number[] };
  collectionRate: number;
  sessionName: string | null;
  studentCount: number;
}

export default function DirectorFinancesPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [primary, setPrimary] = useState<FinanceStats | null>(null);
  const [secondary, setSecondary] = useState<FinanceStats | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState<"ALL" | "PRIMARY" | "SECONDARY">("ALL");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [statsRes, overviewRes, primaryRes, secondaryRes] = await Promise.all([
          fetch(`/api/finance/stats?campus=${campus}`),
          fetch(`/api/director/overview?campus=${campus}`),
          fetch("/api/finance/stats?campus=PRIMARY"),
          fetch("/api/finance/stats?campus=SECONDARY"),
        ]);
        if (statsRes.ok) setStats((await statsRes.json()).summary);
        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (primaryRes.ok) setPrimary((await primaryRes.json()).summary);
        if (secondaryRes.ok) setSecondary((await secondaryRes.json()).summary);
      } catch (err) {
        console.error("[director-finances]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [campus]);

  const fmt = (n: number) => `₦${(n / 1_000_000).toFixed(1)}M`;
  const rate = stats && stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
  const maxWeek = Math.max(...(overview?.weeklyRevenue.data ?? [1]));

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase">
              Financial <span className="text-brand-secondary">Intelligence</span>
            </h1>
            <p className="text-brand-primary/40 text-token-micro font-black uppercase tracking-widest mt-1">
              {overview?.sessionName ?? "Loading session…"} · Revenue & collection overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(["ALL", "PRIMARY", "SECONDARY"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCampus(c)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all",
                  campus === c
                    ? "bg-brand-primary text-white shadow-lg"
                    : "bg-white border border-brand-primary/10 text-brand-primary/60 hover:border-brand-primary/30"
                )}
              >
                {c}
              </button>
            ))}
            <button className="bg-white border border-brand-primary/10 text-brand-primary px-5 py-2.5 rounded-xl font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-brand-primary/30 transition-all">
              <Download size={14} />
              Export
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
            sub={`${overview?.studentCount ?? 0} active students`}
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
            sub="Confirmed payments / expected"
            icon={<CheckCircle2 size={16} />}
            highlight={rate >= 80}
          />
        </div>

        {/* Revenue Chart + Campus Liquidity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Weekly Revenue Trend */}
          <div className="lg:col-span-2 bg-white border border-brand-primary/8 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">6-Week Revenue Trend</h4>
              <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">₦ Millions</span>
            </div>

            {loading ? (
              <div className="h-48 rounded-2xl bg-brand-primary/5 animate-pulse" />
            ) : (
              <div className="flex items-end gap-3 h-48">
                {(overview?.weeklyRevenue.data ?? [0, 0, 0, 0, 0, 0]).map((val, i) => {
                  const height = maxWeek > 0 ? Math.max(4, Math.round((val / maxWeek) * 100)) : 4;
                  const isLatest = i === 5;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[0.6rem] font-black text-brand-primary/40 tabular-nums">
                        {val > 0 ? `₦${val.toFixed(1)}M` : "—"}
                      </span>
                      <div className="w-full flex flex-col justify-end" style={{ height: "160px" }}>
                        <div
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-700",
                            isLatest ? "bg-brand-primary" : "bg-brand-primary/15"
                          )}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[0.6rem] font-black text-brand-primary/40 uppercase">
                        {overview?.weeklyRevenue.labels[i] ?? `Wk ${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-primary/5">
              <div>
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">Collected</p>
                <p className="text-lg font-display font-black text-brand-primary">{loading ? "—" : fmt(stats?.paid ?? 0)}</p>
              </div>
              <div>
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">Target</p>
                <p className="text-lg font-display font-black text-brand-primary">{loading ? "—" : fmt(stats?.total ?? 0)}</p>
              </div>
              <div>
                <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">Rate</p>
                <p className={cn("text-lg font-display font-black", rate >= 80 ? "text-brand-success" : rate >= 50 ? "text-brand-accent" : "text-red-500")}>
                  {loading ? "—" : `${rate}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Campus Liquidity */}
          <div className="bg-white border border-brand-primary/8 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Campus Breakdown</h4>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-brand-primary/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Primary Campus", data: primary },
                  { label: "Secondary Campus", data: secondary },
                ].map(({ label, data }) => {
                  const campusRate = data && data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0;
                  return (
                    <div key={label} className="p-5 bg-brand-primary/[0.02] rounded-2xl border border-brand-primary/8">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-black text-brand-primary uppercase tracking-tight">{label}</p>
                        <span className={cn(
                          "text-token-micro font-black uppercase tracking-widest",
                          campusRate >= 80 ? "text-brand-success" : campusRate >= 50 ? "text-brand-accent" : "text-red-400"
                        )}>{campusRate}%</span>
                      </div>
                      <p className="text-2xl font-display font-black text-brand-primary">{data ? fmt(data.paid) : "—"}</p>
                      <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-1">
                        of {data ? fmt(data.total) : "—"} expected
                      </p>
                      {/* Mini bar */}
                      <div className="mt-3 h-1 bg-brand-primary/8 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full transition-all duration-700" style={{ width: `${campusRate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mb-2">Total Outstanding</p>
              <p className="text-2xl font-display font-black text-brand-primary">
                {loading ? "—" : fmt(stats?.outstanding ?? 0)}
              </p>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-1">
                {stats?.outstanding === 0 ? "All cleared" : "Pending across both campuses"}
              </p>
            </div>

            <button
              onClick={() => window.location.href = "/fee-compliance"}
              className="w-full py-3.5 bg-brand-primary text-white rounded-xl text-token-micro font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all"
            >
              Fee Compliance Detail <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Outstanding Breakdown */}
        {!loading && (stats?.outstanding ?? 0) > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-center gap-4">
            <AlertCircle size={20} className="text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black text-orange-700 uppercase tracking-wide">
                {fmt(stats!.outstanding)} outstanding — {100 - rate}% of expected revenue not yet collected
              </p>
              <p className="text-token-micro font-black text-orange-500/70 uppercase tracking-widest mt-0.5">
                Review per-student fee compliance to identify debtors
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/fee-compliance"}
              className="shrink-0 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-token-micro font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
            >
              View Compliance
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Fee Configuration", href: "/fee-configuration", icon: <DollarSign size={18} /> },
            { label: "Fee Compliance", href: "/fee-compliance", icon: <CheckCircle2 size={18} /> },
            { label: "Expense Approval", href: "/expense-approval", icon: <AlertCircle size={18} /> },
            { label: "Audit Logs", href: "/director-audit-logs", icon: <BarChart3 size={18} /> },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => window.location.href = a.href}
              className="bg-white border border-brand-primary/10 rounded-2xl p-5 flex items-center gap-3 hover:border-brand-primary/30 hover:shadow-sm transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-primary/5 grid place-items-center text-brand-primary">
                {a.icon}
              </div>
              <span className="text-xs font-black text-brand-primary uppercase tracking-tight">{a.label}</span>
            </button>
          ))}
        </div>

      </div>
    </DashboardShell>
  );
}

function KPI({ label, value, sub, icon, highlight, warn }: {
  label: string; value: string; sub: string; icon: React.ReactNode; highlight?: boolean; warn?: boolean;
}) {
  return (
    <div className={cn(
      "bg-white border rounded-3xl p-6 flex flex-col gap-4 shadow-sm",
      highlight ? "border-brand-primary/20" : warn ? "border-orange-200" : "border-brand-primary/8"
    )}>
      <div className="flex justify-between items-center">
        <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">{label}</p>
        <div className={cn(
          "w-8 h-8 rounded-lg grid place-items-center",
          highlight ? "bg-brand-primary text-white" : warn ? "bg-orange-100 text-orange-500" : "bg-brand-primary/5 text-brand-primary/50"
        )}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-display font-black text-brand-primary tracking-tighter">{value}</p>
        <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest mt-2">{sub}</p>
      </div>
    </div>
  );
}
