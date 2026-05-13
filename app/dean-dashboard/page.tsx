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
  Bell,
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
          setStats(prev => ({
            ...prev,
            totalIncidents: d.total ?? "--",
            atRisk: d.studentsAtRisk ?? "--",
          }));
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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} OVERSIGHT</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Student <span className="text-brand-secondary">Welfare</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              DN
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <CloudLightning size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Active Incidents</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.totalIncidents}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              {campus || "PRIMARY"} Campus
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <MessageCircleQuestion size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Pending Grievances</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats.openComplaints}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              Awaiting Resolution
            </span>
          </div>

          <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Critical Risk</p>
            </div>
            <p className="text-5xl font-display font-black text-white leading-none tracking-tighter">{stats.atRisk}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white/10 text-white text-token-micro font-black uppercase tracking-widest">
              High Priority Wellness
            </span>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-brand-primary">Behaviour & Discipline</h4>
              <a href="/behaviour-discipline" className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">See All</a>
            </div>
            <div className="flex flex-col gap-3">
              {incidents.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <CloudLightning size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No incidents logged this term.</p>
                </div>
              ) : (
                incidents.map((inc, i) => (
                  <FeedItem key={i} title={inc.title || "Incident"} subtitle={inc.student?.name || "Student"} icon={<CloudLightning size={16} className="text-brand-primary" />} />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-brand-primary">Active Complaints</h4>
              <a href="/complaints" className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">Manage All</a>
            </div>
            <div className="flex flex-col gap-3">
              {complaints.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <MessageCircleQuestion size={28} className="text-brand-primary/10" />
                  <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">No open complaints.</p>
                </div>
              ) : (
                complaints.map((c, i) => (
                  <FeedItem key={i} title={c.title || "Complaint"} subtitle={c.sender?.name || "Reporter"} icon={<MessageCircleQuestion size={16} className="text-brand-primary" />} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8">
          <h4 className="font-black text-brand-primary mb-6">Personnel Oversight & Student Risk</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLink icon={<FolderOpen size={20} />} label="Student Catalog" sub="Wellness files" href="/pupil-records" />
            <QuickLink icon={<BadgeCheck size={20} />} label="Staff Relations" sub="Staff coordination" href="/staff-directory" />
            <QuickLink icon={<Shield size={20} />} label="Operational Risks" sub="Safety oversight" href="/operational-priorities" alert />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function FeedItem({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/8 grid place-items-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-primary truncate">{title}</p>
          <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-brand-primary/20 group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
}

function QuickLink({ icon, label, sub, href, alert }: { icon: React.ReactNode; label: string; sub: string; href: string; alert?: boolean }) {
  return (
    <a href={href} className={cn(
      "flex items-center gap-4 p-5 rounded-2xl border transition-all group no-underline",
      alert ? "bg-brand-error/5 border-brand-error/20 hover:border-brand-error/40" : "bg-brand-blush/40 border-brand-primary/5 hover:border-brand-secondary/20"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl grid place-items-center text-lg",
        alert ? "bg-brand-error/10 text-brand-error" : "bg-brand-primary/8 text-brand-primary"
      )}>{icon}</div>
      <div>
        <p className="font-bold text-brand-primary text-sm group-hover:text-brand-secondary transition-colors">{label}</p>
        <p className="text-xs text-brand-primary/40 mt-0.5">{sub}</p>
      </div>
    </a>
  );
}
