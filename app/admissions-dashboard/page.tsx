"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import {
  BarChart3, UserPlus, Target, CreditCard, Search, ChevronRight,
  TrendingUp, Clock, ClipboardList, Mail, MoreVertical, Activity,
  Award, Settings2, Loader2, X, UserCheck, FileText, CheckCircle2,
  AlertCircle, Wallet, Users, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { sendExamDetails } from "@/app/actions/admissions";
import { cn } from "@/lib/utils";

// ─── shared types ────────────────────────────────────────────────────────────
type Candidate = { id: string; applicantName: string; parentName: string; parentPhone: string; parentEmail: string; targetClass: string; campus: string; entranceScore?: number; status: string; notes?: string };
type Stats = { total: number; qualified: number; offered: number; enrolled: number; feeConfirmed: number; yieldPct: string; scholarshipCount?: number };
type Config = { cutoffScore: number; scholarshipScore: number; entranceFee?: number; campus?: string };

// ─── role buckets ─────────────────────────────────────────────────────────────
const CAMPUS_LEADS   = ["PRINCIPAL", "HEAD_TEACHER"];
const INTAKE_ADMIN   = ["VP_ADMIN", "ASST_HEAD_TEACHER"];
const FINANCE_ROLES  = ["BURSAR", "ACCOUNTS_OFFICER"];
const READ_ONLY      = ["VP_ACADEMICS", "DEAN", "HR"];

