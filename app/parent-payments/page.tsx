"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Wallet, CheckCircle2, AlertTriangle, Clock,
  CreditCard, TrendingDown, ChevronDown, ChevronUp, Loader2,
  Receipt, BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/app/components/PaymentModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";
type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

interface Invoice {
  id: string;
  amount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  category: string;
  dueDate: string;
  notes: string | null;
  term: { name: string };
  session: { name: string };
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  status: PaymentStatus;
  category: string;
  createdAt: string;
}

interface Ward {
  id: string;
  name: string;
  campus: string;
  class: string | null;
  arm: string | null;
  invoices: Invoice[];
  payments: Payment[];
  totalOwed: number;
  totalPaid: number;
  currentTermId: string | null;
}

const STATUS_META: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PAID:    { label: "Paid",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",   icon: <CheckCircle2 size={12} /> },
  PARTIAL: { label: "Partial", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",       icon: <Clock size={12} /> },
  UNPAID:  { label: "Unpaid",  color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",         icon: <AlertTriangle size={12} /> },
  OVERDUE: { label: "Overdue", color: "text-rose-800",    bg: "bg-rose-100 border-rose-300",        icon: <AlertTriangle size={12} /> },
  WAIVED:  { label: "Waived",  color: "text-brand-primary/50", bg: "bg-brand-primary/5 border-brand-primary/10", icon: <BadgeCheck size={12} /> },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  PENDING:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  FAILED:    { label: "Failed",    color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
  REFUNDED:  { label: "Refunded",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
};

function formatCat(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ParentPaymentsContent() {
  const router = useRouter();
  const [wards, setWards] = useState<Ward[]>([]);
  const [currentTerm, setCurrentTerm] = useState<{ name: string; session: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWard, setActiveWard] = useState(0);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  useEffect(() => {
    fetch("/api/parent/payments")
      .then((r) => r.json())
      .then((d) => {
        setWards(d.wards ?? []);
        if (d.currentTerm) setCurrentTerm(d.currentTerm);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ward = wards[activeWard] ?? null;
  const overallOwed = wards.reduce((s, w) => s + w.totalOwed, 0);
  const overallPaid = wards.reduce((s, w) => s + w.totalPaid, 0);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-brand-primary/8 bg-white shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">FAMILY PORTAL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Fee <span className="text-brand-secondary">History</span>
            </h1>
          </div>
          {currentTerm && (
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">{currentTerm.session}</span>
              <span className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">{currentTerm.name} Term</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="text-brand-secondary animate-spin" />
            <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/30">Loading fee records...</p>
          </div>
        ) : wards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Wallet size={40} className="text-brand-primary/10" />
            <p className="text-sm font-black text-brand-primary/30 uppercase tracking-widest">No children linked to this account</p>
          </div>
        ) : (
          <>
            {/* ── Summary Strip ── */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-3xl p-6 flex flex-col gap-3",
                  overallOwed > 0 ? "bg-rose-50 border border-rose-200" : "bg-brand-primary border-none shadow-xl shadow-brand-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", overallOwed > 0 ? "bg-rose-100" : "bg-white/10")}>
                    <TrendingDown size={18} className={overallOwed > 0 ? "text-rose-600" : "text-white"} />
                  </div>
                  <p className={cn("text-token-micro font-black uppercase tracking-widest", overallOwed > 0 ? "text-rose-600/70" : "text-white/50")}>
                    Total Outstanding
                  </p>
                </div>
                <p className={cn("text-3xl font-display font-black leading-none tracking-tighter", overallOwed > 0 ? "text-rose-700" : "text-white")}>
                  ₦{overallOwed.toLocaleString()}
                </p>
                <span className={cn("text-token-micro font-black uppercase tracking-widest", overallOwed > 0 ? "text-rose-500" : "text-brand-secondary")}>
                  {overallOwed === 0 ? "Fully cleared" : "Balance due"}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-3xl p-6 flex flex-col gap-3 bg-white border border-brand-primary/8 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-secondary/10">
                    <CheckCircle2 size={18} className="text-brand-secondary" />
                  </div>
                  <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/40">Total Paid</p>
                </div>
                <p className="text-3xl font-display font-black text-brand-primary leading-none tracking-tighter">
                  ₦{overallPaid.toLocaleString()}
                </p>
                <span className="text-token-micro font-black uppercase tracking-widest text-brand-primary/30">
                  Confirmed payments
                </span>
              </motion.div>
            </div>

            {/* ── Ward Tabs ── */}
            {wards.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {wards.map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => setActiveWard(i)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap",
                      i === activeWard
                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                        : "bg-white border border-brand-primary/8 text-brand-primary/60 hover:text-brand-primary hover:border-brand-primary/20"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center", i === activeWard ? "bg-white/20" : "bg-brand-primary/8")}>
                      {w.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className={cn("text-xs font-black uppercase tracking-tight leading-none", i === activeWard ? "text-white" : "text-brand-primary")}>{w.name.split(" ")[0]}</p>
                      {w.totalOwed > 0 && (
                        <p className={cn("text-[0.6rem] font-black mt-0.5", i === activeWard ? "text-rose-300" : "text-rose-500")}>
                          ₦{w.totalOwed.toLocaleString()} due
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {ward && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={ward.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col gap-6"
                >
                  {/* Ward Info Strip */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-brand-primary/8 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-primary text-white font-black text-lg flex items-center justify-center shadow">
                        {ward.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-brand-primary uppercase tracking-tight">{ward.name}</p>
                        <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                          {ward.class ?? "Pre-enrollment"} · {ward.campus}
                        </p>
                      </div>
                    </div>
                    {ward.totalOwed > 0 && (
                      <button
                        onClick={() => { setSelectedWard(ward); setPayModalOpen(true); }}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest hover:opacity-90 transition-opacity shadow"
                      >
                        Pay Balance
                      </button>
                    )}
                  </div>

                  {/* Invoices */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-brand-primary text-sm uppercase tracking-widest">Invoices</h3>
                      <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                        {ward.invoices.length} record{ward.invoices.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {ward.invoices.length === 0 ? (
                      <div className="flex items-center justify-center py-10 rounded-2xl border-2 border-dashed border-brand-primary/8">
                        <p className="text-xs font-black text-brand-primary/20 uppercase tracking-widest">No invoices found</p>
                      </div>
                    ) : (
                      ward.invoices.map((inv, i) => {
                        const meta = STATUS_META[inv.status];
                        const isExpanded = expandedInvoice === inv.id;
                        return (
                          <motion.div
                            key={inv.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-2xl border border-brand-primary/8 overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-brand-blush/30 transition-colors"
                            >
                              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", meta.bg, meta.color)}>
                                {meta.icon}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-black text-brand-primary">{formatCat(inv.category)}</p>
                                  <span className={cn("px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest border", meta.bg, meta.color)}>
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mt-0.5">
                                  {inv.session.name} · {inv.term.name} Term
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black text-brand-primary">₦{inv.amount.toLocaleString()}</p>
                                {inv.balance > 0 && inv.status !== "WAIVED" && (
                                  <p className="text-[0.6rem] font-black text-rose-500 uppercase tracking-widest">
                                    ₦{inv.balance.toLocaleString()} due
                                  </p>
                                )}
                              </div>
                              <div className="text-brand-primary/20 shrink-0">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-brand-primary/5">
                                    <div className="p-3 bg-brand-blush/40 rounded-xl">
                                      <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">Total Amount</p>
                                      <p className="text-sm font-black text-brand-primary mt-0.5">₦{inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-brand-blush/40 rounded-xl">
                                      <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">Amount Paid</p>
                                      <p className="text-sm font-black text-brand-secondary mt-0.5">₦{inv.amountPaid.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-brand-blush/40 rounded-xl">
                                      <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">Balance</p>
                                      <p className={cn("text-sm font-black mt-0.5", inv.balance > 0 ? "text-rose-600" : "text-brand-secondary")}>
                                        ₦{inv.balance.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-brand-blush/40 rounded-xl col-span-2 sm:col-span-1">
                                      <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">Due Date</p>
                                      <p className="text-sm font-black text-brand-primary mt-0.5">
                                        {format(new Date(inv.dueDate), "d MMM yyyy")}
                                      </p>
                                    </div>
                                    {inv.notes && (
                                      <div className="p-3 bg-brand-blush/40 rounded-xl col-span-2 sm:col-span-3">
                                        <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">Notes</p>
                                        <p className="text-xs font-medium text-brand-primary/60 mt-0.5">{inv.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Payment History */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-brand-primary text-sm uppercase tracking-widest">Payment History</h3>
                      <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                        {ward.payments.filter((p) => p.status === "CONFIRMED").length} confirmed
                      </span>
                    </div>

                    {ward.payments.length === 0 ? (
                      <div className="flex items-center justify-center py-10 rounded-2xl border-2 border-dashed border-brand-primary/8">
                        <p className="text-xs font-black text-brand-primary/20 uppercase tracking-widest">No payments recorded</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-brand-primary/8 overflow-hidden">
                        {ward.payments.map((p, i) => {
                          const ps = PAYMENT_STATUS[p.status];
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className={cn("flex items-center gap-4 px-4 py-3.5", i !== ward.payments.length - 1 && "border-b border-brand-primary/5")}
                            >
                              <div className="w-9 h-9 rounded-xl bg-brand-primary/5 flex items-center justify-center shrink-0">
                                <Receipt size={15} className="text-brand-primary/40" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-brand-primary">{formatCat(p.category)}</p>
                                  <span className={cn("px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest border", ps.bg, ps.color)}>
                                    {ps.label}
                                  </span>
                                </div>
                                <p className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest mt-0.5">
                                  Ref: {p.reference.slice(0, 12)}… · {format(new Date(p.createdAt), "d MMM yyyy")}
                                </p>
                              </div>
                              <p className={cn("text-sm font-black shrink-0", p.status === "CONFIRMED" ? "text-brand-secondary" : "text-brand-primary/60")}>
                                ₦{p.amount.toLocaleString()}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>

      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        ward={selectedWard}
      />
    </DashboardShell>
  );
}

export default function ParentPaymentsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-secondary animate-spin" />
          </div>
        </DashboardShell>
      }
    >
      <ParentPaymentsContent />
    </Suspense>
  );
}
