"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  Users,
  Percent,
  Wallet,
  ChevronRight,
  BookOpen,
  MailCheck,
  Bell,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import PaymentModal from "@/app/components/PaymentModal";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/components/AuthContext";

function ParentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [wards, setWards] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "cancelled") toast.error("Payment was cancelled.");
    if (paymentStatus === "failed") toast.error("Payment verification failed.");
    if (paymentStatus === "error") toast.error("An error occurred during payment.");
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, complaintsRes] = await Promise.all([
          fetch("/api/parent/dashboard"),
          fetch("/api/complaints"),
        ]);
        const dashData = await dashRes.json();
        setWards(dashData.wards || []);
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData || []);
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const avgAttendance = wards.length
    ? (wards.reduce((acc, w) => acc + (w.attendance?.rate || 0), 0) / wards.length).toFixed(1)
    : "0";
  const pendingFeesCount = wards.filter(w => !w.payment || w.payment.status !== "CONFIRMED").length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">FAMILY PORTAL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              My <span className="text-brand-secondary">Family</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/notifications")} aria-label="View notifications" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors md:hidden">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              {user?.name
                ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                : "P"}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <Users size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">My Children</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{wards.length}</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              Linked to this account
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/8 flex items-center justify-center shrink-0">
                <Percent size={20} className="text-brand-primary" />
              </div>
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Attendance Rate</p>
            </div>
            <p className="text-5xl font-display font-black text-brand-primary leading-none tracking-tighter">{avgAttendance}%</p>
            <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-token-micro font-black uppercase tracking-widest">
              Term Average
            </span>
          </div>

          <div className={cn(
            "rounded-3xl shadow-xl p-6 flex flex-col gap-4",
            pendingFeesCount === 0 ? "bg-brand-primary shadow-brand-primary/20" : "bg-white border border-brand-error/20"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", pendingFeesCount === 0 ? "bg-white/10" : "bg-brand-error/10")}>
                <Wallet size={20} className={pendingFeesCount === 0 ? "text-white" : "text-brand-error"} />
              </div>
              <p className={cn("text-token-micro font-black uppercase tracking-widest", pendingFeesCount === 0 ? "text-white/50" : "text-brand-primary/40")}>
                Fee Status
              </p>
            </div>
            <p className={cn("text-3xl font-display font-black leading-none tracking-tighter", pendingFeesCount === 0 ? "text-white" : "text-brand-error")}>
              {pendingFeesCount === 0 ? "ALL PAID" : "ACTION NEEDED"}
            </p>
            <span className={cn(
              "inline-flex self-start items-center px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest",
              pendingFeesCount === 0 ? "bg-white/10 text-white" : "bg-brand-error/10 text-brand-error"
            )}>
              {pendingFeesCount === 0 ? "All paid up" : `${pendingFeesCount} unpaid fee(s)`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Children Overview */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-xl font-display font-black text-brand-primary">Family Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wards.map((ward, idx) => (
                <WardCard
                  key={ward.id}
                  ward={ward}
                  index={idx}
                  onPaymentClick={(w) => { setSelectedWard(w); setIsPaymentModalOpen(true); }}
                />
              ))}
              {wards.length === 0 && !loading && (
                <div className="col-span-2 bg-white rounded-3xl border-2 border-dashed border-brand-primary/10 flex flex-col items-center justify-center py-16">
                  <p className="font-bold text-brand-primary/50 text-sm">No children linked to this account.</p>
                  <p className="text-xs text-brand-primary/30 mt-1">Please contact the school office.</p>
                </div>
              )}
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <h4 className="font-black text-brand-primary">Recent Support Tickets</h4>
                <button
                  onClick={() => router.push("/parent-requests")}
                  className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline"
                >
                  New Request
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {complaints.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-brand-blush/40 border border-brand-primary/5 group hover:border-brand-primary/20 transition-all">
                    <div className={cn("w-1 rounded-full shrink-0", c.status === "RESOLVED" ? "bg-brand-secondary" : "bg-brand-accent")} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-brand-primary">{c.subject}</p>
                        <span className="text-token-micro font-black text-brand-primary/40">{c.status}</span>
                      </div>
                      <p className="text-xs text-brand-primary/50 mt-1 line-clamp-1">{c.message}</p>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-center text-xs text-brand-primary/30 py-6 font-black uppercase tracking-widest">No support tickets yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Modules */}
          <div className="flex flex-col gap-6">
            {/* Quick Links */}
            <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6">
              <h4 className="font-black text-brand-primary mb-5">Quick Access</h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Academic Records", href: "/parent-academic-records" },
                  { label: "Fee Payments", href: "/parent-payments" },
                  { label: "Attendance History", href: "/parent-attendance" },
                  { label: "Contact School", href: "/parent-requests" },
                ].map((link, i) => (
                  <a key={i} href={link.href} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all group no-underline">
                    <p className="text-sm font-bold text-brand-primary group-hover:text-brand-secondary transition-colors">{link.label}</p>
                    <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* School Announcements */}
            <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 text-white">
              <h4 className="font-black text-brand-secondary mb-4 text-xs uppercase tracking-widest">School Announcements</h4>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="font-bold text-sm">Inter-House Sports Day</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">Friday, Nov 1st. Students should wear their respective house colors.</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-bold text-sm">PTA General Meeting</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">Agenda: 2026 Vision & Expansion. Venue: Main Auditorium.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        ward={selectedWard}
      />
    </DashboardShell>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mb-4" />
          <p className="text-token-micro font-black uppercase tracking-[0.2em] text-brand-primary/50">Loading your dashboard...</p>
        </div>
      </DashboardShell>
    }>
      <ParentDashboardContent />
    </Suspense>
  );
}

function WardCard({ ward, index, onPaymentClick }: { ward: any; index: number; onPaymentClick: (ward: any) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary text-white grid place-items-center font-black text-xl shadow-lg shrink-0">
          {ward.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-brand-primary text-base truncate uppercase tracking-tight leading-none">{ward.name}</h4>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-token-micro font-black uppercase tracking-widest",
              ward.campus === "SECONDARY" ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-secondary/10 text-brand-secondary"
            )}>
              {ward.campus}
            </span>
            <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
              {ward.class ?? "Pre-enrollment"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5">
          <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">GPA</p>
          <p className="text-xl font-display font-black text-brand-primary mt-1">
            {ward.averageGrade != null ? ward.averageGrade.toFixed(2) : "—"}
          </p>
        </div>
        <div className="p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5">
          <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">Attendance</p>
          <p className="text-xl font-display font-black text-brand-primary mt-1">
            {ward.attendance?.rate != null ? `${ward.attendance.rate}%` : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button className="w-full bg-brand-primary text-white font-black text-token-micro py-3.5 rounded-xl uppercase tracking-widest hover:opacity-90 transition-all">
          View Academic Records
        </button>
        <button
          onClick={() => onPaymentClick(ward)}
          className="w-full bg-brand-primary/5 text-brand-primary border border-brand-primary/10 font-black text-token-micro py-3.5 rounded-xl uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
        >
          Pay Fees
        </button>
      </div>
    </motion.div>
  );
}
