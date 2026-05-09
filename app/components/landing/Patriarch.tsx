"use client";

import { motion } from "framer-motion";

// ─── Replace these with the real patriarch details ────────────────────────────
const PATRIARCH = {
  name: "Comr. Mike Ortom",
  title: "Founder & Proprietor",
  imageUrl: "/images/patriarch-portrait.png",
  tagline: "Education is not a privilege. It is the one gift that multiplies when given.",
  story: [
    "Comr. Mike Ortom spent years watching brilliant children in Benue State fall through the cracks of an underfunded system — not for lack of ability, but for lack of access. That wound never healed. It became a calling.",
    "He broke ground on what would become Wajina International Schools with a clear mandate: build an institution where a child from any background could sit beside the world's best ideas and leave prepared for the world's highest demands.",
    "Today, with two thriving campuses, a fully digital student portal, and alumni placing in universities across four continents, the vision he committed to is very much alive — and still growing.",
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function Patriarch() {
  return (
    <section
      id="patriarch"
      style={{ background: "var(--color-cinematic-deep)", position: "relative", overflow: "hidden" }}
    >
      {/* Subtle vertical rule */}
      <div
        style={{
          position: "absolute",
          top: 0, bottom: 0,
          left: "50%",
          width: 1,
          background: "linear-gradient(to bottom, transparent, rgba(106,181,71,0.12) 30%, rgba(106,181,71,0.12) 70%, transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 clamp(1.5rem, 5vw, 5rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(2rem, 6vw, 6rem)",
          alignItems: "center",
          minHeight: "80vh",
        }}
        className="!grid-cols-1 lg:!grid-cols-2"
      >
        {/* ── Image column ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: "relative", paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}
        >
          {/* Moss corner frames */}
          <div style={{ position: "absolute", top: "calc(clamp(4rem, 8vw, 7rem) - 16px)", left: -16, width: 44, height: 44, borderTop: "2px solid var(--color-cinematic-moss)", borderLeft: "2px solid var(--color-cinematic-moss)", zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: "calc(clamp(4rem, 8vw, 7rem) - 16px)", right: -16, width: 44, height: 44, borderBottom: "2px solid var(--color-cinematic-moss)", borderRight: "2px solid var(--color-cinematic-moss)", zIndex: 2 }} />

          {/* Photo */}
          <div
            style={{
              position: "relative",
              aspectRatio: "4/5",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.05)",
              background: "var(--color-cinematic-surface)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PATRIARCH.imageUrl}
              alt={PATRIARCH.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                display: "block",
                filter: "grayscale(15%) brightness(0.9)",
              }}
            />
            {/* Bottom vignette */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, transparent 50%, rgba(20,24,15,0.7) 100%)",
            }} />
            {/* Name plate over image bottom */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "1.5rem",
            }}>
              <p style={{ margin: 0, fontSize: "0.48rem", fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--color-cinematic-moss)", marginBottom: 6 }}>
                {PATRIARCH.title}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", fontWeight: 700, color: "var(--color-cinematic-bone)", letterSpacing: "-0.02em" }}>
                {PATRIARCH.name}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Story column ────────────────────────────────────────────────── */}
        <div style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>
          <motion.span
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{ display: "block", fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--color-cinematic-moss)", marginBottom: "1.5rem" }}
          >
            Our Patriarch
          </motion.span>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{
              margin: "0 0 2rem",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            The man behind<br />
            <span style={{ color: "var(--color-cinematic-moss)", fontWeight: 700, fontStyle: "normal" }}>the vision.</span>
          </motion.h2>

          {/* Pull quote */}
          <motion.blockquote
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            style={{
              margin: "0 0 2.5rem",
              paddingLeft: "1.25rem",
              borderLeft: "2px solid var(--color-cinematic-moss)",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(0.9rem, 1.8vw, 1.1rem)",
              fontStyle: "italic",
              fontWeight: 300,
              color: "var(--color-cinematic-cream)",
              lineHeight: 1.6,
            }}
          >
            &ldquo;{PATRIARCH.tagline}&rdquo;
          </motion.blockquote>

          {/* Story paragraphs */}
          {PATRIARCH.story.map((para, i) => (
            <motion.p
              key={i}
              custom={i + 3}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              style={{
                margin: "0 0 1.1rem",
                fontSize: "clamp(0.75rem, 1.3vw, 0.88rem)",
                color: "var(--color-cinematic-dim-2)",
                lineHeight: 1.8,
                fontWeight: 400,
              }}
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
