"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Receipt, Home, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="min-h-screen bg-brand-blush flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} gravity={0.1} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-soft p-10 text-center relative z-10 border border-brand-primary/8"
      >
        <div className="w-24 h-24 bg-brand-success/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-brand-success" />
        </div>

        <h1 className="text-3xl font-display font-black text-brand-primary mb-2 tracking-tight">Payment Validated</h1>
        <p className="text-brand-tertiary text-sm font-bold mb-10">Your transaction has been securely processed and institutional records updated.</p>

        <div className="bg-brand-blush rounded-2xl p-6 mb-10 border border-brand-primary/8 text-left">
          <div className="flex justify-between items-center mb-4 pb-4 border-bottom border-brand-primary/8">
            <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Receipt Reference</span>
            <span className="text-xs font-black text-brand-primary truncate ml-4">{ref || "WJ-REF-PENDING"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Status</span>
            <span className="px-3 py-1 rounded-full bg-brand-success/10 text-brand-success text-token-micro font-black uppercase">Official</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.push("/parent-dashboard")}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-md"
          >
            <Home size={18} />
            Return to Dashboard
          </button>
          
          <button 
            className="w-full py-4 bg-white text-brand-tertiary border border-brand-tertiary/20 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-tertiary/5 transition-all"
          >
            <Receipt size={18} />
            Download Digital Receipt
          </button>
        </div>

        <p className="mt-8 text-token-micro font-bold text-brand-tertiary">
           Validated by Wajina Registry Hub • {new Date().toLocaleDateString('en-GB')}
        </p>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-tertiary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-3xl" />
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-blush flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-brand-tertiary animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-brand-primary/60">Finalizing Transaction Records...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

