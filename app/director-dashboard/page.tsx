"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  Users,
  TrendingUp,
  Wallet,
  FileText,
  ChevronRight,
  AlertCircle,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { RevenueLineChart, PerformanceBarChart, RevenueGauge } from "@/app/components/Charts";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function DirectorDashboard() {
  const { user } = useAuth();
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const query = selectedCampus !== "ALL" ? `?campus=${selectedCampus}` : "";
        const [statsRes, revenueRes, requestsRes] = await Promise.all([
          fetch(`/api/finance/dashboard-stats${query}`),
          fetch(`/api/finance/revenue-stats${query}`),
          fetch(`/api/requests?status=PENDING&limit=5${selectedCampus !== "ALL" ? `&campus=${selectedCampus}` : ""}`)
        ]);

        setStats(await statsRes.json());
        setRevenue(await revenueRes.json());

        if (requestsRes.ok) {
          const reqData = await requestsRes.json();
          setRequests(reqData.requests || []);
        }
      } catch (err) {
        console.error("Director fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCampus]);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:gap-8">

        {/* Breadcrumb & Date */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.4em]">Strategic Oversight</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase leading-none">
              School <span className="text-brand-secondary">Overview</span>
            </h1>
          </div>

          {/* Campus Selector */}
          <div className="flex bg-white rounded-2xl p-1.5 border border-brand-primary/8 shadow-inner">
            {["ALL", "PRIMARY", "SECONDARY"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCampus(c)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all",
                  selectedCampus === c
                    ? "bg-white border-2 border-brand-secondary text-brand-primary shadow-sm"
                    : "text-brand-primary/50 hover:text-brand-primary"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white border border-brand-primary/8 rounded-2xl px-5 py-3.5 shadow-sm self-start">
            <Calendar size={18} className="text-brand-secondary" />
            <span className="text-xs font-black text-brand-primary tracking-widest uppercase">{currentDate}</span>
          </div>
        </div>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <KPICard
            icon={<Users className="text-brand-primary" />}
            label="Total Enrollment"
            value={stats?.totalStudents || "--"}
            accent={stats?.activeStudents + " Active Students"}
          />
          <KPICard
            icon={<TrendingUp className="text-brand-primary" />}
            label="Collection Rate"
            value={stats?.collectionRate ? `${stats.collectionRate}%` : "--"}
            accent="Term Rate"
            highlight
          />
          <KPICard
            icon={<Wallet className="text-brand-primary" />}
            label="Total Collected"
            value={stats?.totalCollected ? `₦ ${(stats.totalCollected / 1e6).toFixed(1)}M` : "--"}
            accent={stats?.sessionName || "Loading..."}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">

          {/* Revenue Analytics (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-5 md:gap-8">
            <div className="card bg-white h-[450px] flex flex-col border border-brand-primary/8 shadow-xl">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h4 className="text-xl font-black text-brand-primary uppercase tracking-tight">Revenue Over Time</h4>
                  <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em] mt-2">Tuition Collected (₦M)</p>
                </div>
                <div className="bg-brand-secondary/10 px-4 py-2 rounded-xl border border-brand-secondary/20">
                  <span className="text-token-micro font-black text-brand-secondary uppercase tracking-widest leading-none">6-Week View</span>
                </div>
              </div>
              <div className="flex-1">
                {revenue && <RevenueLineChart data={revenue.data} labels={revenue.labels} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              <div className="card bg-white flex flex-col items-center justify-center p-12 border border-brand-primary/8 shadow-xl">
                <h4 className="font-black text-brand-primary uppercase tracking-widest self-start mb-8 text-xs opacity-40">Collection Goal</h4>
                <div className="w-56 h-56">
                  {stats && <RevenueGauge collected={stats.totalCollected} expected={stats.totalExpected} />}
                </div>
                <div className="mt-10 text-center space-y-1">
                  <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Target Revenue</p>
                  <p className="text-2xl font-display font-black text-brand-primary">
                    ₦ {stats?.totalExpected ? (stats.totalExpected / 1e6).toFixed(1) : "--"}M
                  </p>
                </div>
              </div>

              <div className="card bg-white p-12 border border-brand-primary/8 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-black text-brand-primary uppercase tracking-widest text-xs opacity-40">Pipeline</h4>
                  <div className="bg-brand-secondary/10 px-3 py-1 rounded-full border border-brand-secondary/20">
                    <span className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Grades</span>
                  </div>
                </div>
                <div className="h-[250px]">
                  <PerformanceBarChart
                    data={[85, 62, 45]}
                    labels={["Sub", "Form", "Exec"]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-5 md:gap-8">

            {/* Urgent Decisions */}
            <div className="card bg-white text-brand-primary border border-brand-primary/8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center border border-brand-secondary/20">
                  <AlertCircle size={20} className="text-brand-secondary" />
                </div>
                <h4 className="text-base font-black uppercase tracking-tight">Pending Approvals</h4>
              </div>

              <div className="space-y-6 relative z-10">
                {requests.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-4 text-brand-primary/30">
                    <CheckCircle2 size={32} />
                    <p className="text-token-micro font-black uppercase tracking-[0.2em]">Nothing pending right now.</p>
                  </div>
                ) : (
                  requests.map((req, i) => (
                    <div key={i} className="flex items-center gap-5 group/item cursor-pointer">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 grid place-items-center text-brand-primary/40 group-hover/item:bg-brand-secondary/10 group-hover/item:border group-hover/item:border-brand-secondary/30 group-hover/item:text-brand-secondary transition-all duration-300">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-brand-primary group-hover/item:text-brand-secondary transition-colors truncate uppercase tracking-tight">{req.title}</p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest mt-1">{req.sender?.name || 'Staff'}</p>
                      </div>
                      <ChevronRight size={16} className="text-brand-primary/30 group-hover/item:translate-x-1 transition-transform" />
                    </div>
                  ))
                )}
              </div>

              <button className="w-full bg-white border-2 border-brand-secondary text-brand-primary font-black text-token-micro py-5 rounded-2xl uppercase tracking-[0.2em] hover:bg-brand-secondary hover:shadow-xl hover:-translate-y-0.5 transition-all mt-10 relative z-10">
                View All Requests
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <ActionButton label="Staff Audit" color="bg-white text-brand-primary border border-brand-primary/8" />
              <ActionButton label="Financials" color="bg-brand-secondary text-brand-primary" />
              <ActionButton label="Dispatch" color="bg-white text-brand-primary border border-brand-primary/8" />
              <ActionButton label="Operations" color="bg-white text-brand-primary border border-brand-primary/8" />
            </div>

            {/* System Status */}
            <div className="card bg-white p-8 border-dashed border-2 border-brand-primary/8">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-6">System Status</p>
              <div className="flex items-center justify-between text-token-caption font-black text-brand-primary uppercase tracking-widest mb-3">
                <span>System Health</span>
                <span className="text-brand-secondary">Optimal</span>
              </div>
              <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden shadow-inner font-black">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  className="bg-brand-secondary h-full rounded-full"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KPICard({ icon, label, value, accent, highlight }: { icon: React.ReactNode, label: string, value: any, accent: string, highlight?: boolean }) {
  return (
    <div className={cn(
      "card bg-white flex items-center gap-10 group hover:translate-y-[-4px] transition-all duration-300 border shadow-xl",
      highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
        highlight ? "bg-brand-secondary/10 text-brand-primary border border-brand-secondary/20" : "bg-black/5 text-brand-primary"
      )}>
        <div className="scale-125 transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className="text-3xl font-display font-black text-brand-primary my-1 tracking-tighter">{value}</p>
        <div className="flex items-center gap-2">
          <div className={cn("w-1 h-1 rounded-full", highlight ? "bg-brand-secondary" : "bg-black/20")} />
          <p className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-brand-secondary" : "text-brand-primary/40")}>{accent}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, color }: { label: string, color: string }) {
  return (
    <button className={cn(
      "p-5 rounded-2xl font-black text-token-micro uppercase tracking-[0.2em] shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all text-center",
      color
    )}>
      {label}
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

