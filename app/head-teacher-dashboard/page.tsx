"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  GraduationCap,
  UserCheck,
  FileSignature,
  ChevronRight,
  UserPlus,
  Calendar,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

export default function HeadTeacherDashboard() {
  const { campus } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ pupils: "--", staff: "--", yield: "--%" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const query = campus ? `campus=${campus}` : "campus=PRIMARY";
        const [subsRes, admRes, complianceRes, hrRes] = await Promise.all([
          fetch(`/api/requests?${query}&limit=5&category=LESSON_PLAN`),
          fetch(`/api/admissions?status=OFFERED&${query}`),
          fetch(`/api/finance/compliance-stats`),
          fetch(`/api/hr`)
        ]);

        if (subsRes.ok) {
          const d = await subsRes.json();
          setSubmissions(d.requests || []);
        }
        if (admRes.ok) {
          const d = await admRes.json();
          setAdmissions(d.admissions || []);
        }
        if (complianceRes.ok) {
          const d = await complianceRes.json();
          const rate = d.summary.total > 0 ? Math.round((d.summary.paid / d.summary.total) * 100) : 0;
          setStats(prev => ({
            ...prev,
            pupils: d.summary.total.toString(),
            yield: `${rate}%`
          }));
        }
        if (hrRes.ok) {
          const d = await hrRes.json();
          setStats(prev => ({ ...prev, staff: d.summary.activeStaff.toString() }));
        }
      } catch (err) {
        console.error("Head Teacher Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campus]);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const avatarColors = [
    "bg-brand-secondary/10 text-brand-secondary",
    "bg-brand-accent/10 text-brand-accent",
    "bg-brand-primary/10 text-brand-primary",
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} COMMAND</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Academic <span className="text-brand-secondary">Core</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-2.5 shadow-sm hidden md:flex">
              <Calendar size={14} className="text-brand-tertiary" />
              <span className="text-token-micro font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-black text-white text-sm select-none">
              HT
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            icon={<GraduationCap size={20} />}
            iconBg="bg-brand-secondary/10 text-brand-secondary"
            label="Active Pupils"
            value={stats.pupils}
            pill={`${campus || "PRIMARY"} campus`}
          />
          <KPICard
            icon={<UserCheck size={20} />}
            iconBg="bg-brand-accent/10 text-brand-accent"
            label="Active Staff"
            value={stats.staff}
            pill="Faculty verified"
          />
          <KPICard
            icon={<FileSignature size={20} />}
            iconBg="bg-white/20 text-white"
            label="Compliance"
            value={stats.yield}
            pill="Campus yield"
            inverted
          />
        </div>

        {/* Intelligence Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-8">

          {/* Teacher Submissions (Left 3/5) */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h4 className="font-black text-brand-primary">Teacher Submissions</h4>
                {submissions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black">
                    {submissions.length}
                  </span>
                )}
              </div>
              <a
                href="/teacher-submissions-review"
                className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary hover:text-brand-secondary transition-colors no-underline"
              >
                Review All →
              </a>
            </div>

            <div className="flex flex-col gap-3">
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2 size={28} className="text-brand-primary/10" />
                  <p className="text-xs text-brand-tertiary text-center italic">
                    Listening for teacher movements…
                  </p>
                </div>
              ) : (
                submissions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl grid place-items-center shrink-0 font-black text-xs uppercase",
                        avatarColors[i % avatarColors.length]
                      )}>
                        {(s.sender?.name || "S").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">
                          {s.sender?.name || "Staff"}
                        </p>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">
                          {s.category || "Academic"} Submission
                        </p>
                      </div>
                    </div>
                    <button className="bg-white border border-brand-primary/8 px-3 py-1.5 rounded-lg text-token-micro font-black text-brand-primary/50 uppercase tracking-wider hover:border-brand-secondary/30 hover:text-brand-secondary transition-all shrink-0">
                      Verify
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Finance-Verified Admissions (Right 2/5) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-brand-primary/8 p-6 md:p-8 flex flex-col">
            <h4 className="font-black text-brand-primary mb-6">
              Finance-Verified Admissions
            </h4>
            <div className="flex flex-col gap-3">
              {admissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2 size={28} className="text-brand-primary/10" />
                  <p className="text-xs text-brand-tertiary text-center italic">
                    No new candidates today.
                  </p>
                </div>
              ) : (
                admissions.map((o: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 cursor-pointer hover:border-brand-accent/20 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 grid place-items-center shrink-0">
                        <UserPlus size={16} className="text-brand-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">
                          {o.applicantName}
                        </p>
                        <p className="text-token-micro font-bold text-brand-primary/40">
                          Score: {o.entranceScore}% · {o.targetClass}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-brand-primary/20 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  pill: string;
  inverted?: boolean;
}

function KPICard({ icon, iconBg, label, value, pill, inverted = false }: KPICardProps) {
  return (
    <div className={cn(
      "rounded-3xl shadow-sm p-6 md:p-8 flex flex-col gap-4 border",
      inverted
        ? "bg-brand-secondary text-white border-transparent shadow-xl shadow-brand-secondary/20"
        : "bg-white text-brand-primary border-brand-primary/8 hover:-translate-y-1 transition-all duration-300"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <p className={cn(
          "text-token-micro font-black uppercase tracking-widest",
          inverted ? "text-white/60" : "text-brand-primary/40"
        )}>
          {label}
        </p>
      </div>
      <p className={cn(
        "text-5xl font-display font-black leading-none tracking-tighter",
        inverted ? "text-white" : "text-brand-primary"
      )}>
        {value}
      </p>
      <span className={cn(
        "inline-flex self-start items-center px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
        inverted ? "bg-white/20 text-white" : "bg-brand-secondary/10 text-brand-secondary"
      )}>
        {pill}
      </span>
    </div>
  );
}
