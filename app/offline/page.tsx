"use client";

import { motion } from "framer-motion";
import { WifiOff, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-brand-blush flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-tertiary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-brand-primary/8 p-12 rounded-[40px] shadow-premium flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-blush rounded-3xl flex items-center justify-center mb-8 shadow-sm">
            <WifiOff className="w-10 h-10 text-brand-error animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight mb-4 uppercase italic">Offline Archive</h1>
          <p className="text-brand-primary/60 text-sm font-medium leading-relaxed mb-10">
            You're currently disconnected from the Intelligence Core. Some dashboard functions may be restricted until synchronization is restored.
          </p>

          <div className="grid grid-cols-1 gap-4 w-full">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-tertiary text-white font-black text-xs py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-brand-tertiary/20"
            >
              <RefreshCw size={14} /> Attempt Re-Sync
            </button>
            <Link 
              href="/portal"
              className="w-full bg-brand-primary text-white font-black text-xs py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
            >
              <Home size={14} /> Return to Portal
            </Link>
          </div>
        </div>

        <p className="mt-12 text-token-micro font-black text-brand-tertiary uppercase tracking-[0.3em] opacity-30">
          Wajina International • Offline Continuity
        </p>
      </motion.div>
    </div>
  );
}

