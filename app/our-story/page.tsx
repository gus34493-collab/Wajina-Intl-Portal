"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function OurStoryPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--color-cinematic-ink)", color: "var(--color-cinematic-bone)" }}
    >
      {/* ── Sticky back nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: "rgba(14,18,10,0.85)", backdropFilter: "blur(12px)" }}
      >
        <Link
          href="/"
          className="text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-200"
          style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-cinematic-dim)")}
        >
          ← Back to Home
        </Link>
        <span
          className="text-[10px] font-black uppercase tracking-[0.4em]"
          style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
        >
          Our Story
        </span>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/campus-building.jpg"
            alt="Wajina International Schools Campus"
            fill
            className="object-cover"
            priority
            style={{ filter: "brightness(0.4) grayscale(15%)" }}
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE }}
            className="space-y-4"
          >
            <span
              className="text-[10px] font-black uppercase tracking-[0.5em] block"
              style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
            >
              Heritage & Mission
            </span>
            <h1
              className="leading-[0.92] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                fontWeight: 300,
                fontStyle: "italic",
              }}
            >
              More Than a School.
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>
                A Place Where Futures Are Born.
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="max-w-3xl mx-auto px-8 py-24 space-y-16">
        {/* Opening */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="space-y-6"
        >
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            At Wajina International Schools, we believe every child carries within them
            an extraordinary potential — waiting to be seen, nurtured, and set free.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            We don&apos;t just teach. We{" "}
            <em style={{ color: "var(--color-cinematic-bone)", fontStyle: "italic" }}>inspire.</em>{" "}
            We cultivate character that outlasts the classroom, and we raise young men
            and women who are ready — not just for exams, but for life.
          </p>
        </motion.div>

        {/* Divider */}
        <div
          className="w-12 h-px mx-auto"
          style={{ background: "var(--color-cinematic-moss)" }}
        />

        {/* Our Promise */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="space-y-6"
        >
          <h2
            className="tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
            }}
          >
            Our Promise to Every Child
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            From the moment your child walks through our doors, they enter a world where
            excellence is expected, compassion is practised, and no dream is too big.
            Our deeply committed staff, parents, and community — united as one — pour
            themselves into the intellectual, social, and personal growth of every single
            student.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            We challenge. We nurture. We listen. Because great teaching isn&apos;t
            one-size-fits-all — it is responsive, reflective, and relentlessly dedicated
            to the child in front of us.
          </p>
        </motion.div>

        {/* Divider */}
        <div
          className="w-12 h-px mx-auto"
          style={{ background: "var(--color-cinematic-moss)" }}
        />

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="space-y-6"
        >
          <h2
            className="tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
            }}
          >
            Rooted in Values. Ready for the World.
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            We raise children grounded in the Fear of God, anchored by integrity, fuelled
            by critical thinking, and empowered by leadership. Children who know how to
            be a true friend. Children who see the world with open minds and serve it
            with open hearts.
          </p>
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
          className="text-center pt-8 space-y-6"
        >
          <p
            className="text-lg italic leading-relaxed"
            style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-display)" }}
          >
            Locally grounded. Globally ready. Forever changed.
          </p>
          <div
            className="w-16 h-px mx-auto"
            style={{ background: "var(--color-cinematic-tang)" }}
          />
          <p
            className="text-xl leading-snug"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
            }}
          >
            Welcome to Wajina International Schools — where your child doesn&apos;t
            just find their potential.{" "}
            <span style={{ color: "var(--color-cinematic-moss)" }}>They become it.</span>
          </p>
        </motion.div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/#admissions"
            className="text-xs font-black uppercase tracking-[0.3em] px-10 py-5 transition-all duration-200"
            style={{
              background: "var(--color-cinematic-moss)",
              color: "var(--color-cinematic-ink)",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#7cc95a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--color-cinematic-moss)")
            }
          >
            Begin Enrollment
          </Link>
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-[0.3em] px-10 py-5 transition-all duration-200"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--color-cinematic-bone)",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
            }
          >
            Return Home
          </Link>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <footer
        className="py-8 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-[0.4em]"
          style={{ color: "var(--color-cinematic-dim-2)", fontFamily: "var(--font-sans)" }}
        >
          © {new Date().getFullYear()} Wajina International Schools · Citadel of Excellence
        </p>
      </footer>
    </main>
  );
}
