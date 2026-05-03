"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Globe, Award, Shield } from "lucide-react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const icons = [
  { Icon: GraduationCap, top: "15%", left: "5%", size: 40, delay: 0 },
  { Icon: BookOpen, top: "45%", right: "8%", size: 32, delay: 2 },
  { Icon: Globe, bottom: "25%", left: "10%", size: 48, delay: 1 },
  { Icon: Award, top: "75%", right: "12%", size: 36, delay: 3 },
  { Icon: Shield, top: "10%", right: "20%", size: 28, delay: 0.5 },
];

export default function FloatingElements() {
  const { isMobile, isTablet } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const shapes = [
    // Large atmospheric blobs (Modern style) - Scaled for mobile
    { 
      size: isMobile ? 300 : isTablet ? 500 : 800, 
      top: "-10%", left: "-10%", 
      color: "from-brand-secondary/10 via-transparent to-transparent", 
      duration: 25, delay: 0 
    },
    { 
      size: isMobile ? 250 : isTablet ? 400 : 600, 
      bottom: "10%", right: "-5%", 
      color: "from-brand-accent/5 via-transparent to-transparent", 
      duration: 30, delay: 2 
    },
    { 
      size: isMobile ? 200 : isTablet ? 350 : 500, 
      top: "40%", right: "10%", 
      color: "from-brand-primary/10 via-transparent to-transparent", 
      duration: 22, delay: 5 
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Drifting Geometric Rings / Blobs */}
      {shapes.map((shape, i) => (
        <motion.div
          key={`shape-${i}`}
          className={`absolute rounded-full bg-gradient-to-br ${shape.color} blur-[120px]`}
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
            willChange: "transform",
          }}
          animate={{
            y: [0, -60, 0],
            rotate: [0, 45, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Drifting Education Icons */}
      {icons.map((item, i) => (
        <motion.div
          key={`icon-${i}`}
          className="absolute text-brand-primary opacity-[0.03] lg:opacity-[0.05]"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            willChange: "transform",
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6 + i,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <item.Icon size={item.size} strokeWidth={1} />
        </motion.div>
      ))}

      {/* Subtle Dust Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 bg-brand-primary rounded-full opacity-[0.05]"
          style={{
            top: `${(i * 137) % 100}%`, // Deterministic random-like values
            left: `${(i * 251) % 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.1, 0],
          }}
          transition={{
            duration: 5 + (i % 5),
            delay: (i % 10),
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

