"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, ArrowLeft, CreditCard, GraduationCap,
  ShieldCheck, UserPlus, Settings, AlertTriangle, Loader2,
  ChevronRight, CheckCircle2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type NotifType = "PAYMENT" | "ACADEMIC" | "WELFARE" | "ADMISSIONS" | "OPERATIONS" | "FINANCIAL";
type NotifPriority = "HIGH" | "MEDIUM" | "LOW";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  timestamp: string;
  priority: NotifPriority;
}

const TYPE_META: Record<NotifType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  PAYMENT:    { label: "Payment",    icon: <CreditCard size={16} />,   color: "text-emerald-600",    bg: "bg-emerald-50",    border: "bg-emerald-500" },
  ACADEMIC:   { label: "Academic",   icon: <GraduationCap size={16} />,color: "text-blue-600",       bg: "bg-blue-50",       border: "bg-blue-500" },
  ADMISSIONS: { label: "Admissions", icon: <UserPlus size={16} />,     color: "text-brand-accent",   bg: "bg-brand-accent/10", border: "bg-brand-accent" },
  WELFARE:    { label: "Welfare",    icon: <ShieldCheck size={16} />,  color: "text-purple-600",     bg: "bg-purple-50",     border: "bg-purple-500" },
  OPERATIONS: { label: "Operations", icon: <Settings size={16} />,     color: "text-brand-primary",  bg: "bg-brand-primary/5", border: "bg-brand-primary" },
  FINANCIAL:  { label: "Financial",  icon: <AlertTriangle size={16} />,color: "text-rose-600",       bg: "bg-rose-50",       border: "bg-rose-500" },
};

const PRIORITY_DOT: Record<NotifPriority, string> = {
  HIGH:   "bg-rose-500",
  MEDIUM: "bg-amber-400",
  LOW:    "bg-brand-primary/20",
};

type FilterTab = "ALL" | NotifType;

const SEEN_KEY = "wajina_notif_seen_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markAsSeen(ids: string[]) {
  try {
    const existing = getSeenIds();
    ids.forEach((id) => existing.add(id));
    // keep only last 500 to prevent unbounded growth
    const trimmed = Array.from(existing).slice(-500);
    localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
  } catch {}
}

function groupByDate(notifications: Notif[]): { label: string; items: Notif[] }[] {
  const now = Date.now();
  const today: Notif[] = [];
  const week: Notif[] = [];
  const older: Notif[] = [];

  for (const n of notifications) {
    const diff = now - new Date(n.timestamp).getTime();
    if (diff < 86400000) today.push(n);
    else if (diff < 7 * 86400000) week.push(n);
    else older.push(n);
  }

  const groups = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (week.length) groups.push({ label: "This Week", items: week });
  if (older.length) groups.push({ label: "Earlier", items: older });
  return groups;
}

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const seen = getSeenIds();
    setSeenIds(seen);

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        const items: Notif[] = d.notifications ?? [];
        setNotifications(items);
        // mark all current notifications as seen after a short delay
        setTimeout(() => {
          markAsSeen(items.map((n) => n.id));
          setSeenIds(getSeenIds());
        }, 1500);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (activeTab === "ALL" ? notifications : notifications.filter((n) => n.type === activeTab)),
    [notifications, activeTab]
  );

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "FINANCIAL", label: "Financial" },
    { key: "PAYMENT", label: "Payments" },
    { key: "ACADEMIC", label: "Academic" },
    { key: "ADMISSIONS", label: "Admissions" },
    { key: "OPERATIONS", label: "Operations" },
  ];

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<FilterTab, number>> = { ALL: notifications.length };
    for (const n of notifications) {
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">

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
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">PORTAL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Notifications
            </h1>
          </div>

          {!loading && notifications.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary text-white">
              <Bell size={12} />
              <span className="text-token-micro font-black">{notifications.length}</span>
            </div>
          )}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {tabs.map(({ key, label }) => {
            const count = typeCounts[key] ?? 0;
            const isActive = activeTab === key;
            if (key !== "ALL" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-token-micro font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  isActive
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-white border border-brand-primary/8 text-brand-primary/50 hover:text-brand-primary hover:border-brand-primary/20"
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    "text-[0.55rem] font-black px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-brand-primary/8 text-brand-primary/50"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="text-brand-secondary animate-spin" />
            <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/30">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center">
              <BellOff size={24} className="text-brand-primary/20" />
            </div>
            <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/30">
              No {activeTab.toLowerCase()} notifications
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <AnimatePresence>
              {groups.map((group) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em]">
                      {group.label}
                    </p>
                    <div className="flex-1 h-px bg-brand-primary/5" />
                    <span className="text-token-micro font-black text-brand-primary/20">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {group.items.map((notif, i) => (
                      <NotifCard
                        key={notif.id}
                        notif={notif}
                        index={i}
                        isNew={!seenIds.has(notif.id)}
                        onClick={() => router.push(notif.href)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function NotifCard({
  notif,
  index,
  isNew,
  onClick,
}: {
  notif: Notif;
  index: number;
  isNew: boolean;
  onClick: () => void;
}) {
  const meta = TYPE_META[notif.type];
  const timeAgo = formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true });

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all group",
        isNew
          ? "bg-white border-brand-primary/12 shadow-sm hover:shadow-md hover:border-brand-primary/20"
          : "bg-brand-blush/30 border-brand-primary/5 hover:bg-white hover:border-brand-primary/15"
      )}
    >
      {/* left accent bar */}
      <div className={cn("w-1 self-stretch rounded-full shrink-0 mt-0.5", meta.border)} />

      {/* icon */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", meta.bg, meta.color)}>
        {meta.icon}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-black text-brand-primary leading-tight", isNew && "text-brand-primary")}>{notif.title}</p>
            <span className={cn("px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest", meta.bg, meta.color)}>
              {meta.label}
            </span>
            {notif.priority === "HIGH" && (
              <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest bg-rose-50 text-rose-600">
                Urgent
              </span>
            )}
          </div>
          {isNew && (
            <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", PRIORITY_DOT[notif.priority])} />
          )}
        </div>
        <p className="text-xs text-brand-primary/60 font-medium mt-1 leading-relaxed line-clamp-2">{notif.body}</p>
        <div className="flex items-center gap-2 mt-2">
          <Clock size={11} className="text-brand-primary/30" />
          <span className="text-[0.6rem] font-black text-brand-primary/30 uppercase tracking-widest">{timeAgo}</span>
        </div>
      </div>

      {/* chevron */}
      <ChevronRight
        size={14}
        className="text-brand-primary/20 group-hover:text-brand-primary/50 group-hover:translate-x-0.5 transition-all shrink-0 mt-3"
      />
    </motion.button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 gap-6 text-center"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-brand-primary/5 border border-brand-primary/8 flex items-center justify-center">
          <Bell size={36} className="text-brand-primary/20" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-xl bg-brand-secondary flex items-center justify-center">
          <CheckCircle2 size={14} className="text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-display font-black text-brand-primary tracking-tight">All caught up</h3>
        <p className="text-xs text-brand-primary/40 font-medium mt-1 max-w-xs">
          No new notifications right now. Check back after school activities update.
        </p>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
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
      <NotificationsContent />
    </Suspense>
  );
}
