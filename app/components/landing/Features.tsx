"use client";

import { motion } from "framer-motion";
import {
  Baby,
  BookOpen,
  Beaker,
  Globe,
  Music,
  Swords,
  Heart,
  Brain,
  Medal,
} from "lucide-react";

const PILLARS = [
  {
    num: "01",
    title: "Play-Based Early Years",
    subtitle: "Creche · Nursery · Reception",
    desc: "Where learning begins with wonder. Our youngest learners explore language, numeracy, and social skills through structured play, phonics, and sensory discovery in a warm, nurturing environment.",
    icon: Baby,
    accent: "var(--color-cinematic-moss)",
  },
  {
    num: "02",
    title: "Primary Foundation",
    subtitle: "Literacy · Numeracy · Basic Science",
    desc: "A rigorous primary curriculum grounded in the Nigerian NERDC framework — phonics-led reading, mental mathematics, social studies, and hands-on basic science that builds confident, curious learners.",
    icon: BookOpen,
    accent: "var(--color-cinematic-tang)",
  },
  {
    num: "03",
    title: "Dual Secondary Curriculum",
    subtitle: "WAEC + Cambridge IGCSE",
    desc: "At secondary level, students pursue the Nigerian WAEC syllabus alongside the internationally recognised Cambridge IGCSE — earning dual certification and doubling their global opportunities.",
    icon: Globe,
    accent: "var(--color-cinematic-moss)",
  },
  {
    num: "04",
    title: "STEM & Innovation",
    subtitle: "Coding · Robotics · Lab Sciences",
    desc: "From primary science fairs to secondary robotics workshops and structured coding programmes, students learn to think computationally and solve real-world problems at every stage.",
    icon: Beaker,
    accent: "var(--color-cinematic-tang)",
  },
  {
    num: "05",
    title: "Faith & Character",
    subtitle: "Rooted in the Fear of God",
    desc: "Morning devotions, Bible studies, and values-driven assemblies anchor every child's day. We raise children who lead with conscience before ambition — from nursery through graduation.",
    icon: Heart,
    accent: "var(--color-cinematic-moss)",
  },
  {
    num: "06",
    title: "Creative & Performing Arts",
    subtitle: "Music · Drama · Fine Art",
    desc: "Primary pupils discover rhythm and colour through art classes and recitals. Secondary students take the stage in inter-house drama festivals, instrumental training, and exhibitions.",
    icon: Music,
    accent: "var(--color-cinematic-tang)",
  },
  {
    num: "07",
    title: "Leadership Formation",
    subtitle: "Class Monitors to Model UN",
    desc: "Leadership starts in primary with class monitors and reading buddies, then scales through prefect councils, debating societies, and Model UN at secondary — forging decisive, empathetic leaders.",
    icon: Medal,
    accent: "var(--color-cinematic-moss)",
  },
  {
    num: "08",
    title: "Sports & Physical Wellness",
    subtitle: "Primary Sports Day to Inter-School Athletics",
    desc: "From egg-and-spoon races in primary to competitive football, basketball, and swimming at secondary — physical education builds resilience, teamwork, and discipline across all ages.",
    icon: Swords,
    accent: "var(--color-cinematic-tang)",
  },
  {
    num: "09",
    title: "Critical Thinking",
    subtitle: "Beyond Rote Learning",
    desc: "Our teachers don't just deliver content. From guided questioning in primary classrooms to Socratic seminars in secondary, every child learns to inquire, connect, and reason independently.",
    icon: Brain,
    accent: "var(--color-cinematic-moss)",
  },
];

export default function Features() {
  return (
    <section id="pillars" className="py-32 px-6" style={{ background: "var(--color-cinematic-surface)" }}>
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-8"
        >
          <div className="space-y-4 max-w-xl">
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
              What we teach.
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>How we shape.</span>
            </h2>
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
            >
              From play-based discovery in our creche to dual-certified examinations
              at senior secondary — nine pillars that define the Wajina experience
              across every stage of your child&apos;s journey.
            </p>
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-widest tabular-nums shrink-0"
            style={{ color: "var(--color-cinematic-dim-2)", fontFamily: "var(--font-sans)" }}
          >
            {String(PILLARS.length).padStart(2, "0")} Pillars
          </span>
        </motion.div>

        {/* Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.num}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group p-10 space-y-6 transition-all duration-300 cursor-default"
              style={{ background: "var(--color-cinematic-surface)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-cinematic-surface-2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-cinematic-surface)")
              }
            >
              <div className="flex items-start justify-between">
                <span
                  className="font-black leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "3.5rem",
                    color: "rgba(255,255,255,0.04)",
                  }}
                >
                  {pillar.num}
                </span>
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.03)", color: pillar.accent }}
                >
                  <pillar.icon size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <h3
                  className="text-[11px] font-black uppercase tracking-[0.3em] transition-colors duration-300"
                  style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}
                >
                  {pillar.title}
                </h3>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: pillar.accent, fontFamily: "var(--font-sans)" }}
                >
                  {pillar.subtitle}
                </p>
                <p
                  className="text-sm leading-relaxed pt-1"
                  style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
                >
                  {pillar.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
