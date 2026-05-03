"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  CloudLightning,
  MessageCircleQuestion,
  ShieldAlert,
  FolderOpen,
  BadgeCheck,
  Shield,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function DeanDashboard() {
  const { campus } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalIncidents: "--", openComplaints: "--", atRisk: "--" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [incRes, compRes] = await Promise.all([
          fetch("/api/discipline/incidents?limit=5"),
          fetch("/api/discipline/complaints?status=OPEN&limit=5"),
        ]);
        if (incRes.ok) {
          const d = await incRes.json();
          setIncidents(d.incidents || []);
          setStats(prev => ({ ...prev, totalIncidents: d.total || "--" }));
        }
        if (compRes.ok) {
          const d = await compRes.json();
          setComplaints(d.complaints || []);
          setStats(prev => ({ ...prev, openComplaints: d.total || "--" }));
        }
      } catch (err) {
        console.error("Dean Dashboard Sync Failure:", err);
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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} OVERSIGHT</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase mb-1">Student Welfare</h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-primary/40" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KPICard icon={<CloudLightning size={24} className="text-brand-accent" />} label="ACTIVE INCIDENTS" value={stats.totalIncidents} accent={`${campus || "PRIMARY"} CAMPUS`} />
          <KPICard icon={<MessageCircleQuestion size={24} className="text-brand-accent" />} label="PENDING GRIEVANCES" value={stats.openComplaints} accent="Awaiting Resolution" />
          <KPICard icon={<ShieldAlert size={24} className="text-rose-600" />} label="CRITICAL RISK" value={stats.atRisk} accent="High Priority Wellness" accentColor="text-rose-600" />
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Behaviour & Discipline */}
          <div className="card flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary text-lg">Behaviour & Discipline</h4>
              <a href="/behaviour-discipline" className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50 hover:text-brand-primary transition-colors">See All</a>
            </div>
            <div className="flex flex-col gap-4">
              {incidents.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <CloudLightning size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No incidents logged this term.</p>
                </div>
              ) : (
                incidents.map((inc, i) => (
                  <FeedItem key={i} title={inc.title || "Incident"} subtitle={inc.student?.name || "Student"} icon={<CloudLightning size={16} className="text-brand-accent" />} bgColor="bg-brand-accent/10" />
                ))
              )}
            </div>
          </div>

          {/* Complaints & Grievances */}
          <div className="card flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary text-lg">Active Complaints</h4>
              <a href="/complaints" className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50 hover:text-brand-primary transition-colors">Manage All</a>
            </div>
            <div className="flex flex-col gap-4">
              {complaints.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <MessageCircleQuestion size={28} className="text-brand-primary opacity-10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No open complaints.</p>
                </div>
              ) : (
                complaints.map((c, i) => (
                  <FeedItem key={i} title={c.title || "Complaint"} subtitle={c.sender?.name || "Reporter"} icon={<MessageCircleQuestion size={16} className="text-brand-accent" />} bgColor="bg-brand-accent/10" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="card">
          <h4 className="font-black text-brand-primary mb-6">Personnel Oversight & Student Risk</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <QuickLink icon={<FolderOpen />} label="Student Catalog" sub="Wellness files" href="/pupil-records" color="text-brand-accent" bg="bg-brand-accent/10" />
            <QuickLink icon={<BadgeCheck />} label="Staff Relations" sub="Staff coordination" href="/staff-directory" color="text-brand-accent" bg="bg-brand-accent/10" />
            <QuickLink icon={<Shield />} label="Operational Risks" sub="Safety oversight" href="/operational-priorities" color="text-rose-600" bg="bg-rose-600/10" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function KPICard({ icon, label, value, accent, accentColor }: { icon: React.ReactNode; label: string; value: any; accent: string; accentColor?: string }) {
  return (
    <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">{icon}</div>
      <div>
        <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className="text-2xl font-display font-black text-brand-primary my-0.5 tracking-tighter">{value}</p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-brand-accent" />
          <p className={`text-token-micro font-black ${accentColor || "text-brand-accent"} uppercase tracking-widest leading-none`}>{accent}</p>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ title, subtitle, icon, bgColor }: { title: string; subtitle: string; icon: React.ReactNode; bgColor: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-9 h-9 rounded-xl ${bgColor} grid place-items-center shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-primary truncate">{title}</p>
          <p className="text-token-micro font-bold text-brand-primary/50 uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-brand-primary/30 group-hover:translate-x-1 transition-transform" />
    </div>
  );
}

function QuickLink({ icon, label, sub, href, color, bg }: { icon: React.ReactNode; label: string; sub: string; href: string; color: string; bg: string }) {
  return (
    <a href={href} className="flex items-center gap-4 p-5 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all group no-underline">
      <div className={`w-12 h-12 rounded-xl ${bg} ${color} grid place-items-center text-lg`}>{icon}</div>
      <div>
        <p className="font-bold text-brand-primary text-sm">{label}</p>
        <p className="text-xs text-brand-primary/50">{sub}</p>
      </div>
    </a>
  );
}

