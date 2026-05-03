"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Check, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { saveApplicantLead } from "@/app/actions/admissions";

const ADMISSION_STATE_KEY = "wajinaAdmissionsState";
const APPLICANTS_KEY = "wajinaEnrollmentApplicants";

interface ApplicantData {
  id: string;
  studentName: string;
  studentClass: string;
  campus: string;
  campusLabel: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  note: string;
  status: string;
}

const PRIMARY_CLASSES = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
const SECONDARY_CLASSES = [
  "JSS 1 A", "JSS 1 B", "JSS 1 C",
  "JSS 2 A", "JSS 2 B", "JSS 2 C",
  "JSS 3 A", "JSS 3 B", "JSS 3 C",
  "SS 1 Science", "SS 1 Arts", "SS 1 Commercial",
  "SS 2 Science", "SS 2 Arts", "SS 2 Commercial",
  "SS 3 Science", "SS 3 Arts", "SS 3 Commercial"
];

interface AdmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AdmissionsModal({ isOpen, onClose }: AdmissionsModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pendingApplicant, setPendingApplicant] = useState<ApplicantData | null>(null);
  const [entranceFee, setEntranceFee] = useState(25000);

  // Form fields
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [campus, setCampus] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [note, setNote] = useState("");

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFeedback("");
      setPendingApplicant(null);
      setStudentName("");
      setStudentClass("");
      setCampus("");
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setNote("");
      setEntranceFee(25000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (campus) {
      fetch(`/api/admissions/config?campus=${campus}`)
        .then(res => res.json())
        .then(data => {
           if (data.entranceFee) setEntranceFee(data.entranceFee);
        })
        .catch(console.error);
    }
  }, [campus]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    if (!studentName || !studentClass || !campus || !parentName || !parentPhone || !parentEmail) {
      setFeedback("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    
    try {
      const result = await saveApplicantLead({
        studentName,
        studentClass,
        campus,
        parentName,
        parentPhone,
        parentEmail,
        notes: note
      });

      if (!result.success || !result.id) {
        setFeedback(result.error || "Failed to save application lead. Please try again.");
        return;
      }

      const applicant: ApplicantData = {
        id: result.id,
        studentName,
        studentClass,
        campus,
        campusLabel: campus === "primary" ? "Primary School" : "Secondary School",
        parentName,
        parentPhone,
        parentEmail,
        note,
        status: "pending",
      };

      setPendingApplicant(applicant);
      setStep(2);
    } catch (error) {
      setFeedback("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!pendingApplicant) return;
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch("/api/admissions/initiate-payment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionId: pendingApplicant.id,
          amount: entranceFee,
          email: pendingApplicant.parentEmail,
          name: pendingApplicant.parentName,
          studentName: pendingApplicant.studentName,
          studentClass: pendingApplicant.studentClass,
          campus: pendingApplicant.campus,
          phone: pendingApplicant.parentPhone,
          note: pendingApplicant.note,
        }),
      });

      const data = await res.json();

      if (data.url) {
        const list = JSON.parse(localStorage.getItem(APPLICANTS_KEY) || "[]");
        list.unshift({
          ...pendingApplicant,
          entranceFee: `₦${entranceFee.toLocaleString()}`,
          submittedAt: new Date().toLocaleString("en-NG"),
          paymentMethod: "Flutterwave",
        });
        localStorage.setItem(APPLICANTS_KEY, JSON.stringify(list));
        window.location.href = data.url;
      } else {
        setFeedback(data.error || "Could not initialize payment. Please try again.");
      }
    } catch (err: any) {
      console.error("[AdmissionsModal] Payment initiation failed:", err);
      setFeedback("Payment service unavailable. Please try again later.");
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
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0E120A]/95 backdrop-blur-xl"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/5"
          style={{ background: "var(--color-cinematic-ink)" }}
        >
          {/* Header Slab */}
          <div className="p-8 md:p-12 relative" style={{ background: "var(--color-cinematic-deep)" }}>
            <button
              onClick={onClose}
              className="absolute top-8 right-8 transition-colors"
              style={{ color: "var(--color-cinematic-dim)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-cinematic-bone)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-cinematic-dim)"}
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-4">
               <div className="h-px w-8" style={{ background: "var(--color-cinematic-moss)" }} />
               <span className="text-token-micro font-black uppercase tracking-[0.4em]" style={{ color: "var(--color-cinematic-moss)", fontFamily: "var(--font-sans)" }}>ADMISSIONS OFFICE</span>
            </div>
            <h2 className="leading-none tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--color-cinematic-bone)" }}>
              {step === 1 ? "Begin Enrollment." : "Payment Portal."}
            </h2>

            {/* Steps Indicators */}
            <div className="flex items-center gap-6 mt-10">
               <div className={`text-token-micro font-black tracking-[0.2em] flex items-center gap-3 ${step >= 1 ? "text-bone" : "opacity-20 text-bone"}`}>
                  <span className={`w-6 h-6 flex items-center justify-center transition-all ${step >= 1 ? "bg-moss text-ink" : "border border-white/20"}`} style={{ background: step >= 1 ? "var(--color-cinematic-moss)" : "transparent", color: step >= 1 ? "var(--color-cinematic-ink)" : "inherit" }}>1</span>
                  IDENTITY
               </div>
               <div className="h-px w-6 opacity-10" style={{ background: "var(--color-cinematic-bone)" }} />
               <div className={`text-token-micro font-black tracking-[0.2em] flex items-center gap-3 ${step >= 2 ? "text-bone" : "opacity-20 text-bone"}`}>
                  <span className={`w-6 h-6 flex items-center justify-center transition-all ${step >= 2 ? "bg-moss text-ink" : "border border-white/20"}`} style={{ background: step >= 2 ? "var(--color-cinematic-moss)" : "transparent", color: step >= 2 ? "var(--color-cinematic-ink)" : "inherit" }}>2</span>
                  COMPLIANCE
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12" style={{ background: "var(--color-cinematic-ink)" }}>
            {step === 1 && (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-10">
                <FormField label="Student Identification Name" required>
                  <input
                    type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                    placeholder="FULL NAME AS IN BIRTH CERTIFICATE" required
                    style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                    className="w-full border py-4 px-6 text-sm font-black uppercase tracking-tight focus:border-moss outline-none transition-all placeholder:opacity-20"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                  <FormField label="Preferred Campus" required>
                    <select
                      value={campus} onChange={(e) => {
                        setCampus(e.target.value);
                        setStudentClass(""); 
                      }} required
                      style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                      className="w-full border py-4 px-6 text-sm font-black focus:border-moss outline-none transition-all appearance-none"
                    >
                      <option value="" className="bg-ink">SELECT CAMPUS</option>
                      <option value="primary" className="bg-ink">PRIMARY SCHOOL</option>
                      <option value="secondary" className="bg-ink">SECONDARY SCHOOL</option>
                    </select>
                  </FormField>
                  <FormField label="Placement Class" required>
                    <select
                      value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required
                      disabled={!campus}
                      style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                      className="w-full border py-4 px-6 text-sm font-black focus:border-moss outline-none transition-all appearance-none disabled:opacity-20"
                    >
                      <option value="" className="bg-ink">SELECT CLASS</option>
                      {campus === "primary" && PRIMARY_CLASSES.map(cls => (
                         <option key={cls} value={cls} className="bg-ink">{cls}</option>
                      ))}
                      {campus === "secondary" && SECONDARY_CLASSES.map(cls => (
                         <option key={cls} value={cls} className="bg-ink">{cls}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="h-px w-full opacity-5" style={{ background: "var(--color-cinematic-bone)" }} />

                <FormField label="Guardian Identification" required>
                  <input
                    type="text" value={parentName} onChange={(e) => setParentName(e.target.value)}
                    placeholder="FULL NAME" required
                    style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                    className="w-full border py-4 px-6 text-sm font-black uppercase focus:border-moss outline-none transition-all placeholder:opacity-20"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                  <FormField label="Phone Registry" required>
                    <input
                      type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="080 000 0000" required
                      style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                      className="w-full border py-4 px-6 text-sm font-black focus:border-moss outline-none transition-all placeholder:opacity-20"
                    />
                  </FormField>
                  <FormField label="Electronic Mail" required>
                    <input
                      type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="PARENT@EXAMPLE.COM" required
                      style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "var(--font-sans)" }}
                      className="w-full border py-4 px-6 text-sm font-black focus:border-moss outline-none transition-all placeholder:opacity-20"
                    />
                  </FormField>
                </div>

                {feedback && (
                  <p className="text-token-micro font-black p-4 border uppercase tracking-widest" style={{ color: "var(--color-cinematic-tang)", background: "rgba(230,119,55,0.05)", borderColor: "rgba(230,119,55,0.1)" }}>{feedback}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="py-6 font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                  style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)", fontFamily: "var(--font-sans)" }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>CONFIRM & PROCEED <ArrowRight size={18} /></>}
                </button>
              </form>
            )}

            {step === 2 && pendingApplicant && (
              <div className="flex flex-col gap-10">
                <div className="p-8 relative" style={{ background: "var(--color-cinematic-deep)", border: "1px solid rgba(255,255,255,0.05)" }}>
                   <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "var(--color-cinematic-moss)" }} />
                   <h4 className="text-token-micro font-black uppercase tracking-[0.3em] mb-6 opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>VALIDATION SUMMARY</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-token-micro font-black opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>STUDENT</span>
                         <span className="text-xs font-black uppercase" style={{ color: "var(--color-cinematic-bone)" }}>{pendingApplicant.studentName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-token-micro font-black opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>CLASS</span>
                         <span className="text-xs font-black uppercase" style={{ color: "var(--color-cinematic-bone)" }}>{pendingApplicant.studentClass}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-token-micro font-black opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>CAMPUS</span>
                         <span className="text-xs font-black uppercase" style={{ color: "var(--color-cinematic-bone)" }}>{pendingApplicant.campusLabel}</span>
                      </div>
                   </div>
                </div>

                <div className="p-8 flex flex-col gap-4" style={{ background: "var(--color-cinematic-surface)" }}>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--color-cinematic-dim)" }}>ENTRANCE FEE</span>
                      <span className="font-black" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-cinematic-moss)" }}>₦{entranceFee.toLocaleString()}</span>
                   </div>
                   <p className="text-token-micro font-black leading-relaxed uppercase tracking-tight opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>
                      MANDATORY PROCESSING FEE FOR ENTRANCE EXAM AND ASSESSMENT.
                   </p>
                </div>

                <div className="flex items-start gap-4 p-6 border" style={{ background: "rgba(106,181,71,0.03)", borderColor: "rgba(106,181,71,0.1)" }}>
                   <ShieldCheck size={24} style={{ color: "var(--color-cinematic-moss)" }} className="shrink-0" />
                   <p className="text-token-micro font-black leading-relaxed uppercase tracking-wider opacity-60" style={{ color: "var(--color-cinematic-bone)" }}>
                      SECURE REDIRECT TO <span style={{ color: "var(--color-cinematic-moss)" }}>FLUTTERWAVE</span>. ENCRYPTED END-TO-END GATEWAY COMPLIANCE.
                   </p>
                </div>

                {feedback && (
                  <p className="text-token-micro font-black p-4 border uppercase tracking-widest" style={{ color: "var(--color-cinematic-tang)", background: "rgba(230,119,55,0.05)", borderColor: "rgba(230,119,55,0.1)" }}>{feedback}</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-6 border font-black text-xs uppercase tracking-[0.3em] transition-all"
                    style={{ background: "transparent", color: "var(--color-cinematic-bone)", borderColor: "rgba(255,255,255,0.1)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    BACK
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-[2] py-6 font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{ background: "var(--color-cinematic-moss)", color: "var(--color-cinematic-ink)" }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "EXECUTE PAYMENT"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-token-micro font-black uppercase tracking-[0.3em] px-1 opacity-40" style={{ color: "var(--color-cinematic-bone)" }}>
        {label} {required && <span style={{ color: "var(--color-cinematic-tang)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
