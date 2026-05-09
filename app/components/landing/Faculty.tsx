"use client";

import { motion } from "framer-motion";
import { GraduationCap, Clock, BookOpen, Globe } from "lucide-react";

// ─── Replace with real figures ────────────────────────────────────────────────
const STATS = [
  {
    icon: GraduationCap,
    figure: "88%",
    label: "Postgraduate qualified",
    detail: "The majority of our teaching staff hold Master's or doctoral degrees in their subject area.",
  },
  {
    icon: Clock,
    figure: "14 yrs",
    label: "Average experience",
    detail: "Veteran educators who have taught across Nigeria's national curriculum and international frameworks.",
  },
  {
    icon: BookOpen,
    figure: "6",
    label: "Academic departments",
    detail: "Sciences, Humanities, Languages, Mathematics, Arts & Technology, and Physical Education.",
  },
  {
    icon: Globe,
    figure: "3",
    label: "Continents represented",
    detail: "A faculty shaped by diverse academic traditions — from Nigerian universities to institutions in the UK and US.",
  },
];

const DEPARTMENTS = [
  "Science & Mathematics",
  "Humanities & Social Studies",
  "English Language & Literature",
  "Technology & Innovation",
  "Arts, Music & Drama",
  "Physical & Health Education",
];
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function Faculty() {
  return (
    <section
      id="faculty"
      style={{
        background: "var(--color-cinematic-surface)",
        position: "relative",
        padding: "clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 5rem)",
        overflow: "hidden",
      }}
    >
      {/* Background grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(106,181,71,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(106,181,71,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 6vw, 6rem)",
            alignItems: "end",
            marginBottom: "clamp(3.5rem, 7vw, 6rem)",
          }}
          className="!grid-cols-1 lg:!grid-cols-2"
        >
          <div>
            <motion.span
              custom={0} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{ display: "block", fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--color-cinematic-moss)", marginBottom: "1.25rem" }}
            >
              Our Faculty
            </motion.span>
            <motion.h2
              custom={1} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "var(--color-cinematic-bone)",
              }}
            >
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>Taught by</span>
              <br />
              <span style={{ fontWeight: 700 }}>the committed.</span>
            </motion.h2>
          </div>

          <motion.p
            custom={2} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            style={{
              margin: 0,
              fontSize: "clamp(0.8rem, 1.4vw, 0.95rem)",
              color: "var(--color-cinematic-dim-2)",
              lineHeight: 1.8,
              alignSelf: "end",
            }}
          >
            Wajina's teaching staff are not merely qualified — they are chosen for their ability to inspire.
            Every educator on our roster underwent a rigorous selection that assessed subject mastery,
            pedagogical skill, and character. We do not hire teachers who deliver content. We hire
            teachers who build futures.
          </motion.p>
        </div>

        {/* ── Stats grid ────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(1rem, 2vw, 1.5rem)",
            marginBottom: "clamp(3rem, 6vw, 5rem)",
          }}
          className="!grid-cols-2 lg:!grid-cols-4"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                custom={i + 3}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                style={{
                  background: "rgba(14,18,10,0.55)",
                  border: "1px solid rgba(106,181,71,0.10)",
                  borderTop: "2px solid var(--color-cinematic-moss)",
                  padding: "clamp(1.25rem, 2.5vw, 2rem)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Icon
                  size={20}
                  style={{ color: "var(--color-cinematic-moss)", opacity: 0.8, flexShrink: 0 }}
                />
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 2.8rem)",
                  fontWeight: 900,
                  color: "var(--color-cinematic-bone)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}>
                  {stat.figure}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--color-cinematic-moss)",
                }}>
                  {stat.label}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "clamp(0.62rem, 1vw, 0.7rem)",
                  color: "var(--color-cinematic-dim)",
                  lineHeight: 1.65,
                }}>
                  {stat.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Staff group photo ─────────────────────────────────────────────── */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "21/9",
            overflow: "hidden",
            borderRadius: 12,
            marginBottom: "clamp(2.5rem, 5vw, 4rem)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/IMG-20260430-WA0048.jpg"
            alt="Wajina International Schools staff and students"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 30%",
              display: "block",
              filter: "grayscale(20%) brightness(0.78)",
            }}
            loading="lazy"
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(14,18,10,0.55) 0%, transparent 40%, transparent 60%, rgba(14,18,10,0.55) 100%)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(to top, rgba(14,18,10,0.7) 0%, transparent 100%)",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}>
            <p style={{ margin: 0, fontSize: "0.5rem", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-cinematic-moss)" }}>
              Our Teaching Staff
            </p>
            <p style={{ margin: 0, fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(248,251,246,0.35)" }}>
              Wajina International Schools
            </p>
          </div>
        </motion.div>

        {/* ── Departments strip ──────────────────────────────────────────────── */}
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "clamp(1.5rem, 3vw, 2.5rem)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <span style={{
            fontSize: "0.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.35em",
            color: "var(--color-cinematic-dim)",
            marginRight: "0.5rem",
            whiteSpace: "nowrap",
          }}>
            Departments —
          </span>
          {DEPARTMENTS.map((dept) => (
            <span
              key={dept}
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--color-cinematic-bone)",
                background: "rgba(106,181,71,0.08)",
                border: "1px solid rgba(106,181,71,0.14)",
                padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {dept}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
