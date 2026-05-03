"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const STATS = [
  { value: "15+", label: "Years of Excellence" },
  { value: "98%", label: "University Placement" },
  { value: "2", label: "Campuses" },
  { value: "500+", label: "Alumni Worldwide" },
];

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section
      id="citadel"
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{ background: "var(--color-cinematic-ink)" }}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left: Image with parallax */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Corner frame */}
          <div
            className="absolute -top-5 -left-5 w-16 h-16 z-20 pointer-events-none"
            style={{ borderTop: "2px solid var(--color-cinematic-moss)", borderLeft: "2px solid var(--color-cinematic-moss)" }}
          />
          <div
            className="absolute -bottom-5 -right-5 w-16 h-16 z-20 pointer-events-none"
            style={{
              borderBottom: "2px solid var(--color-cinematic-moss)",
              borderRight: "2px solid var(--color-cinematic-moss)",
            }}
          />

          <div
            className="relative aspect-[4/5] overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <motion.div
              style={{ y: imgY, position: "absolute", top: "-8%", left: 0, right: 0, bottom: "-8%" }}
            >
              <Image
                src="/images/campus-building.jpg"
                alt="Wajina Citadel"
                fill
                className="object-cover"
                style={{ filter: "grayscale(15%)" }}
              />
            </motion.div>
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to top, var(--color-cinematic-ink) 0%, transparent 55%)",
              }}
            />
          </div>


        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="space-y-10"
        >
          <div className="space-y-5">
            <h2
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--color-cinematic-bone)",
              }}
            >
              More than a school.
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>A place where futures are born.</span>
            </h2>
          </div>

          <div className="space-y-5">
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
            >
              At Wajina International Schools, we believe every child carries within them
              an extraordinary potential — waiting to be seen, nurtured, and set free.
              We don&apos;t just teach. We <em style={{ color: "var(--color-cinematic-bone)", fontStyle: "italic" }}>inspire.</em>
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
            >
              From the moment your child walks through our doors, they enter a world where
              excellence is expected, compassion is practised, and no dream is too big.
              We raise children grounded in integrity, fuelled by critical thinking, and
              empowered by leadership.
            </p>
            <p
              className="text-sm leading-relaxed italic"
              style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-display)" }}
            >
              Locally grounded. Globally ready. Forever changed.
            </p>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-2 gap-px"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="p-6 space-y-1"
                style={{ background: "var(--color-cinematic-ink)" }}
              >
                <p
                  className="leading-none font-black"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "2.4rem",
                    color: "var(--color-cinematic-moss)",
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-token-micro font-black uppercase tracking-widest"
                  style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/our-story"
            className="inline-block text-xs font-black uppercase tracking-[0.3em] px-10 py-5 transition-all duration-200"
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
            Read Our Full Story
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
