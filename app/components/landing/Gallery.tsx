"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const IMAGES = [
  { src: "/images/students-saluting.jpg", alt: "Students Saluting", span: "md:col-span-2 md:row-span-2" },
  { src: "/images/project-presentation.jpg", alt: "Project Presentation", span: "md:col-span-1 md:row-span-1" },
  { src: "/images/campus-building.jpg", alt: "Campus Environment", span: "md:col-span-1 md:row-span-2" },
  { src: "/images/students-saluting.jpg", alt: "Life at Wajina", span: "md:col-span-1 md:row-span-1" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="bg-brand-primary py-32 px-6">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <span className="text-brand-secondary text-token-micro font-black uppercase tracking-[0.5em]">THE WAJINA EXPERIENCE</span>
            <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter uppercase">
              LIFE AT <span className="text-brand-secondary">WAJINA</span>
            </h2>
            <div className="h-1 w-24 bg-brand-secondary" />
          </div>
          <p className="text-white/40 max-w-sm text-token-micro font-black uppercase tracking-[0.3em] leading-loose">
            Experience the vibrant community, personal growth, and academic milestones that make our campus truly special.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 aspect-square md:aspect-video">
          {IMAGES.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden group border border-white/5 ${img.span}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-transparent to-transparent opacity-60" />
              
              {/* Image Info */}
              <div className="absolute bottom-6 left-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-token-micro font-black text-white uppercase tracking-[0.2em]">{img.alt}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action */}
        <div className="flex justify-center pt-8">
          <button className="group flex items-center gap-6 text-token-micro font-black text-white uppercase tracking-[0.4em] hover:text-brand-secondary transition-all">
            View Full Gallery
            <div className="w-12 h-px bg-white/20 group-hover:bg-brand-secondary group-hover:w-16 transition-all" />
          </button>
        </div>
      </div>
    </section>
  );
}

