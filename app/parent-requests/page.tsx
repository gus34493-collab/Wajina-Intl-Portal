"use client";

import { useState, Suspense } from "react";
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

function ParentRequestsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<RequestType>("General Inquiry");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
      if (result.success) {
        setSubmitted(true);
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
          {user?.campus && (
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-brand-primary/8 text-brand-primary text-token-micro font-black uppercase tracking-widest shrink-0">
              {user.campus}
            </span>
          )}
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-brand-secondary/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-brand-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-brand-primary tracking-tight">Request Submitted</h2>
              <p className="text-brand-primary/50 text-sm font-medium mt-2 max-w-sm">
                Your request has been submitted and will be reviewed by the school office.
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
            {/* ── Request type selector ── */}
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
                        isSelected
                          ? "bg-brand-secondary text-white"
                          : "bg-brand-primary/8 text-brand-primary"
                      )}>
                        {icon}
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-black leading-tight",
                          isSelected ? "text-brand-secondary" : "text-brand-primary"
                        )}>
                          {type}
                        </p>
                        <p className="text-[0.6rem] text-brand-primary/40 font-medium mt-0.5 leading-snug">
                          {description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8 flex flex-col gap-5">

                {/* Title */}
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

                {/* Details */}
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

                {/* Amount — only for Fee Query */}
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

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </div>
                )}

                {/* Submit */}
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

        {/* ── Submitted requests placeholder ── */}
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-brand-primary">My Requests</h3>
            <span className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest">History</span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText size={28} className="text-brand-primary/20 mb-3" />
            <p className="text-xs font-black text-brand-primary/30 uppercase tracking-widest">
              Your submitted requests will appear here
            </p>
          </div>
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
