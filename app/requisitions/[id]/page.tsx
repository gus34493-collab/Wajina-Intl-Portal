"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { canActOnStage } from "@/lib/requisitionAccess";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Priority = "IMMEDIATE" | "WEEK_1" | "WEEK_2";
type RequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED";

interface ApprovalEntry {
  stage: string;
  approver?: { name: string } | null;
  actedAt?: string | null;
  action?: "APPROVED" | "REJECTED" | "RETURNED" | null;
  note?: string | null;
}

interface RequisitionItem {
  id: string;
  description: string;
  qty: number;
  unitCost?: number | null;
  totalCost?: number | null;
}

interface Requisition {
  id: string;
  refNo: string;
  department: string;
  campus: string;
  priority: Priority;
  status: RequisitionStatus;
  currentStage: string;
  justification: string;
  createdAt: string;
  amountTotal?: number | null;
  amountInWords?: string | null;
  initiator: { id: string; name: string };
  items: RequisitionItem[];
  approvals: ApprovalEntry[];
}

const PIPELINE_STAGES = [
  { key: "INITIATOR", label: "Initiator" },
  { key: "HEAD_TEACHER", label: "Head Teacher" },
  { key: "ACCOUNTANT", label: "Accountant" },
  { key: "HR", label: "HR" },
  { key: "DIRECTOR", label: "Director" },
] as const;

const PRIORITY_PILL: Record<Priority, string> = {
  IMMEDIATE: "bg-brand-error/10 text-brand-error",
  WEEK_1: "bg-yellow-100 text-yellow-700",
  WEEK_2: "bg-green-100 text-green-700",
};

const STATUS_PILL: Record<RequisitionStatus, string> = {
  DRAFT: "bg-brand-primary/8 text-brand-primary/60",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-brand-error/10 text-brand-error",
  FULFILLED: "bg-brand-secondary/10 text-brand-secondary",
};

const STATUS_LABELS: Record<RequisitionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
};

