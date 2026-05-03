"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
            <Badge variant="outline" className="gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border-brand-tertiary/20 text-brand-tertiary bg-brand-tertiary/5">
              <Zap className="w-3 h-3 fill-current" />
              Intelligence Driven Education
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-display font-black leading-tight mb-6 max-w-4xl">
              The Future of <span className="text-brand-tertiary">Wajina International</span> is Here.
            </h1>
            
            <p className="text-brand-tertiary-foreground text-lg md:text-xl font-medium max-w-2xl mb-12">
              Next-generation educational management portal for parents, teachers, and administrators. 
              Secure, lightning-fast, and intelligence-driven.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => router.push('/portal')}
                className="bg-brand-tertiary hover:bg-brand-tertiary/90 text-white font-black px-10 py-8 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 group text-lg"
              >
                Access Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="font-black py-8 px-10 rounded-2xl text-lg"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-brand-tertiary" />}
              title="Military-Grade Security"
              desc="End-to-end encryption for all student records and financial transactions."
            />
            <FeatureCard 
              icon={<GraduationCap className="w-6 h-6 text-brand-accent" />}
              title="Academic Insights"
              desc="Real-time performance tracking and predictive grading analytics."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-brand-tertiary" />}
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
    <motion.div whileHover={{ y: -5 }}>
      <Card className="p-10 rounded-[40px] flex flex-col items-center text-center border-border/50 shadow-soft h-full">
        <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mb-8 shadow-sm">
          {icon}
        </div>
        <h3 className="text-2xl font-display font-black mb-4">{title}</h3>
        <p className="text-brand-tertiary-foreground text-base font-medium leading-relaxed">{desc}</p>
      </Card>
    </motion.div>
  );
}

