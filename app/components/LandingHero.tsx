"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, ShieldCheck, GraduationCap } from "lucide-react";

export function LandingHero() {
  const router = useRouter();

  return (
    <>
      <section className="relative pt-20 pb-32 px-4 md:px-0">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 bg-brand-moonstone/10 text-brand-moonstone px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <Zap className="w-3 h-3" />
              Intelligence Driven Education
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black text-brand-gunmetal leading-tight mb-6 max-w-4xl">
              The Future of <span className="text-brand-moonstone">Wajina International</span> is Here.
            </h1>
            
            <p className="text-text-secondary text-lg md:text-xl font-medium max-w-2xl mb-12">
              Next-generation educational management portal for parents, teachers, and administrators. 
              Secure, lightning-fast, and intelligence-driven.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => router.push('/portal')}
                className="bg-brand-moonstone text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-brand-moonstone/20 group"
              >
                Access Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white border border-black/5 text-brand-gunmetal font-black py-5 px-10 rounded-2xl hover:bg-black/5 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-brand-moonstone" />}
              title="Military-Grade Security"
              desc="End-to-end encryption for all student records and financial transactions."
            />
            <FeatureCard 
              icon={<GraduationCap className="w-6 h-6 text-brand-saffron" />}
              title="Academic Insights"
              desc="Real-time performance tracking and predictive grading analytics."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-brand-moonstone" />}
              title="Edge Performance"
              desc="Instant page loads and zero-latency interface interactions."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white border border-black/5 p-10 rounded-[40px] shadow-premium flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-brand-bg rounded-3xl flex items-center justify-center mb-8 shadow-sm">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-black mb-4 text-brand-gunmetal">{title}</h3>
      <p className="text-text-secondary text-base font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}
