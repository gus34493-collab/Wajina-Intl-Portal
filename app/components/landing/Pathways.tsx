"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PATHWAYS = [
  {
    id: 0,
    label: "I",
    title: "Early Years",
    subtitle: "Creche & Nursery",
    desc: "Laying the foundation in a nurturing environment that sparks curiosity, language, and love of learning from the very first day.",
    image: "/images/students-saluting.jpg",
    accent: "#6AB547",
    tags: ["Age 0–5", "Play-Based Learning", "Emotional Development"],
  },
  {
    id: 1,
    label: "II",
    title: "Primary School",
    subtitle: "Foundation Years",
    desc: "A rigorous yet joyful curriculum blending phonics, mathematics, natural sciences and the arts within British-Nigerian frameworks.",
    image: "/images/campus-building.jpg",
    accent: "#058ED9",
    tags: ["Age 6–11", "Literacy & Numeracy", "Creative Arts"],
  },
  {
    id: 2,
    label: "III",
    title: "Junior Secondary",
    subtitle: "Transition Years",
    desc: "Bridge-building years where students deepen subject mastery and begin to develop academic identity and personal leadership.",
    image: "/images/project-presentation.jpg",
    accent: "#E67737",
    tags: ["Age 12–14", "STEM Foundation", "Leadership Track"],
  },
  {
    id: 3,
    label: "IV",
    title: "Senior Secondary",
    subtitle: "Excellence Track",
    desc: "Rigorous preparation for WAEC and IGCSE examinations. Students build specialisations and university-ready portfolios.",
    image: "/images/students-saluting.jpg",
    accent: "#6AB547",
    tags: ["Age 15–18", "WAEC · IGCSE", "University Prep"],
  },
  {
    id: 4,
    label: "V",
    title: "Enrichment Hub",
    subtitle: "Beyond the Classroom",
    desc: "An after-hours ecosystem of entrepreneurship, creative arts, competitive sports and vocational certifications.",
    image: "/images/school-event.jpg",
    accent: "#058ED9",
    tags: ["All Ages", "Entrepreneurship", "Sports Excellence"],
  },
  {
    id: 5,
    label: "VI",
    title: "Global Pathways",
    subtitle: "International Readiness",
    desc: "Structured programmes preparing students for international scholarships, exchange programmes and global university entry.",
    image: "/images/campus-building.jpg",
    accent: "#E67737",
    tags: ["Secondary", "Scholarships", "Exchange Programmes"],
  },
];

function getCardStyle(index: number, active: number, total: number) {
  const offset = index - active;
  const wrapped =
    offset > total / 2 ? offset - total : offset < -total / 2 ? offset + total : offset;
  const abs = Math.abs(wrapped);

  if (abs > 2) return { visibility: "hidden" as const, pointerEvents: "none" as const };

  const x = wrapped * 220;
  const z = -abs * 180;
  const rotY = wrapped === 0 ? 0 : -wrapped * 26;
  const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.65;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : 0.3;

  return {
    transform: `translate3d(${x}px, 0, ${z}px) rotateY(${rotY}deg) scale(${scale})`,
    opacity,
    zIndex: 10 - abs,
    filter: `brightness(${abs === 0 ? 1 : abs === 1 ? 0.55 : 0.25})`,
    transition: "all 0.65s cubic-bezier(0.16,1,0.3,1)",
  };
}

export default function Pathways() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((a) => (a + 1) % PATHWAYS.length), []);
  const prev = useCallback(
    () => setActive((a) => (a - 1 + PATHWAYS.length) % PATHWAYS.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 4200);
    return () => clearInterval(t);
  }, [next, paused]);

  return (
    <section
      id="pathways"
      className="py-28 overflow-hidden"
      style={{ background: "var(--color-cinematic-deep)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-14">
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <span
              className="text-token-micro font-black uppercase tracking-[0.45em]"
              style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
            >
              Plate II · Educational Journey
            </span>
            <h2
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--color-cinematic-bone)",
              }}
            >
              Six stages.
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>One journey.</span>
            </h2>
          </motion.div>

          {/* Counter + arrows */}
          <div className="flex items-center gap-5">
            <span
              className="text-token-micro font-black uppercase tracking-widest tabular-nums"
              style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
            >
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(PATHWAYS.length).padStart(2, "0")}
            </span>
            {[{ fn: prev, Icon: ChevronLeft }, { fn: next, Icon: ChevronRight }].map(
              ({ fn, Icon }, i) => (
                <button
                  key={i}
                  onClick={fn}
                  className="w-10 h-10 flex items-center justify-center transition-all duration-200"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-cinematic-dim)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-cinematic-moss)";
                    e.currentTarget.style.color = "var(--color-cinematic-moss)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "var(--color-cinematic-dim)";
                  }}
                >
                  <Icon size={16} />
                </button>
              )
            )}
          </div>
        </div>

        {/* 3D stage */}
        <div
          className="relative h-[500px] flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          <div
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {PATHWAYS.map((path, index) => (
              <div
                key={path.id}
                className="absolute top-0 left-1/2 w-72 h-full cursor-pointer"
                style={{ marginLeft: "-144px", ...getCardStyle(index, active, PATHWAYS.length) }}
                onClick={() => setActive(index)}
              >
                <div
                  className="w-full h-full flex flex-col overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden shrink-0">
                    <Image
                      src={path.image}
                      alt={path.title}
                      fill
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 40%, var(--color-cinematic-surface) 100%)",
                      }}
                    />
                    <div
                      className="absolute top-4 left-4 px-3 py-1 text-xs font-black"
                      style={{
                        background: path.accent,
                        color: "var(--color-cinematic-ink)",
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                      }}
                    >
                      {path.label}
                    </div>
                  </div>

                  {/* Card body */}
                  <div
                    className="flex-grow p-6 flex flex-col gap-4"
                    style={{ background: "var(--color-cinematic-surface)" }}
                  >
                    <div>
                      <p
                        className="text-token-micro font-black uppercase tracking-[0.35em] mb-1"
                        style={{ color: path.accent, fontFamily: "var(--font-sans)" }}
                      >
                        {path.subtitle}
                      </p>
                      <h3
                        className="text-xl leading-tight"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          color: "var(--color-cinematic-bone)",
                          fontWeight: 300,
                        }}
                      >
                        {path.title}
                      </h3>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
                    >
                      {path.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto mb-4">
                      {path.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-token-micro font-black uppercase tracking-wider px-2 py-1"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "var(--color-cinematic-dim-2)",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent("open-admissions"));
                      }}
                      className="w-full py-3 text-token-micro font-black uppercase tracking-[0.3em] transition-all duration-300 border border-white/5 hover:bg-moss hover:text-ink hover:border-moss"
                      style={{ background: "rgba(255,255,255,0.02)", color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}
                    >
                      Apply for Track
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2.5">
          {PATHWAYS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="transition-all duration-300"
              style={{
                width: i === active ? "28px" : "6px",
                height: "6px",
                background:
                  i === active ? "var(--color-cinematic-moss)" : "rgba(255,255,255,0.14)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
