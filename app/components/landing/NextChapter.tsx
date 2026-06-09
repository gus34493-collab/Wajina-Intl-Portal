"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  BookOpenCheck,
  Sparkles,
  HandHeart,
  ArrowUpRight,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const INITIATIVES = [
  {
    slug: "college",
    tag: "Coming 2027",
    title: "Wajina College",
    desc: "A natural extension of everything we've built. Wajina College will offer higher education pathways rooted in the same values, rigour, and character formation that define our primary and secondary campuses.",
    detail: "Degree-level programmes in Education, Business Administration, and Agricultural Sciences — designed for the leaders our region needs most.",
    icon: GraduationCap,
    accent: "var(--color-cinematic-moss)",
    image: "/images/developments/college.png",
  },
  {
    slug: "adult-learning",
    tag: "Enrolment Open",
    title: "Second Chance Academy",
    desc: "Education has no expiry date. Our accelerated adult programme gives men and women who missed formal schooling the chance to earn primary and secondary credentials — at their own pace, with dignity.",
    detail: "Flexible evening and weekend classes. WAEC preparation. Literacy coaching. Because it is never too late to become who you were meant to be.",
    icon: BookOpenCheck,
    accent: "var(--color-cinematic-tang)",
    image: "/images/developments/adult_learning.png",
  },
  {
    slug: "scholarship",
    tag: "Applications Open",
    title: "Scholarships",
    desc: "Brilliance should never be gated by circumstance. Our scholarship programme identifies and fully sponsors exceptional students from underserved families across Benue State and beyond.",
    detail: "Full tuition, uniforms, books, and meals — removing every barrier between a gifted child and the education they deserve.",
    icon: Sparkles,
    accent: "var(--color-cinematic-moss)",
    image: "/images/developments/scholarship.png",
  },
  {
    slug: "foundation",
    tag: "Ongoing",
    title: "Community Impact",
    desc: "A school that only serves its students has missed the point. Wajina's outreach programmes reach deep into the communities we call home — because a rising tide lifts every boat.",
    detail: "Clean water projects. Village literacy drives. Free health screenings. School supply donations to rural primaries. This is the Wajina way.",
    icon: HandHeart,
    accent: "var(--color-cinematic-tang)",
    image: "/images/developments/community.png",
  },
];

export default function NextChapter() {
  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "var(--color-cinematic-ink)" }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 30% 20%, rgba(230,119,55,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10 space-y-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-2xl space-y-5"
        >
          <span
            className="text-token-micro font-black uppercase tracking-[0.45em]"
            style={{ color: "var(--color-cinematic-tang)", fontFamily: "var(--font-sans)" }}
          >
            The Road Ahead
          </span>
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
            Beyond these walls.
            <br />
            <span style={{ color: "var(--color-cinematic-moss)" }}>Into the world.</span>
          </h2>
          <p
            className="text-base leading-relaxed max-w-lg"
            style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
          >
            Wajina is not a school that stands still. We invest in what comes
            next — a college, second-chance education, scholarships for the
            brilliant, and humanitarian work that reaches far beyond our gates.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.03)" }}>
          {INITIATIVES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
              className="group relative overflow-hidden transition-all duration-300"
              style={{ background: "var(--color-cinematic-ink)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-cinematic-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-cinematic-ink)")
              }
            >
              {/* Image */}
              <div className="relative h-56 md:h-64 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: "brightness(0.65) grayscale(10%)" }}
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background:
                      "linear-gradient(to top, var(--color-cinematic-ink) 0%, transparent 60%)",
                  }}
                />
                {/* Tag on image */}
                <div className="absolute top-5 left-5 z-20">
                  <span
                    className="text-token-micro font-black uppercase tracking-[0.35em] px-3 py-1.5"
                    style={{
                      background: `color-mix(in srgb, ${item.accent === "var(--color-cinematic-moss)" ? "#6AB547" : "#E67737"} 15%, rgba(0,0,0,0.6))`,
                      color: item.accent === "var(--color-cinematic-moss)" ? "#8ed464" : "#f0954d",
                      backdropFilter: "blur(8px)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                {/* Icon on image */}
                <div className="absolute top-5 right-5 z-20">
                  <div
                    className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(8px)",
                      color: item.accent === "var(--color-cinematic-moss)" ? "#8ed464" : "#f0954d",
                    }}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 space-y-5">
                {/* Title */}
                <h3
                  className="tracking-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: "var(--color-cinematic-bone)",
                  }}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
                >
                  {item.desc}
                </p>

                {/* Detail line */}
                <p
                  className="text-xs leading-relaxed italic"
                  style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-display)", opacity: 0.7 }}
                >
                  {item.detail}
                </p>

                {/* CTA row */}
                <div className="flex items-center gap-6 pt-3">
                  <Link
                    href={`/future/${item.slug}`}
                    className="inline-flex items-center gap-2 text-token-micro font-black uppercase tracking-[0.3em] transition-colors duration-200"
                    style={{
                      color: item.accent === "var(--color-cinematic-moss)" ? "#8ed464" : "#f0954d",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-cinematic-bone)")
                    }
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      item.accent === "var(--color-cinematic-moss)" ? "#8ed464" : "#f0954d")
                    }
                  >
                    Learn More
                    <ArrowUpRight size={14} strokeWidth={2} />
                  </Link>
                  <Link
                    href={`/future/${item.slug}`}
                    className="inline-flex items-center gap-2 text-token-micro font-black uppercase tracking-[0.3em] px-5 py-2.5 transition-all duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--color-cinematic-bone)",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Support
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