// ─── root page ────────────────────────────────────────────────────────────────
export default function AdmissionsDashboard() {
  const { user } = useAuth();
  const role = user?.role as string;

  const [stats,                setStats]                = useState<Stats | null>(null);
  const [candidates,           setCandidates]           = useState<Candidate[]>([]);
  const [qualifiedCandidates,  setQualifiedCandidates]  = useState<Candidate[]>([]);
  const [scholarshipCandidates,setScholarshipCandidates]= useState<Candidate[]>([]);
  const [feeQueue,             setFeeQueue]             = useState<Candidate[]>([]);
  const [config,               setConfig]               = useState<Config | null>(null);
  const [loading,              setLoading]              = useState(true);
  const [scores,               setScores]               = useState<Record<string, string>>({});
  const [savingScore,          setSavingScore]          = useState<string | null>(null);
  const [selectedCandidate,    setSelectedCandidate]    = useState<Candidate | null>(null);
  const [sendingEmail,         setSendingEmail]         = useState(false);
  const [offeringAdmission,    setOfferingAdmission]    = useState<string | null>(null);
  const [showRegisterForm,     setShowRegisterForm]     = useState(false);

  const fetchData = async () => {
    try {
      const fetches: Promise<Response>[] = [
        fetch("/api/admissions/stats"),
        fetch("/api/admissions?status=APPLIED"),
        fetch("/api/admissions/config"),
        fetch("/api/admissions?status=SCHOLARSHIP_REVIEW"),
        fetch("/api/admissions?status=QUALIFIED"),
        fetch("/api/admissions?status=FEE_CONFIRMED"),
      ];
      const [sRes, cRes, confRes, scholRes, qualRes, feeRes] = await Promise.all(fetches);

      if (sRes.ok)    setStats(await sRes.json());
      if (cRes.ok)    setCandidates((await cRes.json()).admissions || []);
      if (confRes.ok) { const d = await confRes.json(); setConfig(Array.isArray(d) ? d[0] : d); }
      if (scholRes.ok)setScholarshipCandidates((await scholRes.json()).admissions || []);
      if (qualRes.ok) setQualifiedCandidates((await qualRes.json()).admissions || []);
      if (feeRes.ok)  setFeeQueue((await feeRes.json()).admissions || []);
    } catch (err) {
      console.error("Admissions fetch failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleScoreSubmit = async (id: string, campus: string) => {
    const scoreVal = parseFloat(scores[id]);
    if (isNaN(scoreVal)) return;
    setSavingScore(id);
    try {
      const cutoff = config?.cutoffScore ?? 50;
      const scholThreshold = config?.scholarshipScore ?? 90;
      let newStatus = "REJECTED";
      if (scoreVal >= scholThreshold) newStatus = "SCHOLARSHIP_REVIEW";
      else if (scoreVal >= cutoff)    newStatus = "QUALIFIED";

      const res = await fetch(`/api/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entranceScore: scoreVal, status: newStatus, isScholarshipEligible: newStatus === "SCHOLARSHIP_REVIEW" }),
      });
      if (res.ok) {
        toast.success(`Score recorded — ${newStatus.replace("_", " ")}`);
        setCandidates(prev => prev.filter(c => c.id !== id));
        fetchData();
      } else {
        toast.error("Failed to record score.");
      }
    } catch { toast.error("Network error."); }
    finally { setSavingScore(null); }
  };

  const handleOfferAdmission = async (id: string) => {
    setOfferingAdmission(id);
    try {
      const res = await fetch(`/api/admissions/${id}/enroll`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Admission offered — portal accounts created and email sent.");
        setQualifiedCandidates(prev => prev.filter(c => c.id !== id));
        setScholarshipCandidates(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error(data.error || "Failed to issue admission offer.");
      }
    } catch { toast.error("Network error — please try again."); }
    finally { setOfferingAdmission(null); }
  };

  const handleScholarshipDeny = async (id: string) => {
    await fetch(`/api/admissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "QUALIFIED", isScholarshipEligible: false }),
    });
    setScholarshipCandidates(prev => prev.filter(c => c.id !== id));
    toast.success("Scholarship declined — moved to standard offer queue.");
  };

  // ── shared props bundle ──────────────────────────────────────────────────────
  const shared = {
    stats, candidates, qualifiedCandidates, scholarshipCandidates, feeQueue,
    config, loading, scores, savingScore, offeringAdmission, sendingEmail,
    selectedCandidate, showRegisterForm,
    setScores, setSelectedCandidate, setShowRegisterForm,
    handleScoreSubmit, handleOfferAdmission, handleScholarshipDeny,
    sendExamDetails,
    setSendingEmail,
    setCandidates,
    fetchData,
  };

  // ── route by role ────────────────────────────────────────────────────────────
  const renderView = () => {
    if (!user) return null;
    if (role === "DIRECTOR")                   return <DirectorView {...shared} />;
    if (CAMPUS_LEADS.includes(role))           return <CampusLeadView {...shared} campus={user.campus} />;
    if (INTAKE_ADMIN.includes(role))           return <IntakeAdminView {...shared} />;
    if (FINANCE_ROLES.includes(role))          return <BursarView {...shared} />;
    if (READ_ONLY.includes(role))              return <ReadOnlyView {...shared} />;
    return <ReadOnlyView {...shared} />;
  };

  return (
    <DashboardShell>
      {renderView()}
      {showRegisterForm && (
        <RegisterApplicantModal
          onClose={() => setShowRegisterForm(false)}
          onSuccess={() => { setShowRegisterForm(false); fetchData(); }}
        />
      )}
      <CandidateModal
        candidate={selectedCandidate}
        sendingEmail={sendingEmail}
        onClose={() => setSelectedCandidate(null)}
        onSendExam={async () => {
          if (!selectedCandidate) return;
          setSendingEmail(true);
          try {
            const res = await sendExamDetails(selectedCandidate.id);
            if (res.success) {
              toast.success("Exam details sent successfully!");
              setSelectedCandidate(null);
              fetchData();
            } else {
              toast.error(res.error || "Failed to send email.");
            }
          } catch { toast.error("An error occurred."); }
          finally { setSendingEmail(false); }
        }}
      />
    </DashboardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: DIRECTOR — cross-campus strategic overview + scholarship decisions
// ═══════════════════════════════════════════════════════════════════════════════
function DirectorView({ stats, scholarshipCandidates, config, loading, offeringAdmission, handleOfferAdmission, handleScholarshipDeny }: any) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Institutional Growth"
        title={<>Admissions <span className="text-brand-secondary">Command</span></>}
        subtitle="Cross-campus pipeline, scholarship decisions, and strategic metrics."
        avatar="DC"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Applied"      value={stats?.total        ?? "—"} icon={<Users size={18}/>}       />
        <StatCard label="Qualified"          value={stats?.qualified    ?? "—"} icon={<CheckCircle2 size={18}/>} accent />
        <StatCard label="Offered"            value={stats?.offered      ?? "—"} icon={<UserCheck size={18}/>}   />
        <StatCard label="Enrolled"           value={stats?.enrolled     ?? "—"} icon={<Award size={18}/>}       highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Conversion Funnel</h3>
            <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Both Campuses</span>
          </div>
          <FunnelStage label="Total Inquiries"      val={stats?.total      ?? 0} max={stats?.total ?? 1} color="bg-brand-primary/20"    />
          <FunnelStage label="Qualified"            val={stats?.qualified  ?? 0} max={stats?.total ?? 1} color="bg-brand-secondary/40"  />
          <FunnelStage label="Offer Extended"       val={stats?.offered    ?? 0} max={stats?.total ?? 1} color="bg-brand-accent/50"     />
          <FunnelStage label="Fee Confirmed"        val={stats?.feeConfirmed ?? 0} max={stats?.total ?? 1} color="bg-brand-secondary"   />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          {/* Scholarship queue */}
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-secondary/10 grid place-items-center shrink-0"><Award size={16} className="text-brand-secondary" /></div>
                <h4 className="font-black text-brand-primary text-sm">Scholarship Review</h4>
              </div>
              {scholarshipCandidates.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-brand-secondary text-white text-token-micro font-black">{scholarshipCandidates.length}</span>
              )}
            </div>
            {scholarshipCandidates.length === 0 ? (
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest text-center py-4">No pending reviews</p>
            ) : scholarshipCandidates.slice(0, 4).map((c: any) => (
              <div key={c.id} className="p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm font-black text-brand-primary">{c.applicantName}</p>
                    <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest">{c.targetClass} · {c.campus}</p>
                  </div>
                  <span className="text-xl font-display font-black text-brand-secondary">{c.entranceScore}%</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOfferAdmission(c.id)} disabled={offeringAdmission === c.id}
                    className="flex-1 bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest py-2 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1">
                    {offeringAdmission === c.id ? <Loader2 size={12} className="animate-spin" /> : null}
                    {offeringAdmission === c.id ? "Sending..." : "Approve"}
                  </button>
                  <button onClick={() => handleScholarshipDeny(c.id)}
                    className="flex-1 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary font-black text-token-micro uppercase tracking-widest py-2 rounded-xl hover:bg-brand-error/10 hover:text-brand-error hover:border-brand-error/20 transition-all">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Config summary */}
          <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 text-white flex flex-col gap-4">
            <h4 className="font-black text-white/50 text-token-micro uppercase tracking-widest">Admission Thresholds</h4>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-token-micro font-black text-white/60 uppercase tracking-widest">Cut-off Score</span>
                <span className="font-display font-black text-brand-secondary text-lg">{config?.cutoffScore ?? 50}%</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-token-micro font-black text-white/60 uppercase tracking-widest">Scholarship Mark</span>
                <span className="font-display font-black text-brand-secondary text-lg">{config?.scholarshipScore ?? 90}%</span>
              </div>
            </div>
            <a href="/fee-configuration" className="mt-2 w-full bg-white/10 text-white font-black text-token-micro uppercase tracking-widest py-3 rounded-xl hover:bg-white/20 transition-all text-center block">
              Adjust Thresholds →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: CAMPUS LEAD (Principal / Head Teacher) — exam queue + offers
// ═══════════════════════════════════════════════════════════════════════════════
function CampusLeadView({ stats, candidates, qualifiedCandidates, scholarshipCandidates, loading, scores, savingScore, offeringAdmission, setScores, setSelectedCandidate, handleScoreSubmit, handleOfferAdmission, handleScholarshipDeny, campus }: any) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${campus || "Campus"} Admissions`}
        title={<>Admissions <span className="text-brand-secondary">Operations</span></>}
        subtitle="Review applications, record entrance scores, and issue placement offers."
        avatar="CL"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Awaiting Exam"  value={candidates.length}            icon={<Clock size={18}/>}          />
        <StatCard label="Qualified"      value={qualifiedCandidates.length}   icon={<CheckCircle2 size={18}/>}   accent />
        <StatCard label="Scholarship"    value={scholarshipCandidates.length} icon={<Award size={18}/>}          />
        <StatCard label="Yield Rate"     value={`${stats?.yieldPct ?? "0"}%`} icon={<TrendingUp size={18}/>}     highlight />
      </div>

      {/* Entrance Exam Score Queue */}
      <QueueTable
        title="Entrance Exam Queue"
        subtitle="Record scores to qualify or reject applicants"
        badge={`${candidates.length} Awaiting`}
        badgeColor="bg-brand-primary/8 text-brand-primary/60"
        loading={loading}
        empty="No applicants awaiting scores."
        columns={["Applicant", "Target Class", "Score", ""]}
      >
        {candidates.map((c: any) => (
          <tr key={c.id} className="group hover:bg-brand-blush/40 transition-colors">
            <td className="px-6 py-4">
              <p className="font-black text-brand-primary text-sm">{c.applicantName}</p>
              <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest">{c.parentPhone}</p>
            </td>
            <td className="px-6 py-4">
              <span className="text-token-micro font-black text-brand-primary/60 uppercase">{c.targetClass} · {c.campus}</span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100}
                  placeholder="0–100"
                  value={scores[c.id] || ""}
                  onChange={(e) => setScores((p: any) => ({ ...p, [c.id]: e.target.value }))}
                  className="w-20 bg-white border-2 border-brand-primary/8 rounded-xl px-3 py-2 text-sm font-black text-brand-primary text-center outline-none focus:border-brand-secondary/30 transition-all"
                />
                <button
                  onClick={() => handleScoreSubmit(c.id, c.campus)}
                  disabled={savingScore === c.id || !scores[c.id]}
                  className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {savingScore === c.id ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                </button>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => setSelectedCandidate(c)} className="text-brand-primary/20 hover:text-brand-primary transition-colors">
                <MoreVertical size={16} />
              </button>
            </td>
          </tr>
        ))}
      </QueueTable>

      {/* Offer Queue */}
      {(qualifiedCandidates.length > 0 || scholarshipCandidates.length > 0) && (
        <QueueTable
          title="Admission Offers Queue"
          subtitle="Issue placement offers to qualified applicants"
          badge={`${qualifiedCandidates.length + scholarshipCandidates.length} Ready`}
          badgeColor="bg-brand-secondary/10 text-brand-secondary"
          loading={false}
          empty=""
          columns={["Applicant", "Parent Email", "Score", "Track", ""]}
        >
          {[...scholarshipCandidates, ...qualifiedCandidates].map((c: any) => (
            <tr key={c.id} className="group hover:bg-brand-blush/40 transition-colors">
              <td className="px-6 py-4">
                <p className="font-black text-brand-primary text-sm">{c.applicantName}</p>
                <p className="text-token-micro font-bold text-brand-primary/40 uppercase">{c.targetClass} · {c.campus}</p>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-bold text-brand-primary/70">{c.parentEmail || <span className="text-brand-error italic">Missing</span>}</span>
              </td>
              <td className="px-6 py-4">
                <span className="font-display font-black text-brand-primary">{c.entranceScore ?? "—"}%</span>
              </td>
              <td className="px-6 py-4">
                {c.status === "SCHOLARSHIP_REVIEW"
                  ? <TrackBadge label="Scholarship" color="bg-amber-50 text-amber-600 border-amber-200" />
                  : <TrackBadge label="Standard" color="bg-brand-secondary/10 text-brand-primary/60 border-brand-primary/10" />
                }
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {c.status === "SCHOLARSHIP_REVIEW" && (
                    <button onClick={() => handleScholarshipDeny(c.id)}
                      className="px-3 py-2 rounded-xl bg-brand-primary/5 border border-brand-primary/8 text-brand-primary font-black text-token-micro uppercase tracking-widest hover:bg-brand-error/10 hover:text-brand-error hover:border-brand-error/20 transition-all">
                      Deny
                    </button>
                  )}
                  <button
                    onClick={() => handleOfferAdmission(c.id)}
                    disabled={offeringAdmission === c.id || !c.parentEmail}
                    title={!c.parentEmail ? "Parent email missing" : ""}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {offeringAdmission === c.id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    {offeringAdmission === c.id ? "Sending…" : "Offer Admission"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </QueueTable>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: INTAKE ADMIN (VP_ADMIN / ASST_HEAD) — registration + full pipeline
// ═══════════════════════════════════════════════════════════════════════════════
function IntakeAdminView({ stats, candidates, loading, scores, savingScore, setScores, setSelectedCandidate, handleScoreSubmit, setShowRegisterForm }: any) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Intake Management"
        title={<>Applicant <span className="text-brand-secondary">Registry</span></>}
        subtitle="Register new applicants and manage the incoming admissions pipeline."
        avatar="IA"
        action={
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-6 h-12 rounded-2xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
          >
            <UserPlus size={16} /> Register Applicant
          </button>
        }
      />

      {/* Pipeline overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applied"       value={stats?.total       ?? "—"} icon={<FileText size={18}/>}    />
        <StatCard label="In Review"     value={candidates.length}         icon={<Clock size={18}/>}        />
        <StatCard label="Qualified"     value={stats?.qualified   ?? "—"} icon={<CheckCircle2 size={18}/>} accent />
        <StatCard label="Enrolled"      value={stats?.enrolled    ?? "—"} icon={<UserCheck size={18}/>}   highlight />
      </div>

      <QueueTable
        title="Pending Exam Queue"
        subtitle="Applicants awaiting entrance exam scheduling and score entry"
        badge={`${candidates.length} Active`}
        badgeColor="bg-brand-primary/8 text-brand-primary/60"
        loading={loading}
        empty="No applicants in queue."
        columns={["Applicant", "Guardian", "Target Class", "Score", ""]}
      >
        {candidates.slice(0, 15).map((c: any) => (
          <tr key={c.id} className="group hover:bg-brand-blush/40 transition-colors">
            <td className="px-6 py-4">
              <p className="font-black text-brand-primary text-sm">{c.applicantName}</p>
              <p className="text-token-micro font-bold text-brand-primary/40 uppercase">{c.campus} campus</p>
            </td>
            <td className="px-6 py-4">
              <p className="text-xs font-bold text-brand-primary/70">{c.parentName}</p>
              <p className="text-token-micro text-brand-primary/40">{c.parentPhone}</p>
            </td>
            <td className="px-6 py-4">
              <span className="text-token-micro font-black text-brand-primary/60 uppercase">{c.targetClass}</span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100} placeholder="0–100"
                  value={scores[c.id] || ""}
                  onChange={(e) => setScores((p: any) => ({ ...p, [c.id]: e.target.value }))}
                  className="w-20 bg-white border-2 border-brand-primary/8 rounded-xl px-3 py-2 text-sm font-black text-brand-primary text-center outline-none focus:border-brand-secondary/30 transition-all"
                />
                <button
                  onClick={() => handleScoreSubmit(c.id, c.campus)}
                  disabled={savingScore === c.id || !scores[c.id]}
                  className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {savingScore === c.id ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                </button>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => setSelectedCandidate(c)} className="text-brand-primary/20 hover:text-brand-primary">
                <MoreVertical size={16} />
              </button>
            </td>
          </tr>
        ))}
      </QueueTable>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: BURSAR — fee processing + enrollment confirmation
// ═══════════════════════════════════════════════════════════════════════════════
function BursarView({ stats, feeQueue, loading }: any) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Fee Processing"
        title={<>Admissions <span className="text-brand-secondary">Finance</span></>}
        subtitle="Track fee confirmations and process enrollment payments for new applicants."
        avatar="BU"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-primary/8 grid place-items-center shrink-0"><Wallet size={20} className="text-brand-primary" /></div>
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Fee Confirmed</p>
          </div>
          <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats?.feeConfirmed ?? "—"}</p>
          <span className="inline-flex self-start px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">Awaiting enrollment</span>
        </div>
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-primary/8 grid place-items-center shrink-0"><UserCheck size={20} className="text-brand-primary" /></div>
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Enrolled</p>
          </div>
          <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{stats?.enrolled ?? "—"}</p>
          <span className="inline-flex self-start px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">This session</span>
        </div>
        <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 grid place-items-center shrink-0"><TrendingUp size={20} className="text-white" /></div>
            <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Yield Rate</p>
          </div>
          <p className="text-5xl font-display font-black text-white leading-none tracking-tighter">{stats?.yieldPct ?? "0"}%</p>
          <span className="inline-flex self-start px-3 py-1 rounded-full bg-white/10 text-white text-token-micro font-black uppercase tracking-widest">Admission cycle</span>
        </div>
      </div>

      <QueueTable
        title="Fee Confirmed — Pending Enrollment"
        subtitle="Applicants whose fees are confirmed and ready for portal access"
        badge={`${feeQueue.length} Pending`}
        badgeColor="bg-brand-secondary/10 text-brand-secondary"
        loading={loading}
        empty="No applicants pending enrollment."
        columns={["Applicant", "Campus", "Guardian Contact", "Status"]}
      >
        {feeQueue.map((c: any) => (
          <tr key={c.id} className="hover:bg-brand-blush/40 transition-colors">
            <td className="px-6 py-4">
              <p className="font-black text-brand-primary text-sm">{c.applicantName}</p>
              <p className="text-token-micro font-bold text-brand-primary/40 uppercase">{c.targetClass}</p>
            </td>
            <td className="px-6 py-4"><span className="text-xs font-bold text-brand-primary/60 uppercase">{c.campus}</span></td>
            <td className="px-6 py-4">
              <p className="text-xs font-bold text-brand-primary/70">{c.parentName}</p>
              <p className="text-token-micro text-brand-primary/40">{c.parentPhone}</p>
            </td>
            <td className="px-6 py-4">
              <TrackBadge label="Fee Confirmed" color="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20" />
            </td>
          </tr>
        ))}
      </QueueTable>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW: READ-ONLY (VP_Academics, Dean, HR) — pipeline visibility only
// ═══════════════════════════════════════════════════════════════════════════════
function ReadOnlyView({ stats, candidates, loading }: any) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admissions Pipeline"
        title={<>Admissions <span className="text-brand-secondary">Overview</span></>}
        subtitle="Read-only view of the current admission cycle status."
        avatar="RO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Applied"  value={stats?.total       ?? "—"} icon={<Users size={18}/>}       />
        <StatCard label="Qualified"      value={stats?.qualified   ?? "—"} icon={<CheckCircle2 size={18}/>} accent />
        <StatCard label="Offers Sent"    value={stats?.offered     ?? "—"} icon={<Mail size={18}/>}        />
        <StatCard label="Enrolled"       value={stats?.enrolled    ?? "—"} icon={<UserCheck size={18}/>}   highlight />
      </div>

      <QueueTable
        title="Current Applicant Queue"
        subtitle="Applicants awaiting exam and qualification"
        badge={`${candidates.length} Active`}
        badgeColor="bg-brand-primary/8 text-brand-primary/60"
        loading={loading}
        empty="No applicants in queue."
        columns={["Applicant", "Target Class", "Campus", "Status"]}
      >
        {candidates.map((c: any) => (
          <tr key={c.id} className="hover:bg-brand-blush/40 transition-colors">
            <td className="px-6 py-4"><p className="font-black text-brand-primary text-sm">{c.applicantName}</p></td>
            <td className="px-6 py-4"><span className="text-xs font-bold text-brand-primary/60 uppercase">{c.targetClass}</span></td>
            <td className="px-6 py-4"><span className="text-xs font-bold text-brand-primary/60 uppercase">{c.campus}</span></td>
            <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
          </tr>
        ))}
      </QueueTable>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function PageHeader({ eyebrow, title, subtitle, avatar, action }: any) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
          <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{eyebrow}</span>
        </div>
        <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">{title}</h1>
        <p className="text-brand-primary/40 text-xs font-medium mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <button
          onClick={() => router.push("/notifications")}
          aria-label="View notifications"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
        >
          <Bell size={18} />
        </button>
        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">{avatar}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, highlight }: any) {
  return (
    <div className={cn(
      "rounded-3xl p-6 flex flex-col gap-4 shadow-sm",
      highlight ? "bg-brand-primary shadow-brand-primary/20 shadow-xl" : "bg-white border border-brand-primary/8"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full grid place-items-center shrink-0", highlight ? "bg-white/10" : accent ? "bg-brand-secondary/10" : "bg-brand-primary/8")}>
          <span className={cn(highlight ? "text-white" : accent ? "text-brand-secondary" : "text-brand-primary")}>{icon}</span>
        </div>
        <p className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-white/50" : "text-brand-primary/40")}>{label}</p>
      </div>
      <p className={cn("text-4xl font-display font-black leading-none tracking-tighter", highlight ? "text-white" : "text-brand-primary")}>{value}</p>
    </div>
  );
}

function QueueTable({ title, subtitle, badge, badgeColor, loading, empty, columns, children }: any) {
  return (
    <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-brand-primary/8 flex items-center justify-between">
        <div>
          <h3 className="font-black text-brand-primary text-sm uppercase tracking-widest">{title}</h3>
          <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest", badgeColor)}>{badge}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-brand-blush/40 text-token-micro font-black uppercase tracking-[0.15em] text-brand-primary/40">
            <tr>{columns.map((col: string, i: number) => <th key={i} className="px-6 py-4">{col}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {loading
              ? <tr><td colSpan={columns.length} className="py-16 text-center font-black text-brand-primary/30 uppercase tracking-widest text-token-micro animate-pulse">Loading…</td></tr>
              : Array.isArray(children) && children.length === 0
                ? <tr><td colSpan={columns.length} className="py-16 text-center font-black text-brand-primary/30 uppercase tracking-widest text-token-micro italic">{empty}</td></tr>
                : children
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FunnelStage({ label, val, max, color }: any) {
  const pct = Math.max(4, (val / Math.max(max, 1)) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50">{label}</span>
        <span className="text-xs font-black text-brand-primary">{val.toLocaleString()}</span>
      </div>
      <div className="h-4 bg-brand-primary/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function TrackBadge({ label, color }: { label: string; color: string }) {
  return <span className={cn("text-token-micro font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", color)}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPLIED:             "bg-blue-50 text-blue-600 border-blue-200",
    EXAM_DETAILS_SENT:   "bg-purple-50 text-purple-600 border-purple-200",
    QUALIFIED:           "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20",
    SCHOLARSHIP_REVIEW:  "bg-amber-50 text-amber-600 border-amber-200",
    OFFERED:             "bg-green-50 text-green-600 border-green-200",
    FEE_CONFIRMED:       "bg-teal-50 text-teal-600 border-teal-200",
    ENROLLED:            "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    REJECTED:            "bg-brand-error/10 text-brand-error border-brand-error/20",
  };
  return <TrackBadge label={status.replace(/_/g, " ")} color={map[status] ?? "bg-brand-primary/5 text-brand-primary/60 border-brand-primary/10"} />;
}

function RegisterApplicantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ applicantName: "", campus: "PRIMARY", targetClass: "", type: "NEW", parentName: "", parentPhone: "", parentEmail: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicantName || !form.targetClass || !form.parentName || !form.parentPhone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${form.applicantName} registered successfully.`);
        onSuccess();
      } else {
        toast.error(data.error || "Registration failed.");
      }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: string, type = "text", required = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">
        {label}{required && <span className="text-brand-error ml-1">*</span>}
      </label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        required={required}
        className="bg-brand-blush/30 border border-brand-primary/8 rounded-xl px-4 py-3 text-sm font-bold text-brand-primary outline-none focus:border-brand-secondary/40 transition-all"
      />
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary/80 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
        >
          <div className="bg-brand-primary p-6 flex justify-between items-center">
            <div>
              <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Register Applicant</h3>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-0.5">New Admissions Entry</p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Applicant Full Name", "applicantName", "text", true)}
              {field("Target Class", "targetClass", "text", true)}
              <div className="flex flex-col gap-1.5">
                <label className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Campus <span className="text-brand-error">*</span></label>
                <select value={form.campus} onChange={e => set("campus", e.target.value)}
                  className="bg-brand-blush/30 border border-brand-primary/8 rounded-xl px-4 py-3 text-sm font-bold text-brand-primary outline-none focus:border-brand-secondary/40 transition-all">
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Application Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value)}
                  className="bg-brand-blush/30 border border-brand-primary/8 rounded-xl px-4 py-3 text-sm font-bold text-brand-primary outline-none focus:border-brand-secondary/40 transition-all">
                  <option value="NEW">New Student</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="RETURNING">Returning</option>
                </select>
              </div>
              {field("Guardian Name", "parentName", "text", true)}
              {field("Guardian Phone", "parentPhone", "tel", true)}
              {field("Guardian Email", "parentEmail", "email")}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                className="bg-brand-blush/30 border border-brand-primary/8 rounded-xl px-4 py-3 text-sm font-bold text-brand-primary outline-none focus:border-brand-secondary/40 transition-all resize-none"
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="px-6 py-3 rounded-xl border border-brand-primary/10 text-brand-primary font-black text-token-micro uppercase tracking-widest hover:bg-brand-blush/40 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {saving ? "Registering…" : "Register Applicant"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CandidateModal({ candidate, sendingEmail, onClose, onSendExam }: any) {
  if (!candidate) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="bg-brand-primary p-6 flex justify-between items-center text-white">
            <div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight">{candidate.applicantName}</h3>
              <p className="text-token-micro font-black uppercase tracking-widest text-brand-secondary">{candidate.targetClass} · {candidate.campus} Campus</p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-8 flex flex-col gap-6">
            <div className="bg-brand-blush/30 p-6 rounded-2xl border border-brand-primary/5">
              <h4 className="text-token-micro font-black text-brand-primary uppercase tracking-widest mb-4">Guardian Information</h4>
              <div className="space-y-3 text-sm">
                {[["Name", candidate.parentName], ["Phone", candidate.parentPhone], ["Email", candidate.parentEmail]].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="font-bold text-brand-primary/50">{k}:</span>
                    <span className="font-black text-brand-primary uppercase">{v || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            {candidate.notes && (
              <div>
                <h4 className="text-token-micro font-black text-brand-primary uppercase tracking-widest mb-2">Application Notes</h4>
                <p className="text-xs text-brand-primary/60 italic">{candidate.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={onSendExam}
                disabled={sendingEmail}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {sendingEmail ? "Sending…" : "Send Exam Details"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
