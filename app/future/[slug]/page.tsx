"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FUTURE_DEVELOPMENTS } from "@/app/lib/landing-data";
import { motion, useScroll, useTransform, AnimatePresence as Presence } from "framer-motion";
import { ArrowLeft, Rocket, Target, Milestone, Heart, X, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
import Footer from "@/app/components/landing/Footer";
import SupportModal from "@/app/components/landing/SupportModal";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function FutureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const project = FUTURE_DEVELOPMENTS[slug as keyof typeof FUTURE_DEVELOPMENTS] as any;

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "success") {
      setShowSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.08]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cinematic-ink)" }}>
        <div className="text-center space-y-8">
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
            Initiative not found.
          </h1>
          <Link href="/" className="inline-block text-token-micro font-black uppercase tracking-[0.3em] px-8 py-4" style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)", fontFamily: "var(--font-sans)" }}>
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const hasStats = project.stats?.length > 0;
  const hasMilestones = project.milestones?.length > 0;
  const hasHighlights = project.highlights?.length > 0;
  const hasFaq = project.faq?.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cinematic-ink)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 pointer-events-none flex justify-between items-start">
        <button onClick={() => router.push("/")} className="pointer-events-auto flex items-center gap-3 px-6 py-4 transition-all duration-300 group" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-cinematic-bone)" }}>
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-token-micro font-black uppercase tracking-[0.4em]" style={{ fontFamily: "var(--font-sans)" }}>Back home</span>
        </button>
        <span className="pointer-events-none text-token-micro font-black uppercase tracking-[0.4em] px-6 py-4" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {project.subtitle}
        </span>
      </nav>

      {/* Hero */}
      <section className="relative h-[85vh] overflow-hidden">
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.45) grayscale(10%)" }} />
        </motion.div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, var(--color-cinematic-ink) 100%)" }} />
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-20">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 flex items-center gap-2" style={{ background: "rgba(106,181,71,0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-cinematic-moss)" }} />
                <span className="text-token-micro font-black uppercase tracking-[0.4em]" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}>Projected Initiative</span>
              </div>
            </div>
            <h1 className="leading-[0.85] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
              {project.title.split(" ").slice(0, -1).join(" ")}{" "}
              <span style={{ color: "var(--color-cinematic-moss)" }}>{project.title.split(" ").slice(-1)[0]}</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 md:py-32" style={{ background: "var(--color-cinematic-ink)" }}>
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center justify-center w-16 h-16" style={{ background: "var(--color-cinematic-surface)", color: "var(--color-cinematic-moss)" }}>
            <Rocket size={28} strokeWidth={1.5} />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
            The mission <span style={{ color: "var(--color-cinematic-moss)" }}>&amp; philosophy.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)", opacity: 0.8 }}>
            &ldquo;{project.philosophy}&rdquo;
          </motion.p>
          <div className="pt-16 grid md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="p-10 text-left space-y-5" style={{ background: "var(--color-cinematic-ink)" }}>
              <div className="flex items-center gap-3">
                <Target size={16} style={{ color: "var(--color-cinematic-moss)" }} />
                <span className="text-token-micro font-black uppercase tracking-[0.35em]" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}>Strategic Vision</span>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{project.vision}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="p-10 text-left space-y-5" style={{ background: "var(--color-cinematic-ink)" }}>
              <div className="flex items-center gap-3">
                <Milestone size={16} style={{ color: "var(--color-cinematic-tang)" }} />
                <span className="text-token-micro font-black uppercase tracking-[0.35em]" style={{ color: "var(--color-cinematic-tang)", fontFamily: "var(--font-sans)" }}>Current Status</span>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{project.status}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {hasStats && (
        <section className="py-16" style={{ background: "var(--color-cinematic-surface)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
              {project.stats.map((s: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-8 md:p-10 text-center space-y-2" style={{ background: "var(--color-cinematic-surface)" }}>
                  <div className="tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-moss)" }}>{s.value}</div>
                  <div className="text-token-micro font-black uppercase tracking-[0.3em]" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Strategic Sections */}
      <section className="py-16 md:py-24" style={{ background: "var(--color-cinematic-ink)" }}>
        <div className="max-w-6xl mx-auto px-6 space-y-px">
          {project.sections.map((section: any, idx: number) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08, ease: EASE }} className="flex flex-col md:flex-row items-stretch" style={{ background: "var(--color-cinematic-surface)" }}>
              <div className={`flex-1 p-10 md:p-14 space-y-5 ${idx % 2 === 1 ? "md:order-2" : ""}`}>
                <span className="font-black leading-none select-none" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "2.5rem", color: "rgba(255,255,255,0.04)" }}>0{idx + 1}</span>
                <h3 className="text-token-caption font-black uppercase tracking-[0.3em]" style={{ color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}>{section.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{section.content}</p>
              </div>
              <div className="hidden md:flex w-20 items-center justify-center" style={{ background: "var(--color-cinematic-ink)" }}>
                <div className="w-px h-12" style={{ background: idx % 2 === 0 ? "var(--color-cinematic-moss)" : "var(--color-cinematic-tang)", opacity: 0.25 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      {hasMilestones && (
        <section className="py-20 md:py-28" style={{ background: "var(--color-cinematic-surface)" }}>
          <div className="max-w-4xl mx-auto px-6 space-y-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
              The road <span style={{ color: "var(--color-cinematic-moss)" }}>ahead.</span>
            </motion.h2>
            <div className="relative">
              <div className="absolute left-[18px] md:left-1/2 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              {project.milestones.map((m: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={`relative flex items-start gap-6 mb-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} md:text-${i % 2 === 0 ? "right" : "left"}`}>
                  <div className="hidden md:block flex-1" />
                  <div className="relative z-10 w-9 h-9 shrink-0 flex items-center justify-center" style={{ background: "var(--color-cinematic-surface)", border: "2px solid var(--color-cinematic-moss)" }}>
                    <div className="w-2 h-2" style={{ background: "var(--color-cinematic-moss)" }} />
                  </div>
                  <div className="flex-1 space-y-1 pb-2">
                    <div className="text-token-micro font-black uppercase tracking-[0.35em]" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}>{m.year}</div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{m.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      {hasHighlights && (
        <section className="py-20 md:py-28" style={{ background: "var(--color-cinematic-ink)" }}>
          <div className="max-w-5xl mx-auto px-6 space-y-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
              What sets this <span style={{ color: "var(--color-cinematic-moss)" }}>apart.</span>
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-4">
              {project.highlights.map((h: string, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -15 : 15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-4 p-5" style={{ background: "var(--color-cinematic-surface)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-cinematic-moss)" }} />
                  <span className="text-sm leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{h}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {hasFaq && (
        <section className="py-20 md:py-28" style={{ background: "var(--color-cinematic-surface)" }}>
          <div className="max-w-3xl mx-auto px-6 space-y-14">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
              Common <span style={{ color: "var(--color-cinematic-moss)" }}>questions.</span>
            </motion.h2>
            <div className="space-y-px">
              {project.faq.map((item: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} style={{ background: "var(--color-cinematic-ink)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left transition-colors duration-200" style={{ color: "var(--color-cinematic-bone)" }}>
                    <span className="text-sm font-bold pr-8" style={{ fontFamily: "var(--font-sans)" }}>{item.q}</span>
                    <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} style={{ color: "var(--color-cinematic-dim)" }} />
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openFaq === i ? "300px" : "0px", opacity: openFaq === i ? 1 : 0 }}>
                    <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>{item.a}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Support CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: "var(--color-cinematic-deep)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(106,181,71,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
            Ready to partner with<br /><span style={{ color: "var(--color-cinematic-moss)" }}>future excellence.</span>
          </motion.h2>
          <div className="flex justify-center flex-wrap gap-4 pt-4">
            <button onClick={() => setIsSupportModalOpen(true)} className="text-token-micro font-black uppercase tracking-[0.3em] px-10 py-5 transition-opacity duration-200 hover:opacity-85" style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)", fontFamily: "var(--font-sans)" }}>
              Support this Initiative
            </button>
            <button onClick={() => router.push("/")} className="text-token-micro font-black uppercase tracking-[0.3em] px-10 py-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/30" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)", background: "transparent" }}>
              Back home
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} initiativeTitle={project.title} initiativeSlug={slug} />

      <Presence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-center" style={{ background: "var(--color-cinematic-ink)" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-xl space-y-8 relative">
              <button onClick={() => setShowSuccess(false)} className="absolute -top-12 right-0 md:-right-12 transition-colors hover:text-[var(--color-cinematic-bone)]" style={{ color: "var(--color-cinematic-dim)" }}><X size={28} /></button>
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-8" style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)" }}><Heart size={40} fill="currentColor" /></div>
              <h2 className="leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>Partnership<br /><span style={{ color: "var(--color-cinematic-moss)" }}>confirmed.</span></h2>
              <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}>Thank you for your generous contribution to the {project.title}. Your support directly fuels our mission of excellence and community transformation.</p>
              <button onClick={() => setShowSuccess(false)} className="text-token-micro font-black uppercase tracking-[0.3em] px-8 py-4 transition-all duration-200 hover:border-white/30" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--color-cinematic-bone)", fontFamily: "var(--font-sans)" }}>Return to Initiative</button>
            </motion.div>
          </motion.div>
        )}
      </Presence>
    </div>
  );
}
