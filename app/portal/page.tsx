"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ShieldAlert, CheckCircle2, Loader2, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      setTimeout(() => {
        const dest = getDestination(data.role);
        router.push(dest);
      }, 800);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDestination = (role: string) => {
    const r = role.toUpperCase();
    if (r === "DIRECTOR") return "/director-dashboard";
    if (r === "PARENT") return "/parent-dashboard";
    if (r === "PRINCIPAL") return "/principal-dashboard";
    if (["ADMIN", "VP_ADMIN", "HEAD_TEACHER", "REGISTRAR"].includes(r)) return "/operations-hub";
    return "/dashboard";
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
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
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
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0" />
              <p className="text-xs font-semibold text-brand-success">Authentication successful! Redirecting...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-text-muted px-2">Work Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-text-muted group-focus-within:text-brand-moonstone transition-colors pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-black/[0.06] focus:border-brand-moonstone focus:ring-4 focus:ring-brand-moonstone/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="name@wajina.edu.ng"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-text-muted px-2">Access Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-text-muted group-focus-within:text-brand-moonstone transition-colors pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-black/[0.06] focus:border-brand-moonstone focus:ring-4 focus:ring-brand-moonstone/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-gunmetal hover:bg-brand-gunmetal/90 text-white flex items-center justify-center gap-2 group press-effect mt-8 py-5 rounded-2xl shadow-xl transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="text-xs font-black uppercase tracking-widest">Enter Workspace</span>
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-moonstone/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-saffron/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-black/5 p-8 md:p-12 rounded-[40px] shadow-premium">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-bg rounded-3xl shadow-sm mb-6 border border-black/5">
              <img src="/images/Logo.png" alt="Wajina Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight mb-2 uppercase italic">Portal Access</h1>
            <p className="text-text-secondary text-xs font-black uppercase tracking-widest opacity-50 italic">Institutional Governance Suite</p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-moonstone" /></div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-12 text-center pt-8 border-t border-black/5">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-brand-moonstone hover:underline">System Recovery Archive</a>
          </div>
        </div>

        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-30">
          © 2026 Wajina International • Intelligence Core
        </p>
      </motion.div>
    </div>
  );
}
