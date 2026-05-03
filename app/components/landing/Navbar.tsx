"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [visible, setVisible] = useState(false);
  const [showFullName, setShowFullName] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section");
      const schoolName = document.getElementById("hero-school-name");

      if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const scrollThreshold = heroHeight * 0.4;
        setVisible(window.scrollY > scrollThreshold);
      }

      if (schoolName) {
        const rect = schoolName.getBoundingClientRect();
        // Show full name when the school name element has scrolled out of view
        setShowFullName(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed top-0 left-0 w-full z-[100] transition-all duration-500"
      style={{
        background: visible ? "rgba(14,18,10,0.88)" : "transparent",
        backdropFilter: visible ? "blur(20px)" : "none",
        WebkitBackdropFilter: visible ? "blur(20px)" : "none",
        borderBottom: visible ? "1px solid rgba(255,255,255,0.05)" : "none",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-5">
        {/* Brand — NO logo, school name fades in when scrolled past hero name */}
        <div className="flex items-center gap-3 overflow-hidden">
          <span
            className="font-black tracking-tight transition-all duration-500"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              color: "var(--color-cinematic-bone)",
              fontSize: showFullName ? "1.1rem" : "0.85rem",
              opacity: showFullName ? 1 : 0.6,
              transform: showFullName ? "translateY(0)" : "translateY(4px)",
            }}
          >
            {showFullName ? (
              <>
                Wajina International{" "}
                <span style={{ color: "var(--color-cinematic-moss)" }}>Schools</span>
              </>
            ) : (
              <span style={{ color: "var(--color-cinematic-dim)" }}>↑ Scroll to top</span>
            )}
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Our Pillars", id: "pillars" },
            { label: "The Citadel", id: "citadel" },
            { label: "Pathways", id: "pathways" },
            { label: "Admissions", id: "admissions" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-200"
              style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-bone)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-cinematic-dim)")}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-4 py-2 transition-colors duration-200"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-bone)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-cinematic-dim)")}
          >
            Portal Login
          </Link>
          <button
            className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-6 py-2 md:py-3 transition-all duration-200"
            style={{
              background: "var(--color-cinematic-moss)",
              color: "var(--color-cinematic-ink)",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-cinematic-moss-glow)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-cinematic-moss)")}
            onClick={() => window.dispatchEvent(new CustomEvent("open-admissions"))}
          >
            Apply Now
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center transition-colors"
            style={{ color: "var(--color-cinematic-bone)" }}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 w-full md:hidden border-t border-white/5 overflow-hidden"
            style={{ background: "rgba(14,18,10,0.95)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            <div className="flex flex-col">
              {[
                { label: "Our Pillars", id: "pillars" },
                { label: "The Citadel", id: "citadel" },
                { label: "Pathways", id: "pathways" },
                { label: "Admissions", id: "admissions" },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    scrollTo(link.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-8 py-6 text-left text-[11px] font-black uppercase tracking-[0.3em] border-b border-white/5 transition-colors active:bg-white/5"
                  style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}
                >
                  {link.label}
                </button>
              ))}
              
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full px-8 py-6 text-left text-[11px] font-black uppercase tracking-[0.3em] border-b border-white/5 transition-colors active:bg-white/5"
                style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
              >
                Portal Login
              </Link>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-admissions"));
                  setIsMenuOpen(false);
                }}
                className="w-full px-8 py-8 flex items-center justify-between group"
                style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)" }}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.4em]" style={{ fontFamily: "var(--font-sans)" }}>
                  Begin Application
                </span>
                <ArrowRight size={18} className="transition-transform group-active:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
