"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Loader2 } from "lucide-react";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        router.push("/portal?error=Session expired. Please log in again.");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar - Handles its own internal collapse state */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center h-screen"
          >
            <Loader2 className="w-10 h-10 text-brand-moonstone animate-spin" />
          </motion.div>
        ) : (
          <motion.main
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 min-w-0 flex flex-col transition-all duration-300 ml-0 lg:ml-[280px]"
            // Note: The margin will need to be synced with the Sidebar's expanded width
            // For Batch 1, we assume fixed sidebar width on desktop for simplicity
          >
            <div className="container mx-auto max-w-7xl px-4 md:px-10 flex flex-col min-h-screen gap-6">
              <Header user={user} />
              <div className="flex-1 pb-10">
                {children}
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
