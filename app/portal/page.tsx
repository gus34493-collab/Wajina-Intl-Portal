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
    if (errorParam) setError(errorParam);
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
      if (!res.ok) throw new Error(data.error || "Login failed");
      setSuccess(true);
      sessionStorage.clear();
      updateUser(data);
      onAuthStart();
      setTimeout(() => router.replace(getDefaultRoute(data.role)), 1000);
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
            className="mb-4 overflow-hidden"
          >
            <div className="bg-rose-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-brand-error shrink-0" />
              <p className="text-xs font-semibold text-brand-error">{error}</p>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
              <p className="text-xs font-semibold text-brand-success">Signed in. Taking you in...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <label className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/40 px-1 leading-none">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-brand-primary pointer-events-none z-10">
              <Mail size={17} strokeWidth={2.5} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: "44px", backgroundColor: "white" }}
              className="w-full border border-brand-primary/5 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 rounded-xl py-3.5 pr-4 text-sm font-black tracking-tight transition-all outline-none"
              placeholder="name@wajina.com.ng"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/40 px-1 leading-none">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-brand-primary pointer-events-none z-10">
              <Lock size={17} strokeWidth={2.5} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: "44px", backgroundColor: "white" }}
              className="w-full border border-brand-primary/5 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 rounded-xl py-3.5 pr-12 text-sm font-black transition-all outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-brand-primary/50 hover:text-brand-accent transition-colors z-10"
            >
              {showPassword ? <EyeOff size={17} strokeWidth={2.5} /> : <Eye size={17} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-primary hover:bg-brand-accent text-white flex items-center justify-center gap-3 group mt-2 py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="text-xs font-black uppercase tracking-[0.4em]">Sign In</span>
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
        router.replace(getDefaultRoute(user.role));
      } else {
        setTimeout(() => setStatus("ready"), 800);
      }
    }
  }, [user, authLoading, router]);

  if (status !== "ready" || authLoading) return <NeuralGatewayBuffer />;

  return (
    <div className="h-screen w-screen flex overflow-hidden">

      {/* ── Left: Image panel (30%) ── */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[30%] relative overflow-hidden flex-shrink-0"
      >
        <Image
          src="/images/markurdi_emerald_20260507_205841.png"
          alt="Wajina International Schools — Makurdi"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />

        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(14,18,10,0.38) 0%, rgba(14,18,10,0.72) 100%)",
          }}
        />

        {/* Top logo */}
        <div className="absolute top-8 left-7 flex items-center gap-3 z-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <Image src="/images/logo-no-bg.png" alt="Wajina" width={22} height={22} className="object-contain" />
          </div>
          <span
            className="text-white font-black uppercase tracking-[0.18em] leading-tight"
            style={{ fontSize: "0.48rem", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
          >
            Wajina<br />International Schools
          </span>
        </div>

        {/* Centered welcome text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
          <div
            className="inline-flex items-center mb-5 px-3 py-1 rounded-full"
            style={{ background: "rgba(106,181,71,0.18)", border: "1px solid rgba(106,181,71,0.38)" }}
          >
            <span className="font-black uppercase tracking-[0.38em]" style={{ fontSize: "0.38rem", color: "#6AB547" }}>
              Makurdi · Benue State
            </span>
          </div>

          <h2
            className="text-white font-black leading-[1.08] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(1.3rem, 2.2vw, 1.9rem)",
              textShadow: "0 2px 24px rgba(0,0,0,0.6)",
            }}
          >
            In the heart<br />of Makurdi,<br />
            bringing<br />
            <span style={{ color: "#6AB547" }}>excellence home.</span>
          </h2>

          <p
            className="text-white/60 font-medium leading-relaxed mb-7"
            style={{ fontSize: "clamp(0.65rem, 0.9vw, 0.75rem)" }}
          >
            Welcome back. Everything connecting you to your school community is waiting on the other side.
          </p>

          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ background: "rgba(106,181,71,0.5)" }} />
            <span className="font-black uppercase tracking-[0.38em] text-white/35" style={{ fontSize: "0.38rem" }}>
              Sign in to continue
            </span>
            <div className="h-px w-8" style={{ background: "rgba(106,181,71,0.5)" }} />
          </div>
        </div>
      </motion.div>

      {/* ── Right: Form panel (70%) ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-primary relative overflow-hidden p-6">
        {/* Decorative accents */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(106,181,71,0.05) 0%, transparent 70%)", transform: "translate(30%,-30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,119,55,0.04) 0%, transparent 70%)", transform: "translate(-30%,30%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
            <Image src="/images/logo-no-bg.png" alt="Wajina" width={30} height={30} className="object-contain" />
            <span className="text-white font-black uppercase tracking-[0.2em]" style={{ fontSize: "0.55rem" }}>
              Wajina International Schools
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[2rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.5)] border border-white/5 p-7">
            {/* Logo + heading */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-inner mb-4 border border-brand-primary/5">
                <Image
                  src="/images/logo-no-bg.png"
                  alt="Wajina International Schools"
                  width={38}
                  height={38}
                  priority
                  className="object-contain"
                />
              </div>
              <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight mb-1.5 uppercase leading-none">
                Welcome<br />
                <span className="text-brand-accent">In.</span>
              </h1>
              <p className="text-brand-primary/40 text-token-micro font-black uppercase tracking-[0.5em] leading-none">
                Sign in to your account
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                </div>
              }
            >
              <LoginForm onAuthStart={() => setStatus("authenticating")} />
            </Suspense>

            <div className="mt-6 text-center pt-5 border-t border-brand-primary/5">
              <button
                onClick={() => setIsRecoveryOpen(true)}
                className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-2 mx-auto"
              >
                <ShieldAlert size={13} /> Forgot your password?
              </button>
            </div>
          </div>

          <RecoveryModal isOpen={isRecoveryOpen} onClose={() => setIsRecoveryOpen(false)} />

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-6 bg-brand-accent" />
            <p className="text-token-micro font-black uppercase tracking-[0.3em] text-white/20">
              © 2026 Wajina International Schools
            </p>
            <div className="h-px w-6 bg-brand-accent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
