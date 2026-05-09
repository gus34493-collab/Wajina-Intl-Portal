"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
   BarChart3,
   UserPlus,
   Target,
   CreditCard,
   Search,
   ChevronRight,
   TrendingUp,
   Clock,
   ClipboardList,
   Mail,
   MoreVertical,
   Activity,
   Award,
   Settings2,
   Loader2,
   X,
   UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { sendExamDetails } from "@/app/actions/admissions";

export default function AdmissionsDashboard() {
   const [stats, setStats] = useState<any>(null);
   const [candidates, setCandidates] = useState<any[]>([]);
   const [qualifiedCandidates, setQualifiedCandidates] = useState<any[]>([]);
   const [scholarshipCandidates, setScholarshipCandidates] = useState<any[]>([]);
   const [config, setConfig] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [scores, setScores] = useState<Record<string, string>>({});
   const [savingScore, setSavingScore] = useState<string | null>(null);
   const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
   const [sendingEmail, setSendingEmail] = useState(false);
   const [offeringAdmission, setOfferingAdmission] = useState<string | null>(null);

   useEffect(() => {
      async function fetchData() {
         try {
            const [sRes, cRes, confRes, scholRes, qualRes] = await Promise.all([
               fetch("/api/admissions/stats"),
               fetch("/api/admissions?status=APPLIED"),
               fetch("/api/admissions/config"),
               fetch("/api/admissions?status=SCHOLARSHIP_REVIEW"),
               fetch("/api/admissions?status=QUALIFIED"),
            ]);
            const sData = await sRes.json();
            const cData = await cRes.json();
            const confData = await confRes.json();
            const scholData = await scholRes.json();
            const qualData = await qualRes.json();

            setStats(sData);
            setCandidates(cData.admissions || []);
            setQualifiedCandidates(qualData.admissions || []);
            setScholarshipCandidates(scholData.admissions || []);
            setConfig(Array.isArray(confData) ? confData[0] : confData);
         } catch (err) {
            console.error("Admissions fetch failure:", err);
         } finally {
            setLoading(false);
         }
      }
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
   }, []);

   const handleScoreSubmit = async (id: string, campus: string) => {
      const scoreVal = parseFloat(scores[id]);
      if (isNaN(scoreVal)) return;

      setSavingScore(id);
      try {
         // Determine new status based on score and config
         const targetCampus = campus.toUpperCase() === "PRIMARY" ? "PRIMARY" : "SECONDARY";
         let cutoff = 50;
         let scholThreshold = 90;

         // If config is array (Director view), find matching campus config
         if (Array.isArray(config)) {
            const campConf = config.find((c: any) => c.campus === targetCampus);
            if (campConf) {
               cutoff = campConf.cutoffScore;
               scholThreshold = campConf.scholarshipScore;
            }
         } else if (config) {
            cutoff = config.cutoffScore;
            scholThreshold = config.scholarshipScore;
         }

         let newStatus = "REJECTED";
         let isScholarshipEligible = false;

         if (scoreVal >= scholThreshold) {
            newStatus = "SCHOLARSHIP_REVIEW";
            isScholarshipEligible = true;
         } else if (scoreVal >= cutoff) {
            newStatus = "QUALIFIED";
         }

         const res = await fetch(`/api/admissions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               entranceScore: scoreVal,
               status: newStatus,
               isScholarshipEligible
            })
         });

         if (res.ok) {
            toast.success(`Score recorded. Status updated to ${newStatus}`);
            setCandidates(prev => prev.filter(c => c.id !== id));
         } else {
            toast.error("Failed to record score");
         }
      } catch (err) {
         toast.error("Network error saving score");
      } finally {
         setSavingScore(null);
      }
   };

   const handleOfferAdmission = async (id: string) => {
      if (!id) return;
      setOfferingAdmission(id);
      try {
         const res = await fetch(`/api/admissions/${id}/enroll`, { method: "POST" });
         const data = await res.json();
         if (res.ok) {
            toast.success("Admission offered — portal accounts created and email sent.");
            setQualifiedCandidates(prev => prev.filter(c => c.id !== id));
            setScholarshipCandidates(prev => prev.filter(c => c.id !== id));
         } else {
            toast.error(data.error || "Failed to issue admission offer.");
         }
      } catch {
         toast.error("Network error — please try again.");
      } finally {
         setOfferingAdmission(null);
      }
   };

   return (
      <DashboardShell>
         <div className="flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight uppercase italic">Growth Command</h1>
                  <p className="text-brand-primary/60 text-sm font-medium mt-1 tracking-tight">Institutional expansion metrics & applicant lifecycle management.</p>
               </div>
               <div className="flex gap-2">
                  <button className="bg-white border border-brand-primary/8 rounded-2xl px-5 py-3 flex items-center gap-2 shadow-sm font-black text-token-micro uppercase tracking-widest text-brand-tertiary hover:bg-brand-blush transition-all active:scale-95">
                     <Target size={14} /> Recruitment Strategy
                  </button>
                  <button className="bg-brand-primary text-white rounded-2xl px-5 py-3 flex items-center gap-2 shadow-2xl font-black text-token-micro uppercase tracking-widest hover:opacity-90 transition-all active:scale-95">
                     <UserPlus size={14} /> New Inquiry
                  </button>
               </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <KPICard label="Total Inquiries" value={stats?.total || "0"} icon={<Activity size={20} />} trend="+12%" color="moonstone" />
               <KPICard label="Fee Confirmed" value={stats?.feeConfirmed || "0"} icon={<CreditCard size={20} />} trend="Stable" color="moonstone" />
               <KPICard label="Yield Rate" value={`${stats?.yieldPct || "0"}%`} icon={<BarChart3 size={20} />} trend={parseFloat(stats?.yieldPct) >= 50 ? "Target Met" : "Low"} color="saffron" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

               {/* Conversion Funnel (Left 1.5/3) */}
               <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="card">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Growth Funnel Visualization</h3>
                        <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest">Term Logic 2026/1</p>
                     </div>

                     <div className="flex flex-col gap-6">
                        <FunnelStage label="Total Inquiries" val={stats?.total || 0} max={stats?.total || 1} color="brand-tertiary" />
                        <FunnelStage label="Screened / Qualified" val={stats?.qualified || 0} max={stats?.total || 1} color="brand-tertiary" />
                        <FunnelStage label="Offer Extended" val={stats?.offered || 0} max={stats?.total || 1} color="brand-accent" />
                        <FunnelStage label="Fee Confirmed" val={stats?.enrolled || 0} max={stats?.total || 1} color="brand-success" />
                     </div>
                  </div>

                  {/* Candidate Queue Table */}
                  <div className="card p-0 overflow-hidden shadow-2xl border-none">
                     <div className="p-8 border-b border-brand-primary/8 flex justify-between items-center bg-white">
                        <div>
                           <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Entrance Exam Queue</h3>
                           <p className="text-token-micro font-bold text-brand-tertiary uppercase mt-1">Awaiting Score Recording</p>
                        </div>
                        <div className="bg-brand-blush rounded-xl px-3 py-1 text-token-micro font-black text-brand-tertiary">
                           {candidates.length} ACTIVE
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-brand-blush text-token-micro font-black uppercase tracking-[0.15em] text-brand-tertiary">
                              <tr>
                                 <th className="px-8 py-4">Applicant</th>
                                 <th className="px-8 py-4">Target Locus</th>
                                 <th className="px-8 py-4 text-center">Protocol</th>
                                 <th className="px-8 py-4"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-black/5 text-sm">
                              {loading ? (
                                 <tr><td colSpan={4} className="py-20 text-center font-black text-brand-tertiary uppercase tracking-widest animate-pulse italic">Synchronizing Queue...</td></tr>
                              ) : candidates.length === 0 ? (
                                 <tr><td colSpan={4} className="py-20 text-center font-black text-brand-tertiary uppercase tracking-widest italic opacity-50">Queue Empty</td></tr>
                              ) : (
                                 candidates.slice(0, 10).map((c: any) => (
                                    <tr key={c.id} className="group hover:bg-brand-blush/50 transition-colors">
                                       <td className="px-8 py-5">
                                          <p className="font-black text-brand-primary leading-none">{c.applicantName}</p>
                                          <p className="text-token-micro font-bold text-brand-tertiary mt-1 uppercase tracking-widest">{c.parentPhone}</p>
                                       </td>
                                       <td className="px-8 py-5">
                                          <p className="font-bold text-brand-primary/60 text-xs">{c.targetClass} • {c.campus}</p>
                                       </td>
                                       <td className="px-8 py-5 text-center">
                                          <div className="flex items-center justify-center gap-2">
                                             <input
                                                placeholder="Score"
                                                type="number"
                                                value={scores[c.id] || ""}
                                                onChange={(e) => setScores({ ...scores, [c.id]: e.target.value })}
                                                className="w-16 bg-white border border-brand-primary/8 rounded-md px-2 py-1 text-xs font-black text-center outline-none focus:ring-2 focus:ring-brand-tertiary/10"
                                             />
                                             <button
                                                onClick={() => handleScoreSubmit(c.id, c.campus)}
                                                disabled={savingScore === c.id || !scores[c.id]}
                                                className="bg-brand-tertiary text-white p-1.5 rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
                                             >
                                                {savingScore === c.id ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                                             </button>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5 text-right">
                                          <button 
                                             onClick={() => setSelectedCandidate(c)}
                                             className="text-brand-tertiary hover:text-brand-primary"
                                          >
                                             <MoreVertical size={16} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Qualified Candidates — Awaiting Offer */}
                  {(qualifiedCandidates.length > 0 || scholarshipCandidates.length > 0) && (
                     <div className="card p-0 overflow-hidden shadow-2xl border-none">
                        <div className="p-8 border-b border-brand-primary/8 flex justify-between items-center bg-white">
                           <div>
                              <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Admission Offers Queue</h3>
                              <p className="text-token-micro font-bold text-brand-accent uppercase mt-1">Ready to be offered a place</p>
                           </div>
                           <div className="bg-brand-accent/10 rounded-xl px-3 py-1 text-token-micro font-black text-brand-accent">
                              {qualifiedCandidates.length + scholarshipCandidates.length} READY
                           </div>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-brand-blush text-token-micro font-black uppercase tracking-[0.15em] text-brand-tertiary">
                                 <tr>
                                    <th className="px-8 py-4">Applicant</th>
                                    <th className="px-8 py-4">Parent Email</th>
                                    <th className="px-8 py-4 text-center">Score</th>
                                    <th className="px-8 py-4 text-center">Track</th>
                                    <th className="px-8 py-4"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-black/5 text-sm">
                                 {[...scholarshipCandidates, ...qualifiedCandidates].map((c: any) => (
                                    <tr key={c.id} className="group hover:bg-brand-blush/50 transition-colors">
                                       <td className="px-8 py-5">
                                          <p className="font-black text-brand-primary leading-none">{c.applicantName}</p>
                                          <p className="text-token-micro font-bold text-brand-tertiary mt-1 uppercase tracking-widest">{c.targetClass} · {c.campus}</p>
                                       </td>
                                       <td className="px-8 py-5">
                                          <p className="text-xs font-bold text-brand-primary/70">{c.parentEmail || <span className="text-brand-error italic">Missing</span>}</p>
                                       </td>
                                       <td className="px-8 py-5 text-center">
                                          <span className="font-display font-black text-brand-primary">{c.entranceScore ?? "—"}%</span>
                                       </td>
                                       <td className="px-8 py-5 text-center">
                                          {c.status === "SCHOLARSHIP_REVIEW" ? (
                                             <span className="text-token-micro font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md">Scholarship</span>
                                          ) : (
                                             <span className="text-token-micro font-black uppercase bg-brand-secondary/10 text-brand-primary/60 border border-brand-primary/10 px-2 py-1 rounded-md">Standard</span>
                                          )}
                                       </td>
                                       <td className="px-8 py-5 text-right">
                                          <button
                                             onClick={() => handleOfferAdmission(c.id)}
                                             disabled={offeringAdmission === c.id || !c.parentEmail}
                                             title={!c.parentEmail ? "Parent email missing — update application first" : "Issue admission offer and create portal access"}
                                             className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl font-black text-token-micro uppercase tracking-widest hover:bg-brand-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                          >
                                             {offeringAdmission === c.id
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <UserCheck size={14} />}
                                             {offeringAdmission === c.id ? "Sending..." : "Offer Admission"}
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>

               {/* Action Center (Right 1/3) */}
               <div className="flex flex-col gap-8">

                  {/* Governance Configuration */}
                  <div className="card glass-premium flex flex-col gap-6 border-brand-tertiary/20">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-tertiary/10 rounded-xl">
                           <Settings2 className="text-brand-tertiary" size={20} />
                        </div>
                        <h4 className="font-black text-brand-primary uppercase text-xs tracking-widest">Campus Governance</h4>
                     </div>

                     <p className="text-token-caption text-brand-primary/60 font-medium leading-relaxed italic">"Configure entrance cut-offs and scholarship thresholds for your jurisdiction."</p>

                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-black/5 pb-2">
                           <span className="text-token-micro font-black uppercase text-brand-primary">Cut-off Score</span>
                           <span className="font-display font-black text-brand-tertiary">{config?.cutoffScore || 50}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/5 pb-2">
                           <span className="text-token-micro font-black uppercase text-brand-primary">Scholarship Mark</span>
                           <span className="font-display font-black text-brand-tertiary">{config?.scholarshipScore || 90}%</span>
                        </div>

                        <button className="mt-2 w-full flex items-center justify-center gap-2 p-3 bg-brand-primary text-white rounded-xl hover:opacity-90 transition-all font-black text-token-micro uppercase tracking-widest">
                           Adjust Thresholds <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>

                  {/* Conversion Pulse */}
                  <div className="bg-brand-primary rounded-2xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Activity size={80} />
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-accent italic">Yield Optimal</h3>
                        <p className="text-token-micro font-medium text-white/50 mt-1">Growth vectors matching baseline targets.</p>

                        <div className="mt-8 flex items-baseline gap-2">
                           <span className="text-4xl font-display font-black tracking-tighter italic">{stats?.yieldPct || "0"}%</span>
                           <TrendingUp className="text-brand-success" size={20} />
                        </div>

                        <button className="mt-8 w-full bg-white text-brand-primary py-3 rounded-xl font-black text-token-micro uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform active:scale-95">
                           Strategic Report
                        </button>
                     </div>
                  </div>

                  {/* Scholarship Review Panel (Director Only) */}
                  {scholarshipCandidates.length > 0 && (
                     <div className="card glass-premium flex flex-col gap-6 border-[brand-secondary]/30">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-[brand-secondary]/20 text-brand-primary rounded-xl">
                                 <Award size={20} />
                              </div>
                              <h4 className="font-black text-brand-primary uppercase text-xs tracking-widest">Scholarship Review</h4>
                           </div>
                           <span className="bg-brand-primary text-white text-token-micro font-black px-2 py-1 rounded-md">{scholarshipCandidates.length} Pending</span>
                        </div>

                        <div className="flex flex-col gap-3">
                           {scholarshipCandidates.slice(0, 3).map((c: any) => (
                              <div key={c.id} className="p-4 border border-brand-primary/10 rounded-xl bg-white hover:border-[brand-secondary]/50 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                    <div>
                                       <p className="text-xs font-black text-brand-primary uppercase">{c.applicantName}</p>
                                       <p className="text-token-micro text-brand-tertiary font-bold tracking-widest uppercase">{c.targetClass}</p>
                                    </div>
                                    <span className="text-lg font-display font-black text-[brand-secondary]">{c.entranceScore}%</span>
                                 </div>
                                 <div className="flex gap-2 mt-4">
                                    <button
                                       onClick={() => handleOfferAdmission(c.id)}
                                       disabled={offeringAdmission === c.id}
                                       className="flex-1 bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                       {offeringAdmission === c.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                       {offeringAdmission === c.id ? "Sending..." : "Approve & Offer"}
                                    </button>
                                    <button
                                       onClick={async () => {
                                          await fetch(`/api/admissions/${c.id}`, { method: "PATCH", body: JSON.stringify({ status: "QUALIFIED", isScholarshipEligible: false }) });
                                          setScholarshipCandidates(prev => prev.filter(sc => sc.id !== c.id));
                                          toast.error("Scholarship Denied. Standard Admission.");
                                       }}
                                       className="flex-1 bg-brand-blush text-brand-tertiary font-black text-token-micro uppercase tracking-widest py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
                                    >
                                       Deny
                                    </button>
                                 </div>
                              </div>
                           ))}
                           {scholarshipCandidates.length > 3 && (
                              <button className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest hover:underline mt-2">
                                 View All {scholarshipCandidates.length} Candidates
                              </button>
                           )}
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </div>

         {/* View Details Modal */}
         <AnimatePresence>
            {selectedCandidate && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary/80 backdrop-blur-sm"
                  onClick={(e) => { if (e.target === e.currentTarget) setSelectedCandidate(null); }}
               >
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
                  >
                     <div className="bg-brand-primary p-6 flex justify-between items-center text-white">
                        <div>
                           <h3 className="font-display font-black text-xl uppercase tracking-tight">{selectedCandidate.applicantName}</h3>
                           <p className="text-token-micro font-black uppercase tracking-widest text-brand-secondary">
                              {selectedCandidate.targetClass} • {selectedCandidate.campus} Campus
                           </p>
                        </div>
                        <button onClick={() => setSelectedCandidate(null)} className="text-white/50 hover:text-white">
                           <X size={20} />
                        </button>
                     </div>
                     
                     <div className="p-8 flex flex-col gap-6">
                        <div className="bg-brand-blush/30 p-6 rounded-xl border border-brand-primary/5">
                           <h4 className="text-token-micro font-black text-brand-primary uppercase tracking-widest mb-4">Guardian Information</h4>
                           <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                 <span className="font-bold text-brand-primary/60">Name:</span>
                                 <span className="font-black text-brand-primary uppercase">{selectedCandidate.parentName}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="font-bold text-brand-primary/60">Phone:</span>
                                 <span className="font-black text-brand-primary uppercase">{selectedCandidate.parentPhone}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="font-bold text-brand-primary/60">Email:</span>
                                 <span className="font-black text-brand-primary uppercase">{selectedCandidate.parentEmail}</span>
                              </div>
                           </div>
                        </div>

                        {selectedCandidate.notes && (
                           <div>
                              <h4 className="text-token-micro font-black text-brand-primary uppercase tracking-widest mb-2">Application Notes</h4>
                              <p className="text-xs text-brand-primary/60 italic">{selectedCandidate.notes}</p>
                           </div>
                        )}
                        
                        <div className="flex justify-end pt-4">
                           <button
                              onClick={async () => {
                                 setSendingEmail(true);
                                 try {
                                    const res = await sendExamDetails(selectedCandidate.id);
                                    if (res.success) {
                                       toast.success("Exam details sent successfully!");
                                       setSelectedCandidate(null);
                                       // Refresh queue
                                       const updateRes = await fetch("/api/admissions?status=APPLIED");
                                       const updateData = await updateRes.json();
                                       setCandidates(updateData.admissions || []);
                                    } else {
                                       toast.error(res.error || "Failed to send email.");
                                    }
                                 } catch (err) {
                                    toast.error("An error occurred.");
                                 } finally {
                                    setSendingEmail(false);
                                 }
                              }}
                              disabled={sendingEmail}
                              className="bg-brand-primary text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-brand-accent transition-colors flex items-center gap-2 disabled:opacity-50"
                           >
                              {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                              {sendingEmail ? "SENDING..." : "SEND EXAM DETAILS"}
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </DashboardShell>
   );
}

function FunnelStage({ label, val, max, color }: any) {
   const pct = Math.max(5, (val / max) * 100);
   return (
      <div className="flex flex-col gap-2 group">
         <div className="flex justify-between items-baseline px-2">
            <span className="text-token-micro font-black uppercase tracking-widest text-brand-primary/60 group-hover:text-brand-tertiary transition-colors">{label}</span>
            <span className="text-xs font-black text-brand-primary italic">{val.toLocaleString()}</span>
         </div>
         <div className="h-5 bg-brand-blush rounded-full overflow-hidden border border-brand-primary/8 shadow-inner">
            <motion.div
               initial={{ width: 0 }}
               animate={{ width: `${pct}%` }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className={clsx("h-full rounded-full shadow-lg", `bg-${color}`)}
            />
         </div>
      </div>
   );
}

function KPICard({ label, value, icon, trend, color }: any) {
   return (
      <div className="card h-44 flex flex-col justify-between p-8 group hover:-translate-y-1 transition-all shadow-premium border-none">
         <div className="flex justify-between items-center">
            <h3 className="text-token-caption font-black uppercase tracking-widest text-brand-tertiary">{label}</h3>
            <div className="p-3 bg-brand-blush rounded-xl text-brand-tertiary group-hover:scale-110 transition-transform">
               {icon}
            </div>
         </div>
         <div>
            <div className="text-4xl font-display font-black tracking-tighter text-brand-primary italic mb-1">{value}</div>
            <div className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary">{trend}</div>
         </div>
      </div>
   );
}

function clsx(...classes: any[]) {
   return classes.filter(Boolean).join(' ');
}

