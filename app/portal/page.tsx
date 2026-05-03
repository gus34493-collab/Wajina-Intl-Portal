"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ShieldAlert, CheckCircle2, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { getDefaultRoute } from "@/lib/navigation";
import RecoveryModal from "@/components/auth/RecoveryModal";
import NeuralGatewayBuffer from "@/app/components/auth/NeuralGatewayBuffer";
import { useAuth } from "@/app/components/AuthContext";

function LoginForm({ onAuthStart }: { onAuthStart: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSuccess(true);
      sessionStorage.clear();
      updateUser(data); // Sync context instantly
      onAuthStart(); 

      setTimeout(() => {
        const dest = getDefaultRoute(data.role);
        router.replace(dest);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-rose-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-brand-error shrink-0" />
              <p className="text-xs font-semibold text-brand-error">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0" />
              <p className="text-xs font-semibold text-brand-success">Signed in. Taking you in...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/40 px-2 leading-none">Email address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-brand-primary z-10 pointer-events-none">
              <Mail size={20} strokeWidth={2.5} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '56px', backgroundColor: 'white' }}
              className="w-full border border-brand-primary/5 focus:border-brand-accent focus:ring-8 focus:ring-brand-accent/5 rounded-2xl py-5 pr-6 text-sm font-black tracking-tight transition-all outline-none"
              placeholder="name@wajina.com.ng"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/40 px-2 leading-none">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-brand-primary z-10 pointer-events-none">
              <Lock size={20} strokeWidth={2.5} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '56px', backgroundColor: 'white' }}
              className="w-full border border-brand-primary/5 focus:border-brand-accent focus:ring-8 focus:ring-brand-accent/5 rounded-2xl py-5 pr-14 text-sm font-black transition-all outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ right: '24px' }}
              className="absolute inset-y-0 flex items-center text-brand-primary/60 hover:text-brand-accent transition-colors z-10"
            >
              {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-primary hover:bg-brand-accent text-white flex items-center justify-center gap-4 group mt-10 py-6 rounded-[2rem] shadow-2xl transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="text-xs font-black uppercase tracking-[0.4em]">Sign In</span>
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function PortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "authenticating">("checking");

  useEffect(() => {
    if (!authLoading) {
      if (user?.role) {
        // If already logged in, do NOT show the form at all
        router.replace(getDefaultRoute(user.role));
      } else {
        setTimeout(() => setStatus("ready"), 800);
      }
    }
  }, [user, authLoading, router]);

  if (status !== "ready" || authLoading) {
    return <NeuralGatewayBuffer />;
  }

  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4 relative overflow-hidden no-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-inner mb-10 border border-brand-primary/5">
              <Image
                src="/images/wajina-logo.jpg"
                alt="Wajina International Schools"
                width={56}
                height={56}
                priority
                className="object-contain"
                style={{ width: "var(--space-14, 3.5rem)", height: "var(--space-14, 3.5rem)" }}
              />
            </div>
            <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight mb-4 uppercase leading-none">Welcome<br/><span className="text-brand-accent">Back.</span></h1>
            <p className="text-brand-primary/40 text-token-micro font-black uppercase tracking-[0.5em] leading-none">Sign in to your account</p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>}>
            <LoginForm onAuthStart={() => setStatus("authenticating")} />
          </Suspense>

          <div className="mt-16 text-center pt-10 border-t border-brand-primary/5">
            <button 
              onClick={() => setIsRecoveryOpen(true)}
              className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-3 mx-auto"
            >
               <ShieldAlert size={14} /> Forgot your password?
            </button>
          </div>
        </div>

        <RecoveryModal 
          isOpen={isRecoveryOpen} 
          onClose={() => setIsRecoveryOpen(false)} 
        />

        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="h-px w-8 bg-brand-accent" />
           <p className="text-token-micro font-black uppercase tracking-[0.3em] text-white/20">
             © 2026 Wajina International Schools
           </p>
        </div>
      </motion.div>

      {/* Background Decorative Slabs */}
      <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent/30" />
      <div className="absolute bottom-0 right-0 w-1/2 h-2 bg-brand-secondary/10" />
    </div>
  );
}

