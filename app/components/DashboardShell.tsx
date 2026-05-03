"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import NeuralGatewayBuffer from "./auth/NeuralGatewayBuffer";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          <>
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
                <div className="flex-1 pb-20 md:pb-10">
                  {children}
                </div>
              </div>
            </motion.main>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

