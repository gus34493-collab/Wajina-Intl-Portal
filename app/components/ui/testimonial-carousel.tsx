"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  imageUrl: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
  interval?: number;
}

export default function TestimonialCarousel({
  testimonials,
  className = "",
  interval = 5000,
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(advance, interval);
    return () => clearInterval(t);
  }, [advance, interval, testimonials.length]);

  const current = testimonials[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.012 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Desktop: image left, card right overlapping; Mobile: stacked */}
          <div className="flex flex-col lg:flex-row lg:items-center">
            {/* Image */}
            <div className="relative flex-shrink-0 w-full lg:w-[400px]">
              {/* Moss corner frames */}
              <div
                className="absolute -top-4 -left-4 w-10 h-10 z-20 pointer-events-none"
                style={{
                  borderTop: "2px solid var(--color-cinematic-moss)",
                  borderLeft: "2px solid var(--color-cinematic-moss)",
                }}
              />
              <div
                className="absolute -bottom-4 -right-4 w-10 h-10 z-20 pointer-events-none lg:hidden"
                style={{
                  borderBottom: "2px solid var(--color-cinematic-moss)",
                  borderRight: "2px solid var(--color-cinematic-moss)",
                }}
              />

              <div
                className="relative aspect-square overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}
              >
                <Image
                  src={current.imageUrl}
                  alt={current.name}
                  fill
                  unoptimized
                  className="object-cover"
                  style={{ filter: "grayscale(20%)" }}
                />
                {/* Fade right edge on desktop */}
                <div
                  className="absolute inset-0 hidden lg:block"
                  style={{
                    background:
                      "linear-gradient(to right, transparent 55%, var(--color-cinematic-surface) 100%)",
                  }}
                />
                {/* Bottom fade on mobile */}
                <div
                  className="absolute inset-0 lg:hidden"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 55%, var(--color-cinematic-ink) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Card */}
            <div
              className="relative z-10 p-8 lg:p-12 space-y-7 lg:-ml-20 mt-6 lg:mt-0"
              style={{
                background: "var(--color-cinematic-cream)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(0,0,0,0.15), 0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              {/* Opening quote mark */}
              <span
                className="block text-6xl leading-none select-none"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-cinematic-moss)",
                  opacity: 0.5,
                }}
              >
                &ldquo;
              </span>

              <blockquote
                className="leading-relaxed"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1rem, 2vw, 1.3rem)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: "var(--color-cinematic-ink)",
                }}
              >
                {current.quote}
              </blockquote>

              <div className="space-y-1 pt-1">
                <p
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
                >
                  {current.name}
                </p>
                <p
                  className="text-token-micro font-black uppercase tracking-widest"
                  style={{ color: "var(--color-cinematic-ink)", opacity: 0.45, fontFamily: "var(--font-sans)" }}
                >
                  {current.role}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
