"use client";

import { motion } from "framer-motion";
import { Baby, BookOpen, GraduationCap } from "lucide-react";

const programs = [
  {
    icon: <Baby className="w-10 h-10" />,
    title: "Primary Education",
    description: "Building strong foundations with engaging curricula that spark curiosity and develop core academic skills.",
    features: ["Core Academics", "Languages", "STEM Programs", "Arts & Culture"]
  },
  {
    icon: <BookOpen className="w-10 h-10" />,
    title: "Secondary Education",
    description: "Advanced learning with specialized pathways helping students excel in Forms 1-4 and beyond.",
    features: ["British Curriculum", "IGCSE Programs", "Subject Specialization", "Exam Preparation"]
  },
  {
    icon: <GraduationCap className="w-10 h-10" />,
    title: "Enrichment Programs",
    description: "Special programs to develop leadership, critical thinking, and real-world skills.",
    features: ["Leadership Development", "Project-Based Learning", "Career Awareness", "Skill Building"]
  }
];

export default function Programs() {
  return (
    <section className="py-24 bg-brand-primary" id="academics">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-display font-black text-white">
            Academic Programs
          </h2>
          <div className="h-1.5 w-24 bg-brand-secondary mx-auto" />
          <p className="text-white/60 text-lg">
            Comprehensive curriculum designed to help students excel and achieve their full potential.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {programs.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-10 space-y-8 hover:bg-white/10 transition-colors duration-500"
            >
              <div className="text-brand-secondary">
                {program.icon}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                  {program.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {program.description}
                </p>
              </div>

              <ul className="space-y-3">
                {program.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 bg-brand-secondary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

