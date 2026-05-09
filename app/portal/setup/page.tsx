"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");
      setSuccess(true);
      // Session is destroyed after password change — redirect to portal login
      setTimeout(() => router.replace("/portal"), 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-brand-primary overflow-hidden relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(106,181,71,0.06) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(230,119,55,0.05) 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10 px-4"
      >
        <div className="bg-white rounded-[2rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.5)] border border-white/5 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-inner mb-4 border border-brand-primary/5">
              <Image src="/images/logo-no-bg.png" alt="Wajina" width={38} height={38} priority className="object-contain" />
            </div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight uppercase leading-none mb-1.5">
              Set Your<br /><span className="text-brand-accent">Password.</span>
            </h1>
            <p className="text-brand-primary/40 text-token-micro font-black uppercase tracking-[0.4em]">
              One-time security setup
            </p>
          </div>

          {/* Info banner */}
          <div className="bg-brand-accent/8 border border-brand-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-brand-primary/70 leading-relaxed">
              You're signed in with a temporary password. Choose a permanent one to unlock your full portal.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-brand-success" />
              <p className="text-sm font-black text-brand-primary text-center">Password updated. Signing you back in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-brand-error">{error}</p>
                </div>
              )}

              <PasswordField
                label="Temporary Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent(v => !v)}
                placeholder="Your one-time password"
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder="Min 8 chars, upper, lower, digit, symbol"
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showNew}
                onToggle={() => {}}
                placeholder="Repeat new password"
                hideToggle
              />

              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-brand-primary hover:bg-brand-accent text-white flex items-center justify-center gap-3 mt-2 py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-xs font-black uppercase tracking-[0.4em]">Set Permanent Password</span>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px w-6 bg-brand-accent" />
          <p className="text-token-micro font-black uppercase tracking-[0.3em] text-white/20">
            © 2026 Wajina International Schools
          </p>
          <div className="h-px w-6 bg-brand-accent" />
        </div>
      </motion.div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, placeholder, hideToggle,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string; hideToggle?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-token-micro font-black uppercase tracking-[0.3em] text-brand-primary/40 px-1 leading-none">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center text-brand-primary pointer-events-none z-10">
          <Lock size={17} strokeWidth={2.5} />
        </div>
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingLeft: "44px", backgroundColor: "white" }}
          className="w-full border border-brand-primary/5 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 rounded-xl py-3.5 pr-12 text-sm font-black transition-all outline-none"
          placeholder={placeholder}
        />
        {!hideToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-4 flex items-center text-brand-primary/50 hover:text-brand-accent transition-colors z-10"
          >
            {show ? <EyeOff size={17} strokeWidth={2.5} /> : <Eye size={17} strokeWidth={2.5} />}
          </button>
        )}
      </div>
    </div>
  );
}
