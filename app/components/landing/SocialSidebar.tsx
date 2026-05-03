"use client";

import { motion } from "framer-motion";
import { Mail, X, Globe, Info } from "lucide-react";

export default function SocialSidebar() {
  const socials = [
    { icon: <Globe size={18} />, href: "#" },
    { icon: <X size={18} />, href: "#" },
    { icon: <Mail size={18} />, href: "mailto:info@wajina.com.ng" },
    { icon: <Info size={18} />, href: "#" },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 z-50 flex flex-col justify-center">
      <motion.div 
        initial={{ x: -60 }}
        animate={{ x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="bg-brand-primary border-r border-white/10 py-6 md:py-10 flex flex-col items-center gap-6 md:gap-8 px-2 md:px-4"
      >
        <div className="h-12 w-px bg-brand-accent/40 mb-2" />
        
        {socials.map((social, idx) => (
          <a
            key={idx}
            href={social.href}
            className="text-white/40 hover:text-brand-secondary transition-all hover:scale-110 active:scale-95"
          >
            {social.icon}
          </a>
        ))}

        <div className="h-32 w-px bg-brand-accent/40 mt-2" />
        
        <div className="rotate-90 origin-center whitespace-nowrap py-4 md:py-10">
          <span className="text-token-micro md:text-token-micro font-black uppercase tracking-[0.5em] text-white/40">
            CONNECT WITH US
          </span>
        </div>
      </motion.div>
    </div>
  );
}

