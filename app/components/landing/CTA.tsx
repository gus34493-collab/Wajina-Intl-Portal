import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTA({ onApplyClick }: { onApplyClick?: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.5, 1]);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-60 overflow-hidden bg-brand-primary" id="admissions">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          style={{ scale, opacity }}
          className="bg-brand-primary rounded-[48px] p-12 md:p-32 overflow-hidden shadow-2xl relative"
        >
          {/* Animated Texture Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-brand-secondary)_0%,transparent_70%)]" />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-24 relative z-10">
            <div className="flex-1 text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-12"
              >
                <div className="w-16 h-px bg-brand-accent" />
                <span className="text-brand-accent font-sans font-bold tracking-[0.6em] text-token-micro uppercase">
                  Legacy Admissions
                </span>
              </motion.div>
              
              <h2 className="text-6xl md:text-[10rem] font-display italic text-white leading-[0.8] tracking-tighter mb-12">
                READY TO<br />
                <span className="text-brand-secondary">SHAPE THE</span><br />
                FUTURE?
              </h2>
              
              <p className="text-xl md:text-2xl text-white/50 max-w-xl font-sans font-medium leading-relaxed">
                Join a community where academic excellence meets profound character development.
                Secure your place in the next generation of global leaders.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex-1 w-full max-w-2xl"
            >
              <div className="bg-white/5 backdrop-blur-3xl p-12 md:p-20 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-brand-secondary opacity-20 group-hover:scale-125 transition-transform duration-700">
                  <Sparkles size={80} />
                </div>

                <h3 className="text-3xl font-display italic text-white mb-8">
                  Begin Your Application
                </h3>
                <p className="text-white/60 mb-16 text-lg leading-relaxed">
                  Enrollment for the 2024/2025 academic session is now active across all global campuses.
                </p>

                <button
                  onClick={onApplyClick}
                  className="w-full bg-brand-accent text-brand-primary font-sans font-black py-7 rounded-full flex items-center justify-center gap-4 hover:bg-white transition-all duration-500 uppercase tracking-[0.4em] text-xs shadow-2xl hover:-translate-y-2 group"
                >
                  Apply Now <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>

                <div className="mt-12 flex items-center justify-center gap-4 text-white/30">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-token-micro uppercase tracking-[0.3em] font-bold">Limited Spaces</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

