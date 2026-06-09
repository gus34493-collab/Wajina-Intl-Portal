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
    return (360 / dotCount) * i;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className="absolute top-1/2 left-1/2"
      style={{ width: radius, height: radius, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="w-full h-full"
        style={{ animation: `orbit-spin ${duration}s linear infinite ${reverse ? "reverse" : "normal"}` }}
      >
        {dots.map((angle, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: dotSize, height: dotSize, borderRadius: "50%", background: color,
              top: "50%", left: "50%",
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

/* ── Satellite image circle ── */
function SatelliteCircle({
  src, alt, size, position, borderGradient, delay, floatDuration, floatDistance, zIndex = 20,
}: {
  src: string; alt: string; size: string; position: { top?: string; bottom?: string; left?: string; right?: string }; borderGradient: string; delay: number; floatDuration: number; floatDistance: number; zIndex?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className="absolute"
      style={{ ...position, width: size, height: size, zIndex }}
    >
      <div className="satellite-float" style={{ width: "100%", height: "100%", animation: `satellite-float-${floatDistance} ${floatDuration}s ease-in-out infinite` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", padding: "2px", background: borderGradient, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--color-cinematic-ink)", position: "relative" }}>
            <Image src={src} alt={alt} fill className="object-cover" style={{ borderRadius: "50%" }} />
          </div>
        </div>
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
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 75% 50%, rgba(106,181,71,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(14,18,10,0.9) 0%, transparent 100%)",
        }}
      />

      {/* ───── RIGHT: Constellation (Background Layer) ───── */}
      {/* Positioned absolutely behind the text, with pointer-events disabled so text buttons remain clickable */}
      <div className="absolute top-1/2 -translate-y-1/2 right-[-5%] md:right-[5%] lg:right-[10%] z-0 opacity-40 md:opacity-100 pointer-events-none" style={{ width: "clamp(300px, 60vw, 750px)", height: "clamp(300px, 60vw, 750px)" }}>
        
        {/* Main Circle (Static Single Image, no carousel) */}
        <div className="absolute flex items-center justify-center" style={{ right: 0, top: "5%", width: "clamp(200px, 45vw, 480px)", height: "clamp(200px, 45vw, 480px)" }}>
          <OrbitingDots radius="clamp(220px, 50vw, 560px)" dotCount={8} dotSize={6} color="var(--color-cinematic-moss)" duration={25} delay={IMAGE_DELAY + 0.2} />
          <OrbitingDots radius="clamp(200px, 46vw, 540px)" dotCount={5} dotSize={4} color="var(--color-cinematic-tang)" duration={18} reverse delay={IMAGE_DELAY + 0.3} />

          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: CIRCLE_DELAY, ease: EASE }} className="absolute" style={{ width: "108%", height: "108%", borderRadius: "50%", border: "1.5px solid rgba(106, 181, 71, 0.18)" }} />
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.4, scale: 1.15 }} transition={{ duration: 1.2, delay: CIRCLE_DELAY + 0.1, ease: EASE }} className="absolute" style={{ width: "115%", height: "115%", borderRadius: "50%", background: "radial-gradient(circle, rgba(106,181,71,0.08) 0%, transparent 70%)" }} />

          <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: CIRCLE_DELAY, ease: EASE }} style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative" }}>
             <Image src="/images/hero-main.jpg" alt="Wajina International Schools students" fill className="object-cover" priority style={{ borderRadius: "50%" }} />
          </motion.div>
        </div>

        {/* Satellite 1: Early Years / Girls */}
        <SatelliteCircle src="/images/IMG-20260523-WA0002.jpg" alt="Students" size="clamp(80px, 20vw, 290px)" position={{ left: "2%", bottom: "8%" }} borderGradient="linear-gradient(135deg, var(--color-cinematic-moss) 0%, var(--color-cinematic-tang) 50%, var(--color-cinematic-moss-deep) 100%)" delay={IMAGE_DELAY + 0.25} floatDuration={6} floatDistance={8} />

        {/* Satellite 2: Radio Students */}
        <SatelliteCircle src="/images/hero-radio-students.jpg" alt="Radio Students" size="clamp(60px, 15vw, 190px)" position={{ left: "0%", top: "8%" }} borderGradient="linear-gradient(135deg, var(--color-cinematic-tang) 0%, rgba(230,119,55,0.6) 100%)" delay={IMAGE_DELAY + 0.45} floatDuration={7} floatDistance={6} zIndex={15} />

        {/* Satellite 3: Patriarch / Celebration */}
        <SatelliteCircle src="/images/hero-celebration.jpg" alt="Celebration" size="clamp(50px, 12vw, 155px)" position={{ right: "5%", bottom: "2%" }} borderGradient="linear-gradient(135deg, rgba(106,181,71,0.8) 0%, var(--color-cinematic-bone) 100%)" delay={IMAGE_DELAY + 0.6} floatDuration={8} floatDistance={5} zIndex={25} />
      </div>

      {/* ───── LEFT: Text Content (Foreground Layer) ───── */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-16 lg:px-24 pointer-events-none">
        <div className="w-full max-w-[800px] space-y-4 md:space-y-8 pointer-events-auto">

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

          {/* School Name */}
          <motion.h1
            ref={schoolNameRef}
            id="hero-school-name"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: BASE_DELAY + 0.05, ease: EASE }}
            className="leading-[0.9] tracking-tight text-shadow-sm drop-shadow-xl"
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
            className="text-base md:text-lg leading-relaxed max-w-lg drop-shadow-md"
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
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
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
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                backdropFilter: "blur(4px)",
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
      </div>

      {/* Vertical rotated text */}
      <div
        className="absolute right-4 md:right-8 top-1/2 z-10 select-none pointer-events-none"
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

      <style jsx global>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes satellite-float-8 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes satellite-float-6 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes satellite-float-5 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
