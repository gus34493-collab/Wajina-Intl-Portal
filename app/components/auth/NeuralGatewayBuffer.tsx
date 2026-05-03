"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function NeuralGatewayBuffer() {
  return (
    <motion.div
      key="buffer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-primary flex flex-col items-center justify-center gap-8"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
        className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10"
      >
        <Image
          src="/images/logo-no-bg.png"
          alt="Wajina International Schools"
          width={64}
          height={64}
          priority
          className="object-contain grayscale brightness-200 opacity-50"
          style={{ width: "var(--space-16)", height: "var(--space-16)" }}
        />
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-brand-accent animate-pulse" />
          <p className="text-token-micro font-black uppercase tracking-[0.5em] text-white italic">Loading your workspace...</p>
        </div>
        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden mt-4 relative">
          <motion.div
            initial={{ x: "-200%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
            className="absolute top-0 bottom-0 left-0 w-1/2 bg-brand-accent shadow-[0_0_15px_rgba(163,230,53,0.5)]"
          />
        </div>
      </div>
    </motion.div>
  );
}

