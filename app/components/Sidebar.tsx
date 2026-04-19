"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Camera, Menu, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NAVIGATION_REGISTRY } from "@/lib/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ user }: { user: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wajina_sidebar_collapsed") === "true";
    setCollapsed(saved);
  }, []);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("wajina_sidebar_collapsed", String(newVal));
  };

  const handleLogout = async () => {
    // Clear cookie via server or just redirect (middleware handles cleanup)
    localStorage.clear();
    sessionStorage.clear();
    router.push("/portal");
  };

  const roleKey = (user?.role || "PARENT").toUpperCase();
  const config = NAVIGATION_REGISTRY[roleKey] || NAVIGATION_REGISTRY["PARENT"];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[110] p-2 bg-white rounded-lg shadow-md border border-black/5"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ 
          width: collapsed ? 80 : 280,
          left: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        className={cn(
          "fixed top-0 bottom-0 z-[105] bg-brand-bg border-r border-black/5 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "items-center" : "items-start"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-20 w-full flex items-center px-6 mb-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <img src="/images/Logo.png" alt="Logo" className="h-8 rounded-lg" />
              <h1 className="text-sm font-display font-black text-brand-gunmetal uppercase tracking-wider">
                Wajina Intl
              </h1>
            </motion.div>
          )}
          
          <button
            onClick={toggleCollapse}
            className="hidden lg:grid place-items-center w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 text-brand-gunmetal transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full overflow-y-auto overflow-x-hidden px-3 space-y-6 scrollbar-hide">
          {config.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <h3 className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 opacity-60">
                  {section.title}
                </h3>
              )}
              
              <ul className="space-y-1">
                {section.items.map((item, iIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={iIdx}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-4 rounded-xl py-3 transition-all relative overflow-hidden",
                          collapsed ? "justify-center px-0 w-12 mx-auto" : "px-4",
                          isActive 
                            ? "bg-brand-moonstone/5 text-brand-gunmetal" 
                            : "text-text-secondary hover:bg-black/5"
                        )}
                        title={collapsed ? item.label : ""}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div 
                            layoutId="active-indicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-brand-saffron" 
                          />
                        )}
                        
                        <i className={cn(
                          "fa-solid", 
                          item.icon,
                          "text-lg transition-transform group-hover:scale-110",
                          isActive ? "text-brand-gunmetal" : "text-text-muted group-hover:text-brand-moonstone"
                        )} style={{ width: 24, textAlign: 'center' }} />
                        
                        {!collapsed && (
                          <span className={cn(
                            "text-sm font-bold truncate",
                            isActive ? "text-brand-gunmetal" : "text-text-secondary"
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
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className={cn(
          "w-full border-t border-black/5 p-4 bg-black/5",
          collapsed ? "items-center" : "items-start"
        )}>
          <div className="flex items-center gap-4 w-full relative">
            <div className="relative group w-10 h-10 shrink-0">
              <img
                src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=C3E7F1&color=20373B&bold=true`}
                alt="Profile"
                className="w-full h-full object-cover rounded-xl border-2 border-white shadow-sm"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera size={14} className="text-white" />
              </div>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-brand-gunmetal truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-2 text-text-muted hover:text-brand-error hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