export default function RequisitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [req, setReq] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const userRole: string = user?.role ?? "";
  const userId: string = user?.id ?? "";

  const fetchReq = useCallback(async () => {
    try {
      const res = await fetch(`/api/requisitions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReq(data.requisition ?? data);
      } else {
        toast.error("Failed to load requisition");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReq();
  }, [fetchReq]);

  async function doAction(
    endpoint: string,
    method = "POST",
    body?: object
  ) {
    setActionLoading(endpoint);
    try {
      const res = await fetch(`/api/requisitions/${id}/${endpoint}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Action failed");
        return;
      }
      toast.success("Done");
      setRejectOpen(false);
      setRejectReason("");
      await fetchReq();
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  const maskCurrency =
    userRole === "HEAD_TEACHER" || userRole === "ASST_HEAD_TEACHER";
  const isInitiator = req?.initiator?.id === userId;
  const canAct =
    req ? canActOnStage(userRole, req.currentStage) : false;
  const isBursaryRole =
    userRole === "BURSAR" || userRole === "ACCOUNTS_OFFICER";

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col gap-8">
          <div className="animate-pulse h-8 bg-brand-primary/10 rounded w-48" />
          <div className="animate-pulse h-40 bg-brand-primary/10 rounded-[1.5rem]" />
          <div className="animate-pulse h-64 bg-brand-primary/10 rounded-[1.5rem]" />
        </div>
      </DashboardShell>
    );
  }

  if (!req) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
            Requisition not found
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-1">
              Requisition
            </p>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              {req.refNo}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
                  STATUS_PILL[req.status]
                )}
              >
                {STATUS_LABELS[req.status]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
                  PRIORITY_PILL[req.priority]
                )}
              >
                {req.priority.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start flex-wrap">
            {isInitiator && req.status === "DRAFT" && (
              <button
                disabled={actionLoading === "submit"}
                onClick={() => doAction("submit")}
                className="bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest px-5 py-2.5 rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowRight size={14} />
                {actionLoading === "submit" ? "Submitting…" : "Submit for Approval"}
              </button>
            )}
            {isBursaryRole && req.status === "APPROVED" && (
              <button
                disabled={actionLoading === "fulfill"}
                onClick={() => doAction("fulfill")}
                className="bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest px-5 py-2.5 rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {actionLoading === "fulfill" ? "Processing…" : "Mark as Fulfilled"}
              </button>
            )}
          </div>
        </div>

        {/* Meta card */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetaField label="Department" value={req.department} />
            <MetaField label="Campus" value={req.campus} />
            <MetaField label="Initiator" value={req.initiator?.name ?? "—"} />
            <MetaField
              label="Date Created"
              value={new Date(req.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </div>
          {req.justification && (
            <div className="mt-6 pt-6 border-t border-brand-primary/8">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-2">
                Justification
              </p>
              <p className="text-sm font-bold text-brand-primary/80 leading-relaxed">
                {req.justification}
              </p>
            </div>
          )}
        </div>

        {/* Approval timeline */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6">
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-6">
            Approval Timeline
          </p>
          <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-0 relative">
            {PIPELINE_STAGES.map((stage, idx) => {
              const approval = req.approvals?.find(
                (a) => a.stage === stage.key
              );
              const isCurrent =
                req.currentStage === stage.key &&
                req.status !== "APPROVED" &&
                req.status !== "REJECTED" &&
                req.status !== "FULFILLED";
              const isApproved =
                approval?.action === "APPROVED" ||
                (stage.key === "INITIATOR" &&
                  req.status !== "DRAFT");
              const isRejected =
                approval?.action === "REJECTED" ||
                approval?.action === "RETURNED";

              return (
                <div
                  key={stage.key}
                  className="flex md:flex-col items-start md:items-center flex-1 relative gap-4 md:gap-2 pb-6 md:pb-0"
                >
                  {/* Connector line */}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-1/2 w-full h-px bg-brand-primary/10" />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 shrink-0">
                    {isApproved ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-green-600" />
                      </div>
                    ) : isRejected ? (
                      <div className="w-10 h-10 rounded-full bg-brand-error/10 flex items-center justify-center">
                        <XCircle size={20} className="text-brand-error" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-yellow-300/40 animate-ping" />
                        <Clock size={20} className="text-yellow-700 relative z-10" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-primary/8 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-brand-primary/20" />
                      </div>
                    )}
                  </div>
                  {/* Label block */}
                  <div className="flex flex-col md:items-center gap-0.5 md:mt-2">
                    <p className="text-token-micro font-black text-brand-primary uppercase tracking-widest">
                      {stage.label}
                    </p>
                    {isApproved && approval?.approver?.name && (
                      <p className="text-token-micro font-black text-green-600 uppercase tracking-widest">
                        {approval.approver.name}
                      </p>
                    )}
                    {isApproved && stage.key === "INITIATOR" && (
                      <p className="text-token-micro font-black text-green-600 uppercase tracking-widest">
                        {req.initiator?.name}
                      </p>
                    )}
                    {isApproved && approval?.actedAt && (
                      <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                        {new Date(approval.actedAt).toLocaleDateString("en-NG")}
                      </p>
                    )}
                    {isRejected && (
                      <p className="text-token-micro font-black text-brand-error uppercase tracking-widest">
                        {approval?.action === "RETURNED" ? "Returned" : "Rejected"}
                      </p>
                    )}
                    {isCurrent && (
                      <p className="text-token-micro font-black text-yellow-700 uppercase tracking-widest">
                        Awaiting action
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6">
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-4">
            Line Items
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-primary/8">
                  {[
                    "S/N",
                    "Description",
                    "Qty",
                    ...(!maskCurrency ? ["Unit Cost (₦)", "Total (₦)"] : []),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 pr-4 text-token-micro font-black text-brand-primary/40 uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.items.map((item, i) => (
                  <tr
                    key={item.id}
                    className="border-b border-brand-primary/5"
                  >
                    <td className="py-3.5 pr-4 text-brand-primary/40 font-black text-token-micro">
                      {i + 1}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-brand-primary">
                      {item.description}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-brand-primary">
                      {item.qty}
                    </td>
                    {!maskCurrency && (
                      <>
                        <td className="py-3.5 pr-4 tabular-nums font-bold text-brand-primary">
                          {item.unitCost != null
                            ? `₦${item.unitCost.toLocaleString("en-NG")}`
                            : "—"}
                        </td>
                        <td className="py-3.5 tabular-nums font-black text-brand-primary">
                          {item.totalCost != null
                            ? `₦${item.totalCost.toLocaleString("en-NG")}`
                            : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!maskCurrency && req.amountTotal != null && (
            <div className="flex justify-end mt-4 pt-4 border-t border-brand-primary/8">
              <div className="flex flex-col items-end gap-1">
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                  Total
                </p>
                <p className="text-3xl font-display font-black text-brand-primary tracking-tight tabular-nums">
                  ₦{req.amountTotal.toLocaleString("en-NG")}
                </p>
                {req.amountInWords && (
                  <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest max-w-xs text-right">
                    {req.amountInWords}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Approver action panel */}
        {canAct && ["IN_REVIEW", "SUBMITTED"].includes(req.status) && (
          <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6 flex flex-col gap-4">
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
              Your Action
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                disabled={actionLoading === "approve"}
                onClick={() => doAction("approve")}
                className="bg-green-600 text-white font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {actionLoading === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => doAction("return")}
                className="bg-white border border-brand-primary/8 text-brand-primary font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:border-brand-secondary/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === "return" ? "Returning…" : "Return to Initiator"}
              </button>
              <button
                disabled={!!actionLoading}
                onClick={() => setRejectOpen((o) => !o)}
                className="bg-brand-error/10 text-brand-error font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:bg-brand-error/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle size={15} />
                Reject
              </button>
            </div>

            {rejectOpen && (
              <div className="flex flex-col gap-3 mt-2 p-4 rounded-2xl bg-brand-error/5 border border-brand-error/15">
                <label className="text-token-micro font-black text-brand-error uppercase tracking-widest">
                  Rejection Reason (required)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State the reason for rejection…"
                  className="bg-white border border-brand-error/20 rounded-xl px-4 py-3 text-sm font-bold text-brand-primary placeholder:text-brand-primary/25 focus:outline-none focus:border-brand-error/50 transition-colors resize-none"
                />
                <div className="flex gap-3">
                  <button
                    disabled={
                      !rejectReason.trim() || actionLoading === "reject"
                    }
                    onClick={() =>
                      doAction("reject", "POST", { reason: rejectReason })
                    }
                    className="bg-brand-error text-white font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {actionLoading === "reject" ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => {
                      setRejectOpen(false);
                      setRejectReason("");
                    }}
                    className="bg-white border border-brand-primary/8 text-brand-primary font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:border-brand-secondary/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
        {label}
      </p>
      <p className="font-black text-brand-primary text-sm">{value}</p>
    </div>
  );
}
