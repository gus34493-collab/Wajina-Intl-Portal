"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "./AuthContext";
import { AcademicProvider, useAcademic } from "./AcademicContext";
import { cn } from "@/lib/utils";
import NeuralGatewayBuffer from "./auth/NeuralGatewayBuffer";

const TERM_LABELS: Record<string, string> = { FIRST: "First", SECOND: "Second", THIRD: "Third" };

function SessionContextPill() {
  const { activeSession, activeTerm } = useAcademic();

  if (!activeSession) return null;

  const termLabel = TERM_LABELS[activeTerm?.name ?? ""] ?? activeTerm?.name ?? "";
  const label = activeTerm
    ? `${activeSession.name} · ${termLabel} Term`
    : activeSession.name;

  return (
    <div className="hidden md:flex items-center gap-2 -mt-4 mb-1 self-start">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
      <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.3em] select-none">
        {label}
      </span>
    </div>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Only redirect if we are strictly NOT on the portal page and auth has finished loading
    if (!loading && !user) {
      const isPortal = window.location.pathname.includes("/portal");
      if (!isPortal) {
        router.replace("/portal?error=Session expired. Please log in again.");
      }
    }
  }, [user, loading, router]);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wajina_sidebar_collapsed") === "true";
    setIsCollapsed(saved);
  }, []);

  const handleToggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("wajina_sidebar_collapsed", String(newVal));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence mode="wait">
        {loading || !user ? (
          <NeuralGatewayBuffer key="global-buffer" />
        ) : (
          <AcademicProvider>
            {/* Sidebar - Only rendered once loading is complete */}
            <Sidebar
              user={user}
              loading={loading}
              collapsed={isCollapsed}
              onToggle={handleToggleCollapse}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
            />

            {/* Main Content Area */}
            <motion.main
              id="main-content"
              tabIndex={-1}
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex-1 min-w-0 flex flex-col transition-all duration-300 focus:outline-none overflow-x-hidden w-full",
                isCollapsed ? "ml-0 lg:ml-[80px]" : "ml-0 lg:ml-[280px]"
              )}
            >
              <div className="container mx-auto px-4 md:px-10 flex flex-col min-h-screen gap-6">
                <Header
                  user={user}
                  loading={loading}
                  onUserUpdate={updateUser}
                  onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
                />
                <SessionContextPill />
                {/* Temp-password banner */}
                {user?.mustChangePassword && !bannerDismissed && (() => {
                  const expiresAt = user.passwordExpiresAt ? new Date(user.passwordExpiresAt) : null;
                  const daysLeft = expiresAt
                    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
                    : null;
                  const urgent = daysLeft !== null && daysLeft <= 1;
                  return (
                    <div className={`rounded-2xl border px-5 py-3.5 flex items-center justify-between gap-4 -mt-2 ${urgent ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                      <div className="flex items-center gap-3">
                        <ShieldAlert className={`w-4 h-4 shrink-0 ${urgent ? "text-red-500" : "text-amber-600"}`} />
                        <p className={`text-xs font-semibold ${urgent ? "text-red-800" : "text-amber-800"}`}>
                          {urgent
                            ? <><strong>Your temporary password expires today.</strong> Change it now or your account will be locked. </>
                            : <>You're signed in with a <strong>temporary password</strong>{daysLeft !== null ? ` — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : ""}. </>
                          }
                          <Link href="/portal/setup" className="underline underline-offset-2 font-black hover:opacity-80">
                            Set a permanent password →
                          </Link>
                        </p>
                      </div>
                      <button
                        onClick={() => setBannerDismissed(true)}
                        className={`shrink-0 ${urgent ? "text-red-400 hover:text-red-600" : "text-amber-500 hover:text-amber-700"}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })()}

                <div className="flex-1 pb-20 md:pb-10">
                  {children}
                </div>
              </div>
            </motion.main>
          </AcademicProvider>
        )}
      </AnimatePresence>
    </div>
  );
}

