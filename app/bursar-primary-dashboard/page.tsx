"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { CreditCard, AlertCircle, TrendingUp, Hourglass, ChevronRight, Bell } from "lucide-react";

export default function BursarPrimaryDashboard() {
  const [stats, setStats] = useState({ termCollection: "₦ --", overdueDebt: "₦ --", paymentRate: "0%" });
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, reqRes] = await Promise.all([
          fetch("/api/finance/dashboard-stats?campus=PRIMARY"),
          fetch("/api/requests?campus=PRIMARY&status=PENDING&limit=5"),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setStats({
            termCollection: d.totalCollected ? `₦ ${(d.totalCollected / 1e6).toFixed(1)}M` : "₦ --",
            overdueDebt: d.totalOverdue ? `₦ ${(d.totalOverdue / 1e6).toFixed(1)}M` : "₦ --",
            paymentRate: d.collectionRate ? `${d.collectionRate}%` : "0%",
          });
        }
        if (reqRes.ok) {
          const d = await reqRes.json();
          setRequests(d.requests || []);
        }
      } catch (err) {
        console.error("Bursar Primary fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">PRIMARY BURSARY</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Bursary <span className="text-brand-secondary">Operations</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              BP
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <CreditCard size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Term Collection</p>
            </div>
            <p className="text-4xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.termCollection}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              Current Term
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-error/8 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-brand-error" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Institutional Arrears</p>
            </div>
            <p className="text-4xl font-display font-black text-brand-error leading-none tracking-tighter">{stats.overdueDebt}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-error/10 text-brand-error text-token-micro font-black uppercase tracking-widest">
              Outstanding
            </span>
          </div>

          <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-white" />
              </div>
              <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Realization Rate</p>
            </div>
            <p className="text-4xl font-display font-black text-white leading-none tracking-tighter">{stats.paymentRate}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white/10 text-white text-token-micro font-black uppercase tracking-widest">
              Cycle Performance
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Governance & Controls */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8">
            <h3 className="font-black text-brand-primary mb-6">Governance & Controls</h3>

            <div className="bg-brand-blush/40 rounded-2xl p-5 mb-4 border border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-wider mb-4">Collection Protocol Status</p>
              <div className="flex justify-between items-center">
                <span className="text-token-micro font-black px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary">REGISTRATION OPEN</span>
                <button disabled className="text-token-micro font-black px-4 py-2 bg-brand-primary/5 border border-brand-primary/8 rounded-lg opacity-50 cursor-not-allowed">DEACTIVATE</button>
              </div>
            </div>

            <div className="bg-brand-blush/40 rounded-2xl p-5 border border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-wider mb-4">Financial Architecture</p>
              <button className="w-full bg-brand-primary text-white font-black text-token-micro py-3.5 rounded-xl uppercase tracking-widest hover:opacity-90 transition-all">
                Optimize Fee Schedules
              </button>
            </div>
          </div>

          {/* Petitioner Access Queue */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-brand-primary">Petitioner Access Queue</h3>
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Primary Campus</span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-brand-primary/30">
                <Hourglass size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">No pending parent communications.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{req.title || "Parent Request"}</p>
                      <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">{req.sender?.name || "Guardian"}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
