"use client";

import React from "react";
import { FullScreenScrollFX } from "@/components/ui/full-screen-scroll-fx";

const sections = [
  {
    id: "foundation",
    leftLabel: "The Beginning",
    title: "Foundation",
    rightLabel: "Nurture",
    description: "Curiosity awakened. Wajina's early years build language, number sense, and wonder through structured play and discovery.",
    background: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=2000",
  },
  {
    id: "discovery",
    leftLabel: "Primary Years",
    title: "Discovery",
    rightLabel: "Explore",
    description: "Expanding horizons through enquiry-based learning, rich literacy, and mathematical reasoning across the primary school years.",
    background: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2000",
  },
  {
    id: "excellence",
    leftLabel: "Secondary Years",
    title: "Excellence",
    rightLabel: "Mastery",
    description: "Academic rigour at its highest. Students build deep subject mastery under specialist teachers, preparing for national examinations and a lifetime of learning.",
    background: "https://images.unsplash.com/photo-1523050853051-be99179000ba?auto=format&fit=crop&q=80&w=2000",
  },
  {
    id: "character",
    leftLabel: "Core Values",
    title: "Character",
    rightLabel: "Integrity",
    description: "Leadership, empathy, and moral courage forged through co-curricular life, mentorship, and values-based reflection.",
    background: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=2000",
  },
  {
    id: "innovation",
    leftLabel: "Modern World",
    title: "Innovation",
    rightLabel: "Adapt",
    description: "Critical thinking, technology fluency, and entrepreneurial spirit equip students to shape — not just survive — change.",
    background: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=2000",
  },
  {
    id: "impact",
    leftLabel: "Global Leadership",
    title: "Impact",
    rightLabel: "Legacy",
    description: "Wajina graduates enter universities, careers, and communities as confident, principled leaders ready to leave a mark.",
    background: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=2000",
  },
];

export default function SixStages() {
  return (
    <section className="relative">
      <FullScreenScrollFX
        sections={sections}
        sectionHeightVh={40}
        columnHeaders={{ left: "Period", right: "Ethos" }}
        header={
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-moss mb-4">The Wajina Path</span>
            <div className="flex gap-4 items-baseline">
              <span className="font-display italic text-6xl md:text-8xl text-bone">Six</span>
              <span className="font-display text-4xl md:text-6xl text-moss">Stages.</span>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col items-center pt-8">
            <span className="font-display italic text-4xl md:text-5xl text-bone">One Journey.</span>
          </div>
        }
        fontFamily="var(--font-display)"
        colors={{
          text: "var(--color-cinematic-bone)",
          overlay: "rgba(14, 18, 10, 0.45)",
          pageBg: "var(--color-cinematic-ink)",
          stageBg: "#000000",
        }}
        showProgress
        durations={{ change: 0.8, snap: 1000 }}
      />
    </section>
  );
}
