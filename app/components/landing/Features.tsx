"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Scale, Users, Brain, Medal, Globe, type LucideIcon } from "lucide-react";

const VISION =
  "To inspire excellence, cultivate character, and empower engagement locally and globally — to form men and women of conscience, compassion, competence, commitment and character.";

const MISSION =
  "Wajina International Schools' staff, parents, and community are dedicated to the intellectual, personal, social and physical growth of every pupil. Our highly qualified staff recognise the value of professional development in order to rigorously challenge students. Our teaching practices are both reflective and responsive to the needs of our students. Through diversified experiences, our pupils discover their potential, achieve readiness for higher education and careers, and succeed in a secured and serene environment.";

type Pillar = { num: string; title: string; icon: LucideIcon; color: string; desc: string };

const PILLARS: Pillar[] = [
  {
    num: "01", title: "Fear of God", icon: Heart, color: "#6AB547",
    desc: "Every lesson, every interaction rests on this foundation. We raise children who understand that true character begins with reverence — and that wisdom starts here, nowhere else.",
  },
  {
    num: "02", title: "Responsibility", icon: Shield, color: "#E67737",
    desc: "We hold students accountable to their work, their words, and their community. Ownership is taught from day one, and it never leaves.",
  },
  {
    num: "03", title: "Integrity", icon: Scale, color: "#6AB547",
    desc: "At Wajina, how you win matters as much as winning. We build students who do the right thing even when no one is watching.",
  },
  {
    num: "04", title: "True Friendship", icon: Users, color: "#E67737",
    desc: "The bonds formed here last a lifetime. We cultivate genuine care, loyalty, and community — built one relationship at a time.",
  },
  {
    num: "05", title: "Critical Thinking", icon: Brain, color: "#6AB547",
    desc: "We don't raise students who memorise answers. Every child learns to inquire, connect, and reason independently — from primary through graduation.",
  },
  {
    num: "06", title: "Leadership", icon: Medal, color: "#E67737",
    desc: "From class monitor to prefect council, every student discovers their voice. We believe every child has the capacity — and the responsibility — to lead.",
  },
  {
    num: "07", title: "Open Mindedness", icon: Globe, color: "#6AB547",
    desc: "A Wajina student listens before they speak and grows through every perspective they encounter. Curiosity about the world is not optional here — it is expected.",
  },
];

// Inverted pyramid: 3 across → 2 across (narrowed) → 2 across (narrowed further)
// w-full collapses to single-column on mobile; md:w-2/3 / md:w-1/2 apply the pyramid on desktop
const ROWS: { pillars: Pillar[]; cls: string }[] = [
  { pillars: PILLARS.slice(0, 3), cls: "grid grid-cols-1 md:grid-cols-3 w-full" },
  { pillars: PILLARS.slice(3, 5), cls: "grid grid-cols-1 md:grid-cols-2 w-full md:w-2/3" },
  { pillars: PILLARS.slice(5, 7), cls: "grid grid-cols-1 md:grid-cols-2 w-full md:w-1/2" },
];

function PillarCard({ pillar, delay }: { pillar: Pillar; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "relative",
        padding: "2.5rem 2.25rem 2.75rem",
        background: "var(--color-cinematic-surface, rgba(255,255,255,0.03))",
        borderTop: `2px solid ${pillar.color}`,
        overflow: "hidden",
        minHeight: 220,
      }}
    >
      {/* Ghost number — anchored bottom-right, feels carved into the card */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "0.5rem",
          right: "1.25rem",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 900,
          fontSize: "5.5rem",
          color: pillar.color,
          opacity: 0.07,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {pillar.num}
      </span>

      <div style={{ color: pillar.color, marginBottom: "1.5rem" }}>
        <pillar.icon size={22} strokeWidth={1.5} />
      </div>

      <h3
        style={{
          margin: "0 0 0.75rem",
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "clamp(1rem, 1.4vw, 1.3rem)",
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          color: "var(--color-cinematic-bone)",
          lineHeight: 1.1,
        }}
      >
        {pillar.title}
      </h3>

      <div style={{ width: "1.75rem", height: 1, background: pillar.color, opacity: 0.4, marginBottom: "0.85rem" }} />

      <p
        style={{
          margin: 0,
          fontSize: "clamp(0.68rem, 0.9vw, 0.76rem)",
          color: "var(--color-cinematic-dim)",
          lineHeight: 1.88,
        }}
      >
        {pillar.desc}
      </p>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section
      id="pillars"
      style={{ background: "var(--color-cinematic-ink)", position: "relative", overflow: "hidden" }}
    >

      {/* ── VISION — full-width proclamation, apex of the pyramid ───────────── */}
      <div
        style={{
          padding: "9rem 6% 8rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "1rem",
            left: "3%",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(8rem, 16vw, 15rem)",
            color: "rgba(106,181,71,0.045)",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          &#x201C;
        </div>

        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: "block",
              fontSize: "0.5rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.55em",
              color: "var(--color-cinematic-moss)",
              marginBottom: "2.5rem",
            }}
          >
            Vision Statement
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(1.55rem, 3vw, 2.6rem)",
              color: "var(--color-cinematic-bone)",
              lineHeight: 1.52,
            }}
          >
            {VISION}
          </motion.p>
        </div>
      </div>

      {/* ── PILLAR PYRAMID ─────────────────────────────────────────────────────
           Row 1 (100%):  [01][02][03]
           Row 2  (67%):    [04][05]
           Row 3  (50%):      [06][07]
           Mission tip:        [●]
      ────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "5rem 6% 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "3rem",
          }}
        >
          <span
            style={{
              fontSize: "0.5rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.5em",
              color: "var(--color-cinematic-dim-2)",
            }}
          >
            Core Values
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(0.85rem, 1.6vw, 1.3rem)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.07)",
            }}
          >
            07 Pillars
          </span>
        </motion.div>

        {/* Pyramid rows — 1px gap between cards acts as the grid line */}
        <div className="w-full flex flex-col items-center" style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}>
          {ROWS.map(({ pillars, cls }, ri) => (
            <div key={ri} className={`${cls} gap-px`} style={{ background: "rgba(255,255,255,0.04)" }}>
              {pillars.map((pillar, pi) => (
                <PillarCard
                  key={pillar.num}
                  pillar={pillar}
                  delay={(ri * 3 + pi) * 0.065}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSION — focused tip of the pyramid ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          padding: "5.5rem 6% 9rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.75rem",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.5em",
            color: "var(--color-cinematic-tang)",
          }}
        >
          Mission Statement
        </span>

        <div style={{ width: "2.5rem", height: 1, background: "var(--color-cinematic-tang)", opacity: 0.5 }} />

        <p
          style={{
            margin: 0,
            maxWidth: 500,
            fontSize: "clamp(0.76rem, 1.1vw, 0.84rem)",
            color: "var(--color-cinematic-dim)",
            lineHeight: 1.95,
          }}
        >
          {MISSION}
        </p>
      </motion.div>

    </section>
  );
}
