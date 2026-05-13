"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  CreditCard,
  TrendingUp,
  Info,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type CampusFees = { tuition: number; admin: number; uniform: number; portal: number };
type FeeRow = { campus: "PRIMARY" | "SECONDARY"; label: string } & CampusFees;

const CATEGORY_MAP: Record<keyof CampusFees, string> = {
  tuition: "TUITION",
  admin: "DEVELOPMENT_LEVY",
  uniform: "UNIFORM",
  portal: "ICT",
};

const DEFAULT_FEES: FeeRow[] = [
  { campus: "PRIMARY", label: "Primary Campus", tuition: 0, admin: 0, uniform: 0, portal: 0 },
  { campus: "SECONDARY", label: "Secondary Campus", tuition: 0, admin: 0, uniform: 0, portal: 0 },
];

export default function FeeConfigurationPage() {
  const [fees, setFees] = useState<FeeRow[]>(DEFAULT_FEES);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>("—");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sessRes = await fetch("/api/structure/sessions");
        if (!sessRes.ok) return;
        const sessions: any[] = await sessRes.json();
        const active = sessions.find((s) => s.status === "ACTIVE") ?? sessions[0];
        if (!active) return;
        setSessionId(active.id);
        setSessionName(active.name);

        const feeRes = await fetch(`/api/finance/fees?sessionId=${active.id}`);
        if (!feeRes.ok) return;
        const { fees: configs }: { fees: any[] } = await feeRes.json();

        setFees((prev) =>
          prev.map((row) => {
            const updated = { ...row };
            for (const [field, category] of Object.entries(CATEGORY_MAP)) {
              const match = configs.find(
                (c) => c.category === category && c.campus === row.campus && !c.classId
              );
              if (match) (updated as any)[field] = match.amount;
            }
            return updated;
          })
        );
      } catch (err) {
        console.error("Fee config load failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdate = (campus: string, field: keyof CampusFees, raw: string) => {
    const value = parseInt(raw.replace(/[^0-9]/g, "")) || 0;
    setIsDirty(true);
    setFees((prev) => prev.map((row) => (row.campus === campus ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    if (!sessionId) {
      toast.error("No active session found. Create a session first.");
      return;
    }
    setIsSaving(true);
    try {
      const posts = fees.flatMap((row) =>
        (Object.entries(CATEGORY_MAP) as [keyof CampusFees, string][]).map(([field, category]) =>
          fetch("/api/finance/fees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, amount: row[field], campus: row.campus, sessionId }),
          })
        )
      );
      const results = await Promise.all(posts);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} fee(s) failed to save. Check your permissions.`);
      } else {
        toast.success("Fee structure published successfully.");
        setSavedAt(new Date());
        setIsDirty(false);
        setTimeout(() => setSavedAt(null), 2500);
      }
    } catch (err) {
      toast.error("Failed to save fee structure.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black uppercase text-brand-tertiary tracking-[0.4em]">Financial Governance</span>
            </div>
            <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-none uppercase">
              Fee <span className="text-brand-secondary">Architecture</span>
            </h1>
            <p className="text-brand-tertiary text-token-micro font-black uppercase tracking-widest mt-2">
              Session: <span className="text-brand-primary">{sessionName}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isDirty && !savedAt && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                <span className="text-token-micro font-black text-brand-accent uppercase tracking-widest">Unsaved changes</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !sessionId}
              className={cn(
                "border-2 px-10 h-14 rounded-2xl font-black text-token-micro uppercase tracking-widest transition-all shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed",
                savedAt
                  ? "bg-brand-secondary border-brand-secondary text-white"
                  : "bg-white border-brand-secondary text-brand-primary hover:bg-brand-secondary/10"
              )}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : savedAt ? <CheckCircle2 size={16} /> : <Zap size={16} />}
              {isSaving ? "Publishing..." : savedAt ? "Fees Published" : "Publish Structure"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SummaryCard label="Active Session" value={sessionName} accent="Current Period" icon={<TrendingUp className="text-brand-primary" />} highlight />
          <SummaryCard label="Campuses Configured" value="2" accent="Primary + Secondary" icon={<CreditCard className="text-brand-primary" />} />
          <SummaryCard label="Fee Components" value="4" accent="Per Campus" icon={<Layers className="text-brand-primary" />} />
        </div>

        {/* Configuration Matrix */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-brand-tertiary bg-white border border-brand-primary/8 px-6 py-3.5 rounded-2xl italic font-black text-token-micro uppercase tracking-widest w-fit">
            <Info size={14} />
            Changes apply to new billing cycles. Existing invoices are unaffected.
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-primary/30" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {fees.map((fee) => (
                <motion.div
                  key={fee.campus}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card group bg-white border border-brand-primary/8 shadow-xl p-10 flex flex-col md:flex-row md:items-center gap-10 hover:shadow-2xl transition-all"
                >
                  <div className="flex-1">
                    <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.3em] mb-2">Campus Level</p>
                    <h4 className="text-xl font-display font-black text-brand-primary uppercase tracking-tight">{fee.label}</h4>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-1 h-1 rounded-full bg-black/10" />
                      <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{fee.campus} campus — all classes</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0 md:w-2/3">
                    <FeeInput label="Tuition (Per Term)" value={fee.tuition} onChange={(v) => handleUpdate(fee.campus, "tuition", v)} />
                    <FeeInput label="Development Levy" value={fee.admin} onChange={(v) => handleUpdate(fee.campus, "admin", v)} />
                    <FeeInput label="Uniform & Kit" value={fee.uniform} onChange={(v) => handleUpdate(fee.campus, "uniform", v)} />
                    <FeeInput label="ICT / Portal" value={fee.portal} onChange={(v) => handleUpdate(fee.campus, "portal", v)} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Governance Notice */}
        <div className="card bg-black border-none p-12 text-center relative overflow-hidden">
          <p className="text-token-micro font-black text-white/40 uppercase tracking-[0.5em] mb-4">Verification Gateway</p>
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-6">
            Unauthorized fee alterations are strictly prohibited.
          </h3>
          <p className="text-white/30 text-token-micro font-black uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            Updating the fee architecture triggers a non-repudiable audit log entry. All parents will be automatically notified of structural adjustments via the family dashboard.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function SummaryCard({ label, value, accent, icon, highlight }: any) {
  return (
    <div className={cn(
      "card bg-white flex items-center gap-10 group shadow-xl transition-all border",
      highlight ? "border-brand-secondary/30" : "border-brand-primary/8"
    )}>
      <div className={cn(
        "w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500",
        highlight ? "bg-brand-secondary/10 text-brand-primary border border-brand-secondary/20" : "bg-black/[0.03] text-brand-tertiary"
      )}>
        <div className="scale-125">{icon}</div>
      </div>
      <div>
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.3em] mb-1.5">{label}</p>
        <p className="text-4xl font-display font-black text-brand-primary leading-none tabular-nums tracking-tighter">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className={cn("w-1 h-1 rounded-full", highlight ? "bg-brand-secondary" : "bg-black/10")} />
          <p className={cn("text-token-micro font-black uppercase tracking-widest", highlight ? "text-brand-secondary" : "text-brand-tertiary")}>{accent}</p>
        </div>
      </div>
    </div>
  );
}

function FeeInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-brand-tertiary/60 text-sm">₦</span>
        <input
          type="text"
          value={value > 0 ? value.toLocaleString() : ""}
          placeholder="0"
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/[0.02] border-2 border-brand-primary/8 rounded-2xl h-14 pl-10 pr-4 font-display font-black text-brand-primary text-lg tracking-tighter focus:border-brand-secondary/30 outline-none transition-all"
        />
      </div>
    </div>
  );
}
