"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Pupil", "Parent", "Alumna"] as const;
type Tab = (typeof TABS)[number];

const QUOTES: Record<Tab, { quote: string; name: string; detail: string }[]> = {
  Pupil: [
    {
      quote:
        "Wajina didn't just teach me chemistry. It taught me how to think, how to fail, and how to rise. I graduated with a distinction and a character I'm proud of.",
      name: "Adaeze Okafor",
      detail: "Year 11 · IGCSE Track",
    },
    {
      quote:
        "The science labs and debate club changed everything for me. I had never spoken in public before. Now I represent my state at national competitions.",
      name: "Emeka Usman",
      detail: "Year 9 · Innovation Hub",
    },
  ],
  Parent: [
    {
      quote:
        "My daughter came home one evening reciting Achebe. Not because she was told to — because she wanted to. That is the Wajina effect.",
      name: "Mrs. Bello-Adeyemi",
      detail: "Parent · Year 7 Student",
    },
    {
      quote:
        "The portal gives us real-time visibility into grades, attendance, and fees. We feel like partners in our son's education, not bystanders.",
      name: "Mr. Terna Agber",
      detail: "Parent · Year 10 Student",
    },
  ],
  Alumna: [
    {
      quote:
        "I attended Oxford on a scholarship. My interviewers were surprised by my writing. They asked where I had studied. Wajina, I said. They wrote it down.",
      name: "Chiamaka Nwachukwu",
      detail: "Class of 2019 · Oxford University",
    },
    {
      quote:
        "Every board meeting I walk into, I remember the leadership modules from Year 10. Wajina planted discipline in me before the world demanded it.",
      name: "Yusuf Saleh Kila",
      detail: "Class of 2017 · Founder, TerraLogic Africa",
    },
  ],
};

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState<Tab>("Pupil");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeTab]);

  useEffect(() => {
    const items = QUOTES[activeTab];
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % items.length),
      7000
    );
    return () => clearInterval(t);
  }, [activeTab]);

  const current = QUOTES[activeTab][activeIndex];

  return (
    <section
      className="py-32 px-6 relative overflow-hidden"
      style={{ background: "var(--color-cinematic-deep)" }}
    >
      {/* Radial moss glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 100%, rgba(106,181,71,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10 space-y-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2
            className="leading-[0.9] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-cinematic-bone)",
            }}
          >
            In their
            <br />
            <span style={{ color: "var(--color-cinematic-moss)" }}>own words.</span>
          </h2>
        </motion.div>

        {/* Tab switcher */}
        <div
          className="flex justify-center"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-8 py-3 text-token-micro font-black uppercase tracking-[0.3em] transition-colors duration-200"
              style={{
                color: activeTab === tab ? "var(--color-cinematic-moss)" : "var(--color-cinematic-dim)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: "var(--color-cinematic-moss)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Quote */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeIndex}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-8 px-4"
          >
            <span
              className="block text-5xl leading-none select-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-cinematic-moss)",
                opacity: 0.35,
              }}
            >
              &ldquo;
            </span>
            <blockquote
              className="leading-relaxed mx-auto"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--color-cinematic-bone)",
                maxWidth: "680px",
              }}
            >
              {current.quote}
            </blockquote>
            <div className="space-y-1">
              <p
                className="font-black text-sm uppercase tracking-widest"
                style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
              >
                {current.name}
              </p>
              <p
                className="text-token-micro font-black uppercase tracking-widest"
                style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
              >
                {current.detail}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {QUOTES[activeTab].map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="transition-all duration-300"
              style={{
                width: i === activeIndex ? "24px" : "6px",
                height: "6px",
                background:
                  i === activeIndex ? "var(--color-cinematic-moss)" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
