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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Breadcrumb & Date */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} COMMAND</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-brand-primary tracking-tighter uppercase">
              ACADEMIC <span className="text-brand-accent">CORE</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-tertiary" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">
              {currentDate}
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            icon={<GraduationCap className="text-brand-primary" />}
            label="Active Pupils"
            value={stats.pupils}
            accent={`${campus || "PRIMARY"} CAMPUS`}
          />
          <KPICard
            icon={<UserCheck className="text-brand-primary" />}
            label="Active Staff"
            value={stats.staff}
            accent="Faculty Verified"
          />
          <KPICard
            icon={<FileSignature className="text-brand-accent" />}
            label="Compliance"
            value={stats.yield}
            accent="Campus Yield"
          />
        </div>

        {/* Intelligence Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-8">
          {/* Teacher Submissions (Left 3/5) */}
          <div className="lg:col-span-3 card flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-brand-primary">Teacher Submissions</h4>
              <a
                href="/teacher-submissions-review"
                className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary hover:underline"
              >
                Review All →
              </a>
            </div>
            <div className="flex flex-col gap-4">
              {submissions.length === 0 ? (
                <p className="text-xs text-brand-tertiary text-center py-8 italic">
                  Listening for teacher movements...
                </p>
              ) : (
                submissions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-tertiary/20 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-tertiary/10 grid place-items-center shrink-0">
                        <FileSignature size={16} className="text-brand-tertiary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">
                          {s.sender?.name || "Staff"}
                        </p>
                        <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-wider">
                          {s.category || "Academic"} Submission
                        </p>
                      </div>
                    </div>
                    <button className="bg-white border border-brand-primary/8 px-3 py-1.5 rounded-lg text-token-micro font-black text-brand-tertiary uppercase tracking-wider hover:border-brand-tertiary/30 transition-colors shrink-0">
                      Verify
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verified Admissions (Right 2/5) */}
          <div className="lg:col-span-2 card flex flex-col">
            <h4 className="font-black text-brand-primary mb-8">
              Finance-Verified Admissions
            </h4>
            <div className="flex flex-col gap-4">
              {admissions.length === 0 ? (
                <p className="text-xs text-brand-tertiary text-center py-8 italic">
                  No new Primary candidates today.
                </p>
              ) : (
                admissions.map((o: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 cursor-pointer hover:border-brand-accent/20 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 grid place-items-center shrink-0">
                        <UserPlus size={16} className="text-brand-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-primary truncate">
                          {o.applicantName}
                        </p>
                        <p className="text-token-micro font-bold text-brand-tertiary">
                          Score: {o.entranceScore}% • {o.targetClass}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-brand-tertiary opacity-50 group-hover:translate-x-1 transition-transform"
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

function KPICard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
  accent: string;
}) {
  return (
    <div className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300">
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">
          {label}
        </p>
        <p className="text-2xl font-display font-black text-brand-primary my-0.5 tracking-tighter">
          {value}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-brand-accent" />
          <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest leading-none">{accent}</p>
        </div>
      </div>
    </div>
  );
}

