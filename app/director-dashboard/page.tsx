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
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { RevenueLineChart, PerformanceBarChart, RevenueGauge } from "@/app/components/Charts";

export default function DirectorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, revenueRes, requestsRes] = await Promise.all([
          fetch("/api/finance/dashboard-stats"),
          fetch("/api/finance/revenue-stats"),
          fetch("/api/requests?status=PENDING&limit=5") // Placeholder until requests migrated
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
  }, []);

  const currentDate = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Breadcrumb & Date */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-gunmetal tracking-tight">Executive Command Center</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Real-time institutional oversight & financial forensics</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-black/5 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-moonstone" />
            <span className="text-xs font-black text-brand-gunmetal tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        {/* Top KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
            icon={<Users className="text-brand-moonstone" />} 
            label="Total Enrollment" 
            value={stats?.totalStudents || "--"} 
            accent={stats?.activeStudents + " Active"}
          />
          <KPICard 
            icon={<TrendingUp className="text-brand-saffron" />} 
            label="Collection Rate" 
            value={stats?.collectionRate ? `${stats.collectionRate}%` : "--"} 
            accent="Current Session"
          />
          <KPICard 
            icon={<Wallet className="text-brand-moonstone" />} 
            label="Gross Revenue" 
            value={stats?.totalCollected ? `₦ ${(stats.totalCollected / 1e6).toFixed(1)}M` : "--"} 
            accent={stats?.sessionName || "Loading..."}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Analytics (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="font-black text-brand-gunmetal">Weekly Revenue Velocity</h4>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Direct Tuition Inflow (Millions)</p>
                </div>
                <div className="flex gap-2 text-[10px] font-black uppercase text-brand-moonstone">
                  <span className="bg-brand-moonstone/10 px-2 py-1 rounded">6 Weeks</span>
                </div>
              </div>
              <div className="flex-1">
                {revenue && <RevenueLineChart data={revenue.data} labels={revenue.labels} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card flex flex-col items-center justify-center p-8">
                  <h4 className="font-black text-brand-gunmetal mb-6 self-start">Revenue Extraction Goal</h4>
                  <div className="w-48 h-48">
                    {stats && <RevenueGauge collected={stats.totalCollected} expected={stats.totalExpected} />}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-xs font-bold text-text-muted">Expected Yield</p>
                    <p className="text-lg font-display font-black text-brand-gunmetal">
                      ₦ {stats?.totalExpected ? (stats.totalExpected / 1e6).toFixed(1) : "--"}M
                    </p>
                  </div>
               </div>

               <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-brand-gunmetal">Academic Pipeline</h4>
                  <p className="text-[10px] font-black text-brand-moonstone">Grades Progress</p>
                </div>
                <div className="h-[220px]">
                  <PerformanceBarChart 
                    data={[85, 62, 45]} 
                    labels={["Submitted", "Form Appr.", "Final Appr."]} 
                  />
                </div>
               </div>
            </div>
          </div>

          {/* Action Center (Right 1/3) */}
          <div className="flex flex-col gap-6">
            
            {/* Urgent Decisions */}
            <div className="card glass-premium flex flex-col gap-6 border-l-4 border-l-brand-saffron">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-brand-saffron" />
                <h4 className="font-black text-brand-gunmetal">Urgent Decisions</h4>
              </div>
              
              <div className="space-y-5">
                {requests.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8 italic">No pending executive escalations.</p>
                ) : (
                  requests.map((req, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-brand-bg grid place-items-center text-text-secondary group-hover:text-brand-moonstone transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-brand-gunmetal truncate">{req.title}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{req.sender?.name || 'Staff'}</p>
                      </div>
                      <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))
                )}
              </div>

              <button className="w-full bg-brand-gunmetal text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest hover:opacity-90 transition-all mt-2">
                View Command Queue
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <ActionButton label="Staff Audit" color="bg-brand-moonstone" />
              <ActionButton label="Fee Lookup" color="bg-brand-saffron" />
              <ActionButton label="Announce" color="bg-brand-gunmetal" />
              <ActionButton label="Operations" color="bg-brand-moonstone" />
            </div>

            {/* System Status */}
            <div className="card bg-brand-bg border-dashed border-2 border-black/5 p-6">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Core Integrity</p>
              <div className="flex items-center justify-between text-xs font-bold text-brand-gunmetal">
                <span>Database Sync</span>
                <span className="text-brand-success">Optimal</span>
              </div>
              <div className="w-full bg-white h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-success w-[94%] h-full rounded-full" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KPICard({ icon, label, value, accent }: { icon: React.ReactNode, label: string, value: any, accent: string }) {
  return (
    <div className="card flex items-center gap-6 group hover:border-brand-moonstone/20">
      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center group-hover:bg-brand-moonstone/5 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-black text-brand-gunmetal my-0.5 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-brand-moonstone">{accent}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, color }: { label: string, color: string }) {
  return (
    <button className={clsx(
      "p-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest text-center shadow-sm press-effect",
      color
    )}>
      {label}
    </button>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
