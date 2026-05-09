"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

/* ── stagger timings ── */
const EASE = [0.16, 1, 0.3, 1] as const;
const BASE_DELAY = 0;
const TEXT_DELAY = 0.15;
const CIRCLE_DELAY = 0.35;
const IMAGE_DELAY = 0.55;

/* ── Orbiting dots component ── */
function OrbitingDots({
  radius,
  dotCount,
  dotSize,
  color,
  duration,
  reverse,
  delay,
}: {
  radius: string;
  dotCount: number;
  dotSize: number;
  color: string;
  duration: number;
  reverse?: boolean;
  delay: number;
}) {
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (360 / dotCount) * i;
    return angle;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className="absolute top-1/2 left-1/2"
      style={{
        width: radius,
        height: radius,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="w-full h-full"
        style={{
          animation: `orbit-spin ${duration}s linear infinite ${reverse ? "reverse" : "normal"}`,
        }}
      >
        {dots.map((angle, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              background: color,
              top: "50%",
              left: "50%",
              transform: `rotate(${angle}deg) translateY(calc(-${radius} / 2)) translate(-50%, -50%)`,
              opacity: 0.7 + (i % 2) * 0.3,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const schoolNameRef = useRef<HTMLHeadingElement>(null);

  return (
    <section
      id="hero-section"
      className="relative h-screen w-full overflow-hidden"
      style={{ background: "var(--color-cinematic-ink)" }}
    >
      {/* Subtle ambient gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 75% 50%, rgba(106,181,71,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(14,18,10,0.9) 0%, transparent 100%)",
        }}
      />

      {/* Horizontal layout: text left, circles right — ALWAYS side-by-side */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-16 lg:px-24">
        <div className="w-full flex flex-row items-center justify-between gap-4 md:gap-12 lg:gap-8">

          {/* ───── LEFT: Text Content ───── */}
          <div className="space-y-4 md:space-y-8 flex-1 min-w-0">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: BASE_DELAY, ease: EASE }}
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-px shrink-0"
                style={{ background: "var(--color-cinematic-moss)" }}
              />
              <span
                className="text-token-micro font-black uppercase tracking-[0.4em]"
                style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
              >
                Citadel of Excellence
              </span>
            </motion.div>

            {/* School Name — Main Headline (10% bigger) */}
            <motion.h1
              ref={schoolNameRef}
              id="hero-school-name"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: BASE_DELAY + 0.05, ease: EASE }}
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.2rem, 6.5vw, 7.15rem)",
                fontWeight: 800,
                fontStyle: "italic",
                color: "var(--color-cinematic-bone)",
              }}
            >
              Wajina
              <br />
              International
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>Schools.</span>
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: TEXT_DELAY, ease: EASE }}
              className="text-base md:text-lg leading-relaxed max-w-lg"
              style={{
                color: "var(--color-cinematic-dim)",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
              }}
            >
              World-class primary and secondary education rooted in Nigerian heritage
              and shaped by British academic rigour. We raise leaders, not just graduates.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: TEXT_DELAY + 0.1, ease: EASE }}
              className="flex flex-row items-start gap-2 md:gap-4 pt-2"
            >
              <button
                className="text-token-micro md:text-xs font-black uppercase tracking-[0.25em] px-4 md:px-10 py-3 md:py-5 transition-all duration-200"
                style={{
                  background: "var(--color-cinematic-moss)",
                  color: "var(--color-cinematic-ink)",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-cinematic-moss-glow)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--color-cinematic-moss)")
                }
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-admissions"))
                }
              >
                Begin Enrollment
              </button>
              <button
                className="text-token-micro md:text-xs font-black uppercase tracking-[0.25em] px-4 md:px-10 py-3 md:py-5 transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "var(--color-cinematic-bone)",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")
                }
              >
                Virtual Tour
              </button>
            </motion.div>
          </div>

          {/* ───── RIGHT: Dual Circle Images with Orbiting Dots ───── */}
          <div className="relative flex-shrink-0" style={{ width: "clamp(120px, 40vw, 680px)", height: "clamp(120px, 40vw, 680px)" }}>

            {/* ── Primary Circle (main students image) — top-right ── */}
            <div className="absolute flex items-center justify-center" style={{ right: 0, top: 0, width: "clamp(90px, 28vw, 480px)", height: "clamp(90px, 28vw, 480px)" }}>

              {/* Orbiting dots ring — outer (slow) */}
              <OrbitingDots
                radius="clamp(100px, 32vw, 560px)"
                dotCount={8}
                dotSize={6}
                color="var(--color-cinematic-moss)"
                duration={25}
                delay={IMAGE_DELAY + 0.2}
              />

              {/* Orbiting dots ring — inner (medium, reverse) */}
              <OrbitingDots
                radius="clamp(90px, 30vw, 540px)"
                dotCount={5}
                dotSize={4}
                color="var(--color-cinematic-tang)"
                duration={18}
                reverse
                delay={IMAGE_DELAY + 0.3}
              />

              {/* Decorative ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: CIRCLE_DELAY, ease: EASE }}
                className="absolute"
                style={{
                  width: "108%",
                  height: "108%",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(106, 181, 71, 0.18)",
                }}
              />

              {/* Outer glow ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.4, scale: 1.15 }}
                transition={{ duration: 1.2, delay: CIRCLE_DELAY + 0.1, ease: EASE }}
                className="absolute"
                style={{
                  width: "115%",
                  height: "115%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(106,181,71,0.08) 0%, transparent 70%)",
                }}
              />

              {/* Circle with main image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: CIRCLE_DELAY, ease: EASE }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-cinematic-surface) 0%, var(--color-cinematic-surface-2) 50%, var(--color-cinematic-deep) 100%)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: IMAGE_DELAY, ease: EASE }}
                  style={{ width: "100%", height: "100%", position: "relative" }}
                >
                  <Image
                    src="/images/hero-main.jpg"
                    alt="Wajina International Schools student"
                    fill
                    className="object-cover"
                    priority
                    style={{ borderRadius: "50%" }}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* ── Secondary Circle (earlier years — ~60% of main, offset to bottom-left) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: IMAGE_DELAY + 0.25, ease: EASE }}
              className="absolute z-20"
              style={{
                left: "2%",
                bottom: "8%",
                width: "clamp(60px, 18vw, 290px)",
                height: "clamp(60px, 18vw, 290px)",
              }}
            >
              {/* Gradient border ring */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  padding: "3px",
                  background: "linear-gradient(135deg, var(--color-cinematic-moss) 0%, var(--color-cinematic-tang) 50%, var(--color-cinematic-moss-deep) 100%)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "var(--color-cinematic-ink)",
                    position: "relative",
                  }}
                >
                  <Image
                    src="/images/Gemini_Generated_Image_cvjn9ocvjn9ocvjn.png"
                    alt="Early years learners at Wajina International Schools"
                    fill
                    className="object-cover"
                    style={{ borderRadius: "50%" }}
                  />
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Vertical rotated text */}
      <div
        className="absolute right-4 md:right-8 top-1/2 z-10 select-none"
        style={{
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
        }}
      >
        <span
          className="text-token-micro md:text-token-micro font-black uppercase tracking-[0.55em]"
          style={{
            color: "rgba(255,255,255,0.08)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Excellence in Education
        </span>
      </div>

      {/* ── Tangerine Streamer — user's sketch path ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden opacity-30 md:opacity-100">
        <svg
          viewBox="0 0 1600 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* 20% glow — subtle soft edge */}
            <filter id="streamer-glow20" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/*
            Path exactly matching user's sketch:
            ─ Enters left edge at mid-height
            ─ Wave dip down
            ─ Rise into a counter-clockwise loop (cursive "e")
            ─ Crosses and flows right
            ─ Long sweep down to section bottom edge
          */}
          <path
            d="M -40 450
               C 100 450, 250 560, 450 560
               C 580 560, 680 500, 710 400
               C 730 280, 610 280, 600 400
               C 590 520, 800 580, 1000 580
               C 1200 580, 1400 680, 1600 920"
            stroke="#E67737"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.11"
            filter="url(#streamer-glow20)"
            className="streamer-ribbon"
          />
        </svg>
      </div>

      {/* CSS for orbit + streamer animations */}
      <style jsx global>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .streamer-ribbon {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          animation: streamer-flow 8s ease-in-out 0.8s infinite;
        }

        @keyframes streamer-flow {
          /* Phase 1: slow draw in (2.5s) */
          0%   { stroke-dashoffset: 2400; }
          31%  { stroke-dashoffset: 0; }
          /* Phase 2: sit fully visible for 3s (until 5.5s) */
          69%  { stroke-dashoffset: 0; }
          /* Phase 3: fast retract (700ms) (until 6.2s) */
          78%  { stroke-dashoffset: -2400; }
          /* Phase 4: stay hidden until loop restarts (at 8s) */
          100% { stroke-dashoffset: -2400; }
        }
      `}</style>
    </section>
  );
}
