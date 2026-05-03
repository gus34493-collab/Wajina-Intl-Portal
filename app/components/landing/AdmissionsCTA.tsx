"use client";

import { motion } from "framer-motion";

const CALENDAR = [
  { phase: "Application Opens", date: "1 Sept 2025", open: true },
  { phase: "Entrance Assessment", date: "15 Oct 2025", open: false },
  { phase: "Interview (Shortlisted)", date: "3 Nov 2025", open: false },
  { phase: "Offer Letters Issued", date: "20 Nov 2025", open: false },
  { phase: "Acceptance Deadline", date: "10 Dec 2025", open: false },
  { phase: "New Term Begins", date: "12 Jan 2026", open: false },
];

export default function AdmissionsCTA() {
  return (
    <section
      id="admissions"
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "var(--color-cinematic-cream)" }}
    >
      {/* Vine SVG decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-[0.07]">
        <svg
          viewBox="0 0 600 900"
          fill="none"
          className="w-full h-full"
          preserveAspectRatio="xMaxYMid slice"
        >
          <path
            d="M580 20C420 120 520 280 300 340C80 400 200 560 10 680"
            stroke="#3F4739"
            strokeWidth="1.5"
          />
          <path
            d="M620 120C460 220 540 380 340 440C140 500 240 660 40 780"
            stroke="#3F4739"
            strokeWidth="1"
          />
          <circle cx="300" cy="340" r="5" fill="#6AB547" />
          <circle cx="340" cy="440" r="4" fill="#6AB547" />
          <circle cx="200" cy="530" r="6" fill="#6AB547" />
          <circle cx="420" cy="260" r="3" fill="#6AB547" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        {/* Left: Headline + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <div className="space-y-5">
            <span
              className="text-[10px] font-black uppercase tracking-[0.45em]"
              style={{ color: "#3E6E2A", fontFamily: "var(--font-sans)" }}
            >
              Plate VI · Admissions 2025–2026
            </span>
            <h2
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--color-cinematic-ink)",
              }}
            >
              Begin
              <br />
              the long
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>conversation.</span>
            </h2>
          </div>

          <p
            className="text-base leading-relaxed max-w-sm"
            style={{ color: "#5a5e52", fontFamily: "var(--font-sans)" }}
          >
            Admissions to Wajina International Schools is a deliberate process. We look
            for curious minds, strong character, and families committed to a lifelong
            partnership in education.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="text-xs font-black uppercase tracking-[0.25em] px-10 py-5 transition-all duration-200"
              style={{
                background: "var(--color-cinematic-ink)",
                color: "var(--color-cinematic-bone)",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2f23")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-cinematic-ink)")}
              onClick={() => window.dispatchEvent(new CustomEvent("open-admissions"))}
            >
              Begin Application
            </button>
            <button
              className="text-xs font-black uppercase tracking-[0.25em] px-10 py-5 transition-all duration-200"
              style={{
                border: "1px solid rgba(14,18,10,0.18)",
                color: "var(--color-cinematic-ink)",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(14,18,10,0.45)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(14,18,10,0.18)")
              }
            >
              Download Prospectus
            </button>
          </div>
        </motion.div>

        {/* Right: Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <h3
            className="text-[11px] font-black uppercase tracking-[0.4em]"
            style={{ color: "#5a5e52", fontFamily: "var(--font-sans)" }}
          >
            Admissions Calendar
          </h3>

          <div style={{ border: "1px solid rgba(14,18,10,0.1)" }}>
            {CALENDAR.map((row, i) => (
              <div
                key={row.phase}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  background: row.open
                    ? "rgba(106,181,71,0.08)"
                    : "rgba(14,18,10,0.02)",
                  borderBottom:
                    i < CALENDAR.length - 1
                      ? "1px solid rgba(14,18,10,0.06)"
                      : "none",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: row.open
                        ? "var(--color-cinematic-moss)"
                        : "rgba(14,18,10,0.15)",
                    }}
                  />
                  <span
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: "var(--color-cinematic-ink)", fontFamily: "var(--font-sans)" }}
                  >
                    {row.phase}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "#5a5e52", fontFamily: "var(--font-sans)" }}
                  >
                    {row.date}
                  </span>
                  {row.open && (
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-1"
                      style={{
                        background: "var(--color-cinematic-moss)",
                        color: "var(--color-cinematic-ink)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Open
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: "#8a8e82", fontFamily: "var(--font-sans)" }}
          >
            Limited places available. Early application is strongly encouraged.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
