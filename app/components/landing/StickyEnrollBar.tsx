"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, Calendar } from "lucide-react";

export default function StickyEnrollBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show bar after scrolling past Hero (approx 800px)
      setIsVisible(window.scrollY > 800);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAdmissions = () => {
    window.dispatchEvent(new CustomEvent("open-admissions"));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-auto px-4"
        >
          <div
            className="flex items-center justify-between px-4 py-2 shadow-2xl border border-white/5 gap-4"
            style={{ background: "rgba(14,18,10,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            {/* Session */}
            <div className="flex items-center gap-2">
              <Calendar size={11} className="shrink-0" style={{ color: "var(--color-cinematic-moss)" }} />
              <span
                className="font-black uppercase tracking-[0.25em] truncate"
                style={{ fontSize: "0.55rem", color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}
              >
                Session 2025 / 2026
              </span>
            </div>

            {/* Apply button */}
            <button
              onClick={openAdmissions}
              className="group flex items-center gap-2 transition-all duration-300"
            >
              <span
                className="font-black uppercase tracking-[0.3em]"
                style={{ fontSize: "0.55rem", color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
              >
                Apply Now
              </span>
              <div
                className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)" }}
              >
                <ArrowRight size={12} />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
