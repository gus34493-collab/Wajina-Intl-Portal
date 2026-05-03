"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const developments = [
  {
    slug: "alumni",
    title: "Wajina Alumni Circle",
    subtitle: "GLOBAL NETWORK",
    desc: "Reuniting our global community of past students for mentorship, professional networking, and institutional growth. Join a legacy that spans continents.",
    items: ["Mentorship Circle", "Alumni Directory", "Legacy Networking", "Career Support"],
    image: "/images/developments/alumni.png",
    theme: "bg-brand-primary text-white",
    status: "Coming Soon"
  },
  {
    slug: "foundation",
    title: "The Wajina Foundation",
    subtitle: "COMMUNITY REACH",
    desc: "Our dedicated philanthropic arm focused on community empowerment, rural education support, and global outreach. Driven by compassion and excellence.",
    items: ["Rural Literacy", "Philanthropic Missions", "Book Distribution", "Empowerment Funds"],
    image: "/images/developments/foundation.png",
    theme: "bg-brand-accent text-white",
    status: "Coming Soon"
  },
  {
    slug: "college",
    title: "Wajina College of Excellence",
    subtitle: "TERTIARY WING",
    desc: "Expanding our horizons with a specialized higher education wing designed to produce the next generation of global industry leaders and innovators.",
    items: ["Tertiary Degrees", "Specialized Training", "Strategic Research", "Innovation Hub"],
    image: "/images/developments/college.png",
    theme: "bg-brand-primary-light text-white",
    status: "Coming Soon"
  },
  {
    slug: "adult-learning",
    title: "Accelerated Learning Path",
    subtitle: "ADULT EDUCATION",
    desc: "A fast-track schooling initiative providing comprehensive primary and secondary education for adults who missed early learning opportunities.",
    items: ["Fast-Track Primary", "Adult Secondary", "Skill Acquisition", "Basic Literacy"],
    image: "/images/developments/adult_learning.png",
    theme: "bg-brand-primary text-white",
    status: "Coming Soon"
  },
  {
    slug: "scholarship",
    title: "Legacy Scholarship Fund",
    subtitle: "INCLUSIVE ACCESS",
    desc: "A humanitarian commitment to ensuring that world-class education remains accessible to gifted students from all socioeconomic backgrounds across the region.",
    items: ["Merit Awards", "Financial Aid", "Gifted Students", "Global Scholarships"],
    image: "/images/developments/scholarship.png",
    theme: "bg-brand-primary text-white",
    status: "Coming Soon"
  }
];

export default function IncomingDevelopments() {
  const { isMobile } = useBreakpoint();

  return (
    <section className="bg-transparent overflow-hidden" id="developments">
      <div className="container mx-auto px-6 py-32">
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{}}
          >
            <div className="section-divider" />
            <h2 className="text-4xl md:text-6xl font-display font-black text-brand-primary uppercase leading-tight md:leading-[0.85] mb-4">
              INCOMING<br />
              <span className="text-brand-accent">DEVELOPMENTS.</span>
            </h2>
          </motion.div>
        </div>

        <div className="flex flex-col gap-40">
          {developments.map((dev, idx) => (
            <motion.div
              key={idx}
              className={`relative flex flex-col ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center`}
            >
              {/* The "Case" - Text Slab */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`relative z-20 w-full md:w-[600px] p-12 md:p-20 flex flex-col justify-center ${dev.theme} shadow-2xl rounded-none`}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-token-micro font-black tracking-[0.5em] opacity-60 uppercase">
                    {dev.subtitle}
                  </span>
                </div>

                <h3 className="text-4xl md:text-5xl font-display font-black mb-8 leading-tight uppercase">
                  {dev.title}
                </h3>
                <p className="text-lg opacity-80 mb-10 font-medium leading-relaxed max-w-lg">
                  {dev.desc}
                </p>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-12">
                  {dev.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 size={14} className="shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  href={`/future/${dev.slug}`}
                  className="flex items-center gap-3 text-token-micro font-black uppercase tracking-[0.3em] group cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                >
                  Learn More <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              {/* The "Vinyl" - Image Slab coming out from behind */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: idx % 2 === 0 ? -150 : 150,
                  scale: 0.9
                }}
                whileInView={{
                  opacity: 1,
                  x: !isMobile ? (idx % 2 === 0 ? 60 : -60) : 0,
                  scale: 1
                }}
                viewport={{ margin: "-100px" }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                  delay: 0.2
                }}
                className={`relative z-10 w-full md:w-[600px] ${idx === 0 || idx === 1 ? "h-[455px] md:h-[580px]" :
                    idx === 4 ? "h-[510px] md:h-[650px]" :
                      "h-[440px] md:h-[560px]"
                  } overflow-hidden -mt-12 md:mt-0 md:-ml-20 md:-mr-20 shadow-xl rounded-none`}
              >
                <img
                  src={dev.image}
                  alt={dev.title}
                  className="absolute inset-0 w-full h-full object-cover grayscale-[20%] contrast-110"
                />
                <div className="absolute inset-0 bg-brand-primary/20 mix-blend-multiply" />

                {/* Coming Soon Badge Overlay - Positioned at the extreme outer edge of the image */}
                <div className={`absolute top-12 ${idx % 2 === 0 ? "right-0" : "left-0"} bg-brand-accent px-6 py-2 flex items-center gap-3 shadow-2xl z-30`}>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-token-caption font-black uppercase tracking-[0.2em] text-white">
                    {dev.status}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

