"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { SignatureCanvas } from "@/components/signature-canvas";
import { signAndPublishResults } from "@/app/actions/publishing";
import { 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  Filter, 
  RefreshCw,
  Stamp,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ResultsApprovalPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("ALL");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch User Info for Tenant Context
    async function fetchUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const url = `/api/grades/pending-review?campus=${selectedCampus}&overrideFormMaster=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGrades(data.grades || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending grades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchGrades();
  }, [user, selectedCampus]);

  const handlePublish = async (signatureData: string) => {
    if (!user) return;
    setIsPublishing(true);
    try {
      const res = await signAndPublishResults({
        armId: grades[0]?.student?.armId || "batch-signing",
        termId: grades[0]?.termId || "current",
        sessionId: grades[0]?.sessionId || "current",
        user: { id: user.id, role: user.role, campus: user.campus || "PRIMARY" },
        signatureData
      });

      if (res.success) {
        setShowSignModal(false);
        fetchGrades();
      }
    } catch (err: any) {
      alert(err.message || "Publication failed");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-brand-primary/8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-black/[0.03] flex items-center justify-center text-brand-primary border border-brand-primary/8">
              <UserCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase leading-none mb-2">Results <span className="text-brand-secondary">Seal</span></h1>
              <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em]">Finalize and seal institutional academic gradebooks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={fetchGrades}
                className="bg-white border-2 border-brand-primary/8 text-brand-primary px-6 py-4 rounded-2xl shadow-sm font-black text-token-micro uppercase tracking-widest flex items-center gap-2 hover:border-brand-secondary/30 transition-all"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
              Sync
            </button>
            <button 
                onClick={() => setShowSignModal(true)}
                disabled={grades.length === 0 || loading}
                className="bg-white border-2 border-brand-secondary text-brand-primary font-black text-token-micro uppercase tracking-widest px-8 py-4 rounded-2xl shadow-lg shadow-brand-secondary/10 flex items-center gap-2 hover:bg-brand-secondary transition-all disabled:opacity-30 disabled:grayscale"
            >
              <Stamp size={18} />
              Verify & Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-white flex flex-col gap-6 border border-brand-primary/8 shadow-xl p-8">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-brand-secondary" />
                <h4 className="font-black text-brand-primary text-token-micro uppercase tracking-widest">Campus Cluster</h4>
              </div>
              <div className="flex flex-col gap-3">
                {['ALL', 'PRIMARY', 'SECONDARY'].map(campus => (
                  <button
                    key={campus}
                    onClick={() => setSelectedCampus(campus)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-token-micro font-black tracking-widest uppercase",
                      selectedCampus === campus 
                      ? "bg-brand-secondary/10 border-brand-secondary text-brand-primary" 
                      : "bg-black/[0.02] border-transparent text-brand-tertiary hover:bg-black/[0.04]"
                    )}
                  >
                    {campus}
                    {selectedCampus === campus && <CheckCircle size={14} className="text-brand-secondary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="card bg-white border-dashed border-2 border-brand-secondary/20 p-8 flex flex-col gap-5 shadow-xl">
              <AlertCircle size={24} className="text-brand-secondary shrink-0" />
              <div>
                <p className="text-token-micro font-black text-brand-secondary uppercase tracking-[0.2em] mb-2">Cryptographic Protocol</p>
                <p className="text-token-caption font-bold text-brand-primary/50 leading-relaxed uppercase tracking-tight font-sans">
                  Every publish action triggers a non-repudiable seal. Marks are immutable post-publication without Director key escalation.
                </p>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="lg:col-span-3">
            <div className="card bg-white p-0 overflow-hidden border border-brand-primary/8 shadow-2xl relative">
               <div className="p-8 border-b border-brand-primary/8 bg-black/[0.01] flex items-center justify-between">
                  <h5 className="font-black text-brand-primary uppercase text-token-micro tracking-[0.3em]">Institutional Grade Inventory • {grades.length} Records</h5>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                     <span className="text-token-micro font-black text-brand-secondary uppercase tracking-widest">Live Audit</span>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-token-micro font-black text-brand-tertiary uppercase tracking-[0.3em] border-b border-brand-primary/8">
                        <th className="px-8 py-5">Student / Principal</th>
                        <th className="px-8 py-5">Campus Arm</th>
                        <th className="px-8 py-5">Academic Domain</th>
                        <th className="px-8 py-5 text-center">Velocity</th>
                        <th className="px-8 py-5 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {loading ? (
                         <tr><td colSpan={5} className="px-8 py-20 text-center text-brand-tertiary text-token-micro font-black uppercase tracking-widest animate-pulse italic">Interrogating Gradebooks...</td></tr>
                      ) : grades.length === 0 ? (
                         <tr><td colSpan={5} className="px-8 py-20 text-center text-brand-tertiary text-token-micro font-black uppercase tracking-widest italic">Institutional Records Fully Synced.</td></tr>
                      ) : grades.map((grade) => (
                        <tr key={grade.id} className="group hover:bg-black/[0.02] transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-brand-primary uppercase tracking-tight">{grade.student.name}</p>
                          </td>
                          <td className="px-8 py-6 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">
                            {grade.student.enrolledArm?.fullName || "RESERVE"}
                          </td>
                          <td className="px-8 py-6 text-token-micro font-black text-brand-secondary uppercase tracking-widest">
                            {grade.subject.name}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="inline-flex px-4 py-1.5 bg-brand-primary border border-brand-primary text-token-caption font-black text-white rounded-lg tabular-nums">
                              {grade.total}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className={cn(
                               "inline-flex px-3 py-1 rounded-full text-token-micro font-black uppercase tracking-widest border",
                               grade.status === "PENDING" ? "border-orange-500/30 text-orange-500 bg-orange-500/5" : "border-brand-secondary/30 text-brand-secondary bg-brand-secondary/5"
                             )}>
                               {grade.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

        </div>

      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPublishing && setShowSignModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 sm:p-14 overflow-hidden border border-brand-primary/8"
            >
              <div className="flex flex-col gap-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                      <Stamp size={32} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-display font-black text-brand-primary uppercase tracking-tight leading-none mb-2">Identity Seal</h2>
                      <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em]">Draw your signature below to seal {grades.length} academic records.</p>
                   </div>
                </div>

                <div className="bg-black/[0.02] border border-brand-primary/8 rounded-[2rem] p-6 overflow-hidden">
                   <SignatureCanvas 
                      onSave={handlePublish}
                      onCancel={() => setShowSignModal(false)}
                   />
                </div>

                {isPublishing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-20">
                     <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
                     <p className="font-black text-brand-primary uppercase tracking-[0.4em] text-token-micro">Applying Cryptographic Seals...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

