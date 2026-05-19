"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import DashboardShell from "@/app/components/DashboardShell";
import { createInstitutionalRequest } from "@/app/actions/requests";
import {
  ArrowLeft,
  Send,
  FileText,
  MessageSquare,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Clock,
  CheckCheck,
  XCircle,
  ChevronRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RequestType = "Permission Slip" | "Fee Query" | "General Inquiry" | "Complaint";

const REQUEST_TYPES: { type: RequestType; icon: React.ReactNode; description: string }[] = [
  {
    type: "Permission Slip",
    icon: <FileText size={22} />,
    description: "Excursions, early dismissal, events",
  },
  {
    type: "Fee Query",
    icon: <DollarSign size={22} />,
    description: "Payments, receipts, fee disputes",
  },
  {
    type: "General Inquiry",
    icon: <MessageSquare size={22} />,
    description: "Questions or information requests",
  },
  {
    type: "Complaint",
    icon: <AlertCircle size={22} />,
    description: "Report an issue or concern",
  },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending",  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  icon: <Clock size={14} /> },
  APPROVED: { label: "Approved", color: "text-brand-secondary", bg: "bg-brand-secondary/10 border-brand-secondary/20", icon: <CheckCheck size={14} /> },
  DENIED:   { label: "Denied",   color: "text-rose-600",   bg: "bg-rose-50 border-rose-200",   icon: <XCircle size={14} /> },
};

function ParentRequestsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [wards, setWards] = useState<any[]>([]);
  const [wardsLoading, setWardsLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState<string>("");

  const [selectedType, setSelectedType] = useState<RequestType>("General Inquiry");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const wardList = d.wards ?? [];
        setWards(wardList);
        if (wardList.length === 1) setSelectedWardId(wardList[0].id);
      })
      .catch(console.error)
      .finally(() => setWardsLoading(false));
  }, []);

  const loadRequests = () => {
    setRequestsLoading(true);
    fetch("/api/requests?limit=20")
      .then((r) => r.json())
      .then((d) => setMyRequests(d.requests ?? []))
      .catch(console.error)
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createInstitutionalRequest({
        title: `[${selectedType}] ${title.trim()}`,
        details: details.trim(),
        amount: selectedType === "Fee Query" && amount ? Number(amount) : undefined,
        studentId: selectedWardId || undefined,
      });
      if (result.success) {
        setSubmitted(true);
        loadRequests();
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setTitle("");
    setDetails("");
    setAmount("");
    setSelectedType("General Inquiry");
    setError(null);
    setSubmitted(false);
  }

  const sentRequests = myRequests.filter((r) => r.senderId === user?.id);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-brand-primary/8 bg-white shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">FAMILY PORTAL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Requests &amp; <span className="text-brand-secondary">Permissions</span>
            </h1>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-brand-secondary/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-brand-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-brand-primary tracking-tight">Request Submitted</h2>
              <p className="text-brand-primary/50 text-sm font-medium mt-2 max-w-sm">
                Your request has been submitted and routed to the appropriate staff member.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-8 py-4 rounded-2xl bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Submit Another
            </button>
          </div>
        ) : (
          <>
            {/* Ward selector */}
            {!wardsLoading && wards.length > 1 && (
              <div className="flex flex-col gap-2">
                <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                  Regarding which child?
                </p>
                <div className="relative">
                  <Users size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30 pointer-events-none" />
                  <select
                    value={selectedWardId}
                    onChange={(e) => setSelectedWardId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-brand-primary/10 bg-white pl-10 pr-10 py-3 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-secondary/40 focus:ring-2 focus:ring-brand-secondary/10"
                  >
                    <option value="">General (not ward-specific)</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} · {w.class ?? w.campus}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/30 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Request type selector */}
            <div className="flex flex-col gap-3">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Request Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {REQUEST_TYPES.map(({ type, icon, description }) => {
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all",
                        isSelected
                          ? "border-brand-secondary bg-brand-secondary/5 shadow-sm"
                          : "border-brand-primary/8 bg-white hover:border-brand-primary/20 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-brand-secondary text-white" : "bg-brand-primary/8 text-brand-primary"
                      )}>
                        {icon}
                      </div>
                      <div>
                        <p className={cn("text-xs font-black leading-tight", isSelected ? "text-brand-secondary" : "text-brand-primary")}>
                          {type}
                        </p>
                        <p className="text-[0.6rem] text-brand-primary/40 font-medium mt-0.5 leading-snug">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="req-title" className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                    Title
                  </label>
                  <input
                    id="req-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief subject of your request…"
                    required
                    className="w-full rounded-xl border border-brand-primary/8 bg-brand-primary/[0.02] px-4 py-3 text-sm font-medium text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary/40 focus:ring-2 focus:ring-brand-secondary/10 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="req-details" className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                    Details
                  </label>
                  <textarea
                    id="req-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe your request in full. Include relevant dates, names, or amounts…"
                    required
                    rows={4}
                    className="w-full rounded-xl border border-brand-primary/8 bg-brand-primary/[0.02] px-4 py-3 text-sm font-medium text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary/40 focus:ring-2 focus:ring-brand-secondary/10 transition-colors resize-none"
                  />
                </div>

                {selectedType === "Fee Query" && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="req-amount" className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                      Amount in Dispute (₦) <span className="normal-case tracking-normal text-brand-primary/30 font-medium">— optional</span>
                    </label>
                    <input
                      id="req-amount"
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full rounded-xl border border-brand-primary/8 bg-brand-primary/[0.02] px-4 py-3 text-sm font-medium text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary/40 focus:ring-2 focus:ring-brand-secondary/10 transition-colors"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !title.trim() || !details.trim()}
                  className="w-full bg-brand-primary text-white rounded-2xl font-black text-token-micro uppercase tracking-widest py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><Send size={16} /> Submit Request</>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* My Requests */}
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-primary/5 flex items-center justify-between">
            <h3 className="font-black text-brand-primary">My Requests</h3>
            <span className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest">History</span>
          </div>

          {requestsLoading ? (
            <div className="divide-y divide-brand-primary/5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/5 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-brand-primary/5 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-brand-primary/5 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <FileText size={28} className="text-brand-primary/20" />
              <p className="text-xs font-black text-brand-primary/30 uppercase tracking-widest">
                No requests submitted yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-primary/5">
              {sentRequests.map((req) => {
                const meta = STATUS_META[req.status] ?? STATUS_META.PENDING;
                return (
                  <div key={req.id} className="flex items-start gap-4 p-5 hover:bg-brand-blush/20 transition-colors">
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black shrink-0 mt-0.5", meta.bg, meta.color)}>
                      {meta.icon}
                      <span>{meta.label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-brand-primary truncate">{req.title}</p>
                      {req.feedback && (
                        <p className="text-xs font-medium text-brand-primary/50 mt-1 leading-snug line-clamp-2">
                          Response: {req.feedback}
                        </p>
                      )}
                      <p className="text-[0.6rem] font-black text-brand-primary/25 uppercase tracking-widest mt-1">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{req.level}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-brand-primary/20 shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}

export default function ParentRequestsPage() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mb-4" />
          <p className="text-token-micro font-black uppercase tracking-[0.2em] text-brand-primary/50">Loading…</p>
        </div>
      </DashboardShell>
    }>
      <ParentRequestsContent />
    </Suspense>
  );
}
