"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { FileSearch, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Priority = "IMMEDIATE" | "WEEK_1" | "WEEK_2";

interface InboxRequisition {
  id: string;
  refNo: string;
  department: string;
  campus: string;
  priority: Priority;
  status: string;
  createdAt: string;
  amountTotal?: number | null;
  initiator: { name: string };
}

type InboxTab = "AWAITING_ME" | "ALL_AT_STAGE" | "HISTORY";

const PRIORITY_PILL: Record<Priority, string> = {
  IMMEDIATE: "bg-brand-error/10 text-brand-error",
  WEEK_1: "bg-yellow-100 text-yellow-700",
  WEEK_2: "bg-green-100 text-green-700",
};

export default function RequisitionInboxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userRole: string = user?.role ?? "";
  const maskCurrency =
    userRole === "HEAD_TEACHER" || userRole === "ASST_HEAD_TEACHER";

  const [activeTab, setActiveTab] = useState<InboxTab>("AWAITING_ME");
  const [requests, setRequests] = useState<InboxRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [awaitingCount, setAwaitingCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/requisitions/count");
        if (res.ok) {
          const data = await res.json();
          const pending =
            (data.SUBMITTED ?? 0) + (data.IN_REVIEW ?? 0);
          setAwaitingCount(pending);
        }
      } catch {
        // non-fatal
      }
    }
    fetchCount();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        let url = "";
        if (activeTab === "AWAITING_ME" || activeTab === "ALL_AT_STAGE") {
          url = "/api/requisitions?status=SUBMITTED,IN_REVIEW";
        } else {
          const res1 = await fetch(
            "/api/requisitions?status=APPROVED&limit=20"
          );
          const res2 = await fetch(
            "/api/requisitions?status=REJECTED&limit=20"
          );
          const res3 = await fetch(
            "/api/requisitions?status=FULFILLED&limit=20"
          );
          const [d1, d2, d3] = await Promise.all([
            res1.ok ? res1.json() : { requisitions: [] },
            res2.ok ? res2.json() : { requisitions: [] },
            res3.ok ? res3.json() : { requisitions: [] },
          ]);
          const combined: InboxRequisition[] = [
            ...(d1.requisitions ?? d1.requests ?? []),
            ...(d2.requisitions ?? d2.requests ?? []),
            ...(d3.requisitions ?? d3.requests ?? []),
          ].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRequests(combined);
          setLoading(false);
          return;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requisitions ?? data.requests ?? []);
        } else {
          toast.error("Failed to load inbox");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [activeTab]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
            Approval <span className="text-brand-secondary">Inbox</span>
          </h1>
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mt-1">
            Requisitions awaiting your review and action
          </p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-3 flex items-center gap-1 flex-wrap">
          <InboxTabBtn
            label="Awaiting Me"
            count={awaitingCount}
            active={activeTab === "AWAITING_ME"}
            onClick={() => setActiveTab("AWAITING_ME")}
          />
          <InboxTabBtn
            label="All at My Stage"
            active={activeTab === "ALL_AT_STAGE"}
            onClick={() => setActiveTab("ALL_AT_STAGE")}
          />
          <InboxTabBtn
            label="History"
            active={activeTab === "HISTORY"}
            onClick={() => setActiveTab("HISTORY")}
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6 flex flex-col gap-3">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}

          {!loading && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <FileSearch size={36} className="text-brand-primary/10" />
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                Nothing awaiting your review
              </p>
            </div>
          )}

          {!loading &&
            requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl hover:bg-brand-primary/[0.03] border border-transparent hover:border-brand-primary/8 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-brand-primary text-sm tracking-tight">
                      {req.refNo}
                    </span>
                    <span className="text-token-micro font-black text-brand-primary/50 uppercase tracking-widest">
                      {req.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest bg-brand-primary/8 text-brand-primary/60">
                      {req.campus}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
                        PRIORITY_PILL[req.priority as Priority] ??
                          "bg-brand-primary/8 text-brand-primary/60"
                      )}
                    >
                      {req.priority?.replace("_", " ")}
                    </span>
                    <span className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                      {req.initiator?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {!maskCurrency && req.amountTotal != null && (
                    <p className="font-display font-black text-brand-primary tabular-nums text-lg">
                      ₦{req.amountTotal.toLocaleString("en-NG")}
                    </p>
                  )}
                  <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
                    {new Date(req.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    onClick={() => router.push(`/requisitions/${req.id}`)}
                    className="bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest px-5 py-2.5 rounded-2xl hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    Review
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function InboxTabBtn({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 rounded-2xl text-token-micro font-black uppercase tracking-widest transition-all flex items-center gap-2",
        active
          ? "bg-brand-primary text-white shadow-lg"
          : "text-brand-primary/50 hover:bg-brand-primary/5"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "px-2 py-0.5 rounded-lg text-token-micro leading-none",
            active
              ? "bg-white/15 text-white"
              : "bg-brand-primary/8 text-brand-primary/50"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl">
      <div className="flex gap-4">
        <div className="animate-pulse h-3 bg-brand-primary/10 rounded w-28" />
        <div className="animate-pulse h-3 bg-brand-primary/10 rounded w-40" />
      </div>
      <div className="flex gap-2">
        <div className="animate-pulse h-3 bg-brand-primary/10 rounded w-20" />
        <div className="animate-pulse h-3 bg-brand-primary/10 rounded w-20" />
      </div>
    </div>
  );
}
