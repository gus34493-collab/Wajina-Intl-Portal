"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ShieldCheck, Heart } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiativeTitle: string;
  initiativeSlug: string;
}

export default function SupportModal({ isOpen, onClose, initiativeTitle, initiativeSlug }: SupportModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const presetAmounts = ["5000", "25000", "100000", "500000"];

  useEffect(() => {
    if (!isOpen) {
      setFeedback("");
      setName("");
      setEmail("");
      setPhone("");
      setAmount("");
    }
  }, [isOpen]);

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch("/api/support/initiate-payment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          email,
          name,
          phone,
          initiativeTitle,
          initiativeSlug,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setFeedback(data.error || "Could not initialize support link.");
      }
    } catch (err) {
      setFeedback("Support service unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(26,30,23,0.95)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col relative"
          style={{
            background: "var(--color-cinematic-surface)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="p-8 md:p-10 relative"
            style={{
              background: "var(--color-cinematic-ink)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 transition-colors duration-200"
              style={{ color: "var(--color-cinematic-dim)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-bone)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-cinematic-dim)")}
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px" style={{ background: "var(--color-cinematic-moss)" }} />
              <span
                className="text-[9px] font-black uppercase tracking-[0.4em]"
                style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}
              >
                Institutional Partner
              </span>
            </div>
            <h2
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--color-cinematic-bone)",
              }}
            >
              Support
              <br />
              <span style={{ color: "var(--color-cinematic-moss)" }}>{initiativeTitle}.</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-10" style={{ background: "var(--color-cinematic-surface)" }}>
            <form onSubmit={handleSupport} className="space-y-7">
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Full Name">
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" required
                    className="w-full py-3.5 px-5 text-sm outline-none transition-all duration-200"
                    style={{
                      background: "var(--color-cinematic-ink)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--color-cinematic-bone)",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-cinematic-moss)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </FormField>
                <FormField label="Email">
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full py-3.5 px-5 text-sm outline-none transition-all duration-200"
                    style={{
                      background: "var(--color-cinematic-ink)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--color-cinematic-bone)",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-cinematic-moss)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </FormField>
              </div>

              <FormField label="Support Amount (NGN)">
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className="py-3 text-[10px] font-black transition-all duration-200"
                        style={{
                          background: amount === amt ? "var(--color-cinematic-moss)" : "var(--color-cinematic-ink)",
                          color: amount === amt ? "var(--color-cinematic-ink)" : "var(--color-cinematic-dim)",
                          border: `1px solid ${amount === amt ? "var(--color-cinematic-moss)" : "rgba(255,255,255,0.08)"}`,
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        ₦{parseInt(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom amount" required
                    className="w-full py-3.5 px-5 text-sm outline-none transition-all duration-200"
                    style={{
                      background: "var(--color-cinematic-ink)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--color-cinematic-bone)",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-cinematic-moss)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </FormField>

              <div
                className="flex items-start gap-4 p-5"
                style={{
                  background: "rgba(106,181,71,0.06)",
                  border: "1px solid rgba(106,181,71,0.1)",
                }}
              >
                <ShieldCheck size={18} style={{ color: "var(--color-cinematic-moss)", flexShrink: 0, marginTop: 1 }} />
                <p
                  className="text-[10px] font-bold leading-relaxed uppercase tracking-wider"
                  style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
                >
                  Secure transaction via{" "}
                  <span style={{ color: "var(--color-cinematic-moss)" }}>Flutterwave</span>.
                  Your contribution directly funds institutional progress.
                </p>
              </div>

              {feedback && (
                <p
                  className="text-[10px] font-black uppercase tracking-widest text-center p-4"
                  style={{
                    background: "rgba(230,70,70,0.08)",
                    border: "1px solid rgba(230,70,70,0.15)",
                    color: "#e64646",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "var(--color-cinematic-moss)",
                  color: "var(--color-cinematic-ink)",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>Initiate Contribution <Heart size={16} fill="currentColor" /></>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-[9px] font-black uppercase tracking-[0.3em] px-1"
        style={{ color: "var(--color-cinematic-dim)", fontFamily: "var(--font-sans)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
