"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Send, Loader2 } from "lucide-react";
import { useState } from "react";

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecoveryModal({ isOpen, onClose }: RecoveryModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate recovery request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSent(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-primary/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 border border-black/5"
          >
            {/* Header */}
            <div className="bg-brand-primary p-8 md:p-12 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-8 bg-brand-accent" />
                <span className="text-brand-accent font-black uppercase tracking-[0.4em] text-[10px]">Account Recovery</span>
              </div>
              <h2 className="text-3xl font-display font-black uppercase leading-tight">
                Forgot <br /> Password?
              </h2>
            </div>

            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <p className="text-brand-primary/60 text-sm font-medium mb-8 leading-relaxed">
                      Enter your work email below and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40 px-2 leading-none">Your email address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-neutral-surface border border-brand-primary/5 focus:border-brand-accent focus:ring-8 focus:ring-brand-accent/5 rounded-2xl py-5 px-6 text-sm font-black uppercase tracking-tight transition-all outline-none"
                          placeholder="NAME@WAJINA.COM.NG"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-accent text-white flex items-center justify-center gap-4 py-6 rounded-2xl shadow-xl transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <span className="text-xs font-black uppercase tracking-[0.4em]">Send Reset Link</span>
                            <Send size={18} />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-100">
                      <ShieldAlert className="text-emerald-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-black text-brand-primary uppercase mb-4">Check Your Inbox</h3>
                    <p className="text-brand-primary/60 text-sm font-medium leading-relaxed">
                      If an account exists for <span className="text-brand-primary font-black">{email}</span>, a password reset link has been sent. It may take a few minutes to arrive.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary hover:text-brand-accent transition-colors"
                    >
                      Back to sign in
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
