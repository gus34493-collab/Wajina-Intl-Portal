"use client";

import { useParams, useRouter } from "next/navigation";
import { ACADEMIC_PROGRAMS } from "@/app/lib/landing-data";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, CheckCircle2, LayoutGrid, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import Footer from "@/app/components/landing/Footer";

export default function AcademicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const program = ACADEMIC_PROGRAMS[slug as keyof typeof ACADEMIC_PROGRAMS];

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

  if (!program) {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-4xl font-display mb-8">Program Not Found</h1>
          <Link href="/" className="btn-accent">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-brand-secondary selection:text-brand-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-10 pointer-events-none">
        <button 
          onClick={() => router.push("/")}
          className="pointer-events-auto flex items-center gap-4 bg-brand-primary text-white p-4 md:px-8 md:py-5 shadow-2xl hover:bg-brand-accent transition-all group"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Back home</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden bg-brand-primary">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img 
            src={program.heroImage} 
            alt={program.title} 
            className="w-full h-full object-cover contrast-110 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/40 to-transparent" />
        </motion.div>

        <div className="relative h-full container mx-auto px-6 flex flex-col justify-end pb-20 md:pb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <span className="text-brand-secondary font-black text-xs md:text-sm tracking-[0.6em] uppercase mb-6 block">
              {program.subtitle}
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-black text-white leading-[0.85] uppercase mb-12">
              {program.title.split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 md:py-40 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="w-24 h-1 bg-brand-accent" />
              <h2 className="text-4xl md:text-6xl font-display font-black text-brand-primary leading-tight uppercase">
                The Institutional<br />Philosophy.
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xl md:text-2xl text-brand-primary font-medium leading-relaxed opacity-80">
                {program.philosophy}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Program Details - Slabs */}
      <section className="py-24 md:py-40 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-px bg-brand-primary/10 border border-brand-primary/10">
            {program.sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-12 md:p-20 space-y-8 group hover:bg-brand-primary transition-colors duration-500"
              >
                <div className="w-12 h-12 bg-brand-accent rounded-none flex items-center justify-center text-white transition-transform group-hover:scale-110">
                  {idx === 0 ? <LayoutGrid size={24} /> : <Sparkles size={24} />}
                </div>
                <h3 className="text-3xl font-display font-black uppercase text-brand-primary group-hover:text-white transition-colors">
                  {section.title}
                </h3>
                <p className="text-lg text-brand-primary/70 group-hover:text-white/70 transition-colors leading-relaxed">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes & CTA */}
      <section className="py-24 md:py-40 bg-brand-primary text-white overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
           <GraduationCap size={800} className="translate-x-1/2 -translate-y-1/4" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-7xl font-display font-black uppercase leading-[0.9] mb-20">
              Institutional<br />
              <span className="text-brand-accent">Outcomes.</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-8 mb-24">
              {program.outcomes.map((outcome, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 text-lg md:text-xl font-black uppercase tracking-widest"
                >
                  <CheckCircle2 className="text-brand-accent" size={24} />
                  {outcome}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/#admissions" className="btn-accent !px-12 !py-6 text-center">
                Inquire for Admission
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer minimal={true} />
    </div>
  );
}
