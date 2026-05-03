"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Camera, Menu, X } from "lucide-react";
import { NAVIGATION_REGISTRY } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import StaffChoiceModal from "./StaffChoiceModal";

export default function Sidebar({
  user,
  loading,
  collapsed,
  onToggle,
  isMobileOpen,
  setIsMobileOpen
}: {
  user: any,
  loading: boolean,
  collapsed?: boolean,
  onToggle?: () => void,
  isMobileOpen?: boolean,
  setIsMobileOpen?: (open: boolean) => void
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      sessionStorage.clear();
      // Force a hard reload to completely wipe React memory (AuthContext) 
      // and ensure the browser reads the cleared cookies.
      window.location.href = "/portal";
    } catch (err) {
      window.location.href = "/portal";
    }
  };

  const roleKey = loading ? null : (user?.role || "PARENT").toUpperCase();
  const config = roleKey ? (NAVIGATION_REGISTRY[roleKey] || NAVIGATION_REGISTRY["PARENT"]) : null;

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen?.(false)}
            className="lg:hidden fixed inset-0 bg-brand-primary/60 backdrop-blur-md z-[100]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: collapsed ? 80 : 280,
          left: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        className={cn(
          "fixed top-0 bottom-0 z-[105] bg-brand-primary border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "items-center" : "items-start"
        )}
      >
        {/* Header Slab */}
        <div className={cn(
          "h-24 w-full flex items-center px-6 mb-8 border-b border-white/5",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 shrink-0"
            >
              <div className="bg-white p-1 rounded-xl shadow-inner">
                <Image
                  src="/images/logo-no-bg.png"
                  alt="Wajina International Schools"
                  width={32}
                  height={32}
                  priority
                  className="object-contain"
                  style={{ width: "var(--space-8)", height: "var(--space-8)" }}
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-token-caption font-display font-black text-white uppercase tracking-[0.3em] leading-none">
                  WAJINA
                </h1>
                <span className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.4em] mt-1 opacity-80">
                  {user?.role === "DIRECTOR" ? "GLOBAL INSTITUTION" : `${user?.campus || "PRIMARY"} CAMPUS`}
                </span>
              </div>
            </motion.div>
          )}

          <button
            onClick={onToggle}
            className="hidden lg:grid place-items-center w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        </div>

        {/* Navigation Grid */}
        <nav className="flex-1 w-full overflow-y-auto overflow-x-hidden px-3 space-y-8 no-scrollbar">
          {loading || !config ? (
            <div className="space-y-8 px-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            config.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                {!collapsed && (
                  <h3 className="px-4 text-token-micro font-black text-white/40 uppercase tracking-[0.4em] mb-4">
                    {section.title}
                  </h3>
                )}

                <ul className="space-y-1">
                  {section.items.map((item, iIdx) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={iIdx}>
                        <Link
                          href={item.actionId ? "#" : item.href}
                          onClick={(e) => {
                            if (item.actionId) {
                              e.preventDefault();
                              setActiveActionModal(item.actionId);
                            }
                          }}
                          className={cn(
                            "group flex items-center gap-4 py-3.5 transition-all relative overflow-hidden rounded-xl",
                            collapsed ? "justify-center px-0 w-12 mx-auto" : "px-4",
                            isActive
                              ? "bg-brand-secondary/15 text-white shadow-lg shadow-brand-secondary/10"
                              : "text-white/40 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {/* Active Slab Indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="active-nav-slab"
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-brand-secondary rounded-full shadow-[0_0_8px_rgba(135,214,141,0.5)]"
                            />
                          )}

                          <i className={cn(
                            "fa-solid",
                            item.icon,
                            "text-base transition-transform group-hover:scale-110",
                            isActive ? "text-brand-secondary" : "text-white/30 group-hover:text-white"
                          )} style={{ width: 24, textAlign: 'center' }} />

                          {!collapsed && (
                            <span className={cn(
                              "text-token-caption font-black uppercase tracking-widest",
                              isActive ? "text-white" : "text-white/60 group-hover:text-white"
                            )}>
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        {/* Footer Slab */}
        <div className={cn(
          "w-full border-t border-white/5 p-5 bg-black/20 backdrop-blur-xl",
          collapsed ? "items-center" : "items-start"
        )}>
          <div className="flex items-center gap-4 w-full relative">
            <div className="relative group w-12 h-12 shrink-0">
              <img
                src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=F1DEDE&color=16302B&bold=true`}
                alt="Profile"
                className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg"
              />
              <div className="absolute inset-0 bg-brand-primary/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera size={14} className="text-white" />
              </div>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-token-caption font-black text-white truncate uppercase tracking-tight leading-none mb-1">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                  <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.2em] opacity-80">
                    {user?.role}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={cn(
                "p-2 text-white/40 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all",
                collapsed && "mx-auto"
              )}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Action Modals */}
      <StaffChoiceModal
        isOpen={activeActionModal === 'staff-management'}
        onClose={() => setActiveActionModal(null)}
      />
    </>
  );
}

