"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { UsersRound, GraduationCap, MailOpen, ChevronRight, Calendar } from "lucide-react";
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

  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} HUMAN RESOURCES</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase mb-1">Staff Lifecycle</h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-primary/40" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><UsersRound size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">FACULTY COUNT</p>
              <p className="text-2xl font-display font-black text-brand-primary my-0.5">{stats.staffCount}</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest">{campus || "PRIMARY"} STAFF</p>
            </div>
          </div>
          <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><GraduationCap size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">STUDENT COUNT</p>
              <p className="text-2xl font-display font-black text-brand-primary my-0.5">{stats.studentCount}</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest">{campus || "PRIMARY"} CAMPUS</p>
            </div>
          </div>
          <div className="card flex items-center gap-8 bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10"><MailOpen size={24} className="text-brand-accent" /></div>
            <div className="relative z-10">
              <p className="text-token-micro font-black uppercase tracking-[0.3em] opacity-50 mb-1">OFFERS ACTIVE</p>
              <p className="text-2xl font-display font-black my-0.5 text-brand-accent">{stats.offerCount}</p>
              <p className="text-token-micro font-black text-white/40 uppercase tracking-widest">AWAITING REVIEW</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 card flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary text-lg">Recent Admission Offers</h4>
              <button className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50 bg-brand-blush px-3 py-2 rounded-lg hover:text-brand-primary transition-colors">Generate Report</button>
            </div>
            <div className="flex flex-col gap-4">
              {offers.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <MailOpen size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No offers yet.</p>
                </div>
              ) : (
                offers.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{o.applicantName}</p>
                      <p className="text-token-micro font-bold text-brand-primary/50">{o.targetClass} • {o.campus}</p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 card flex flex-col">
            <h4 className="font-black text-brand-primary mb-8 text-lg">Recent Activity</h4>
            <div className="flex flex-col gap-5">
              {auditFeed.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <UsersRound size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No activity logged yet.</p>
                </div>
              ) : (
                auditFeed.map((a, i) => (
                  <div key={i} className="p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5">
                    <p className="text-sm font-bold text-brand-primary">{a.action}</p>
                    <p className="text-token-micro font-bold text-brand-primary/50 mt-1">{a.staff} • {a.timestamp}</p>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-8 py-4 bg-brand-blush rounded-xl text-brand-primary/50 font-bold text-xs hover:bg-brand-blush/80 transition-colors">View Full History</button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

