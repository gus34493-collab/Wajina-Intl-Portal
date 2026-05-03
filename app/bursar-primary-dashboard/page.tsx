"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { Calendar, Hourglass, ChevronRight } from "lucide-react";

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

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight">Bursary <span className="text-brand-tertiary">Operations</span></h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">Strategic financial oversight and structural transaction monitoring for Primary Education.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-tertiary" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[20px] p-8 border-[1.5px] border-brand-primary/5 flex flex-col justify-center">
            <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-wider mb-2">Current Term Collection</p>
            <p className="text-[1.75rem] font-black text-brand-primary">{stats.termCollection}</p>
          </div>
          <div className="bg-white rounded-[20px] p-8 border-[1.5px] border-brand-primary/5 flex flex-col justify-center">
            <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-wider mb-2">Institutional Arrears</p>
            <p className="text-[1.75rem] font-black text-rose-600">{stats.overdueDebt}</p>
          </div>
          <div className="bg-white rounded-[20px] p-8 border-[1.5px] border-brand-primary/5 flex flex-col justify-center">
            <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-wider mb-2">Cycle Realization Rate</p>
            <p className="text-[1.75rem] font-black text-brand-tertiary">{stats.paymentRate}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Governance & Controls */}
          <div className="lg:col-span-2 bg-white rounded-[20px] p-10 border-[1.5px] border-brand-primary/5">
            <h3 className="font-black text-brand-primary mb-8">Governance & Controls</h3>

            <div className="bg-brand-blush rounded-xl p-6 mb-6 border border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-wider mb-4">Collection Protocol Status</p>
              <div className="flex justify-between items-center">
                <span className="text-token-micro font-black px-3 py-1 rounded bg-brand-secondary/10 text-brand-secondary">REGISTRATION OPEN</span>
                <button disabled className="text-token-micro font-black px-4 py-2 bg-brand-blush border border-brand-primary/8 rounded-lg opacity-50 cursor-not-allowed">DEACTIVATE CYCLE</button>
              </div>
            </div>

            <div className="bg-brand-blush rounded-xl p-6 border border-brand-primary/5">
              <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-wider mb-4">Financial Architecture</p>
              <button className="w-full bg-brand-primary text-white font-black text-token-micro py-4 rounded-xl uppercase tracking-widest hover:opacity-90 transition-all">
                Optimize Fee Schedules
              </button>
            </div>
          </div>

          {/* Petitioner Access Queue */}
          <div className="lg:col-span-3 card p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-brand-primary text-lg">Petitioner Access Queue</h3>
              <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-wider">Primary Campus</span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-16 text-brand-tertiary">
                <Hourglass size={48} className="mx-auto mb-6 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-wider">Zero Pending Parent Communications.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-brand-primary/5 hover:-translate-y-0.5 hover:border-brand-tertiary/30 transition-all cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{req.title || "Parent Request"}</p>
                      <p className="text-token-micro font-bold text-brand-tertiary">{req.sender?.name || "Guardian"}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-tertiary opacity-50" />
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

