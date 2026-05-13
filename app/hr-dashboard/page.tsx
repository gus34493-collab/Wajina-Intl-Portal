"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { UsersRound, GraduationCap, MailOpen, ChevronRight, Bell } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function HRDashboard() {
  const { campus } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [auditFeed, setAuditFeed] = useState<any[]>([]);
  const [stats, setStats] = useState({ staffCount: "--", studentCount: "--", offerCount: "--" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, offersRes] = await Promise.all([
          fetch("/api/hr/dashboard-stats"),
          fetch("/api/admissions?status=OFFERED&limit=5"),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setStats({ staffCount: d.staffCount || "--", studentCount: d.studentCount || "--", offerCount: d.offerCount || "--" });
          setAuditFeed(d.recentActivity || []);
        }
        if (offersRes.ok) {
          const d = await offersRes.json();
          setOffers(d.admissions || []);
        }
      } catch (err) {
        console.error("HR Dashboard Sync Failure:", err);
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
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} HUMAN RESOURCES</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Staff <span className="text-brand-secondary">Lifecycle</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              HR
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <UsersRound size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Faculty Count</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.staffCount}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              {campus || "PRIMARY"} Staff
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Student Count</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.studentCount}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              {campus || "PRIMARY"} Campus
            </span>
          </div>

          <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <MailOpen size={20} className="text-white" />
              </div>
              <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Offers Active</p>
            </div>
            <p className="text-5xl font-display font-black text-white leading-none tracking-tighter">{stats.offerCount}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white/10 text-white text-token-micro font-black uppercase tracking-widest">
              Awaiting Review
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-brand-primary">Recent Admission Offers</h4>
              <button className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">Generate Report</button>
            </div>
            <div className="flex flex-col gap-3">
              {offers.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <MailOpen size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No offers yet.</p>
                </div>
              ) : (
                offers.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-secondary/10 grid place-items-center shrink-0 font-black text-brand-secondary text-xs uppercase">
                        {(o.applicantName || "A").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">{o.applicantName}</p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">{o.targetClass} · {o.campus}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <h4 className="font-black text-brand-primary mb-6">Recent Activity</h4>
            <div className="flex flex-col gap-3 flex-1">
              {auditFeed.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <UsersRound size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No activity logged yet.</p>
                </div>
              ) : (
                auditFeed.map((a, i) => (
                  <div key={i} className="p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5">
                    <p className="text-sm font-bold text-brand-primary">{a.action}</p>
                    <p className="text-token-micro font-bold text-brand-primary/40 mt-1">{a.staff} · {a.timestamp}</p>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-3.5 bg-brand-primary/5 rounded-2xl text-brand-primary/50 font-black text-xs hover:bg-brand-primary/10 transition-colors uppercase tracking-widest">
              View Full History
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
