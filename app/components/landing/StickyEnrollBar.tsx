"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-4xl px-4 md:px-6"
        >
          <div 
            className="flex items-center justify-between px-4 md:px-8 py-3 shadow-2xl border border-white/5 gap-2 md:gap-4"
            style={{ background: "rgba(14,18,10,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            {/* Left: Info — ALWAYS visible and side-by-side */}
            <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <Calendar size={12} className="shrink-0" style={{ color: "var(--color-cinematic-moss)" }} />
                <span className="text-token-micro md:text-token-micro font-black uppercase tracking-[0.2em] md:tracking-[0.3em] truncate" style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}>
                  Session 2025/2026
                </span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-3">
                <MapPin size={12} className="shrink-0" style={{ color: "var(--color-cinematic-tang)" }} />
                <span className="text-token-micro md:text-token-micro font-black uppercase tracking-[0.2em] md:tracking-[0.3em] truncate" style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}>
                  Primary & Secondary
                </span>
              </div>
            </div>


            {/* Right: CTA */}
            <div className="flex items-center gap-3 md:gap-6">
              <button 
                onClick={openAdmissions}
                className="group flex items-center gap-3 transition-all duration-300"
              >
                <span className="text-token-micro md:text-token-micro font-black uppercase tracking-[0.3em] md:tracking-[0.4em]" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}>
                  Apply Now
                </span>
                <div 
                  className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                  style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)" }}
                >
                  <ArrowRight size={14} />
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
