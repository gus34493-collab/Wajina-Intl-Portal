"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  ShieldCheck, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  RotateCcw,
  Search,
  ChevronRight,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OperationsHub() {
  const [risks, setRisks] = useState<any[]>([]);
  const [campusFilter, setCampusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchRisks() {
      setLoading(true);
      try {
        const res = await fetch(`/api/risks?status=OPEN${campusFilter !== "ALL" ? "&campus=" + campusFilter : ""}`);
        const data = await res.json();
        setRisks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch risks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRisks();
  }, [campusFilter]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-display font-black text-brand-gunmetal tracking-tight">Command Operations</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Manage institutional compliance, operational hazards, and facility logistics across all campuses.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-[10px] font-black uppercase text-text-muted px-1 tracking-widest">Campus Scope</label>
              <select 
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="bg-white border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-brand-moonstone/20 outline-none transition-all"
              >
                <option value="ALL">All Campuses</option>
                <option value="PRIMARY">Primary Campus</option>
                <option value="SECONDARY">College Campus</option>
              </select>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2 group h-[42px] px-6 mt-auto"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Log Operational Task</span>
            </button>
          </div>
        </div>

        {/* Regulatory Compliance Matrix */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-brand-moonstone/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-brand-moonstone" />
            </div>
            <h3 className="text-lg font-display font-black text-brand-gunmetal uppercase tracking-tight">Regulatory Compliance Matrix</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ComplianceCard 
              title="MOH Health Inspection" 
              status="Current" 
              desc="Institutional sanitation and infirmary standards audit."
              exp="Dec 2026"
              action="View Cert"
            />
            <ComplianceCard 
              title="Fire Safety Audit" 
              status="Expiring Soon" 
              statusType="pending"
              desc="Annual Federal Fire Service equipment and evacuation audit."
              exp="Jul 2026"
              action="Initiate Renewal"
              actionIcon={<RotateCcw className="w-3 h-3" />}
            />
            <ComplianceCard 
              title="Academic Accreditation" 
              status="Verified" 
              desc="Lagos State Ministry of Education Quality Assurance (LASG-QED)."
              exp="Audit 2028"
              action="Full Audit Log"
            />
             <ComplianceCard 
              title="NDPR Data Privacy" 
              status="Action Required" 
              statusType="error"
              desc="Annual Data Privacy Audit Report (DPAR) for NDPR standards."
              exp="Missed"
              action="Download Notice"
            />
          </div>
        </div>

        {/* Active Operational Queue */}
        <div className="space-y-6 mt-4">
          <h3 className="text-lg font-display font-black text-brand-gunmetal px-2 uppercase tracking-tight">Active Operational Queue</h3>
          
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-moonstone" />
                  <p className="text-xs font-bold mt-4 uppercase tracking-widest">Synchronizing Campus Operations...</p>
                </div>
              ) : risks.length === 0 ? (
                <div className="card bg-black/5 border-dashed border-2 border-black/10 py-20 flex flex-col items-center opacity-50">
                  <CheckCircle2 className="w-10 h-10 text-brand-success mb-4" />
                  <p className="text-sm font-bold">No active operational tasks found for this scope.</p>
                </div>
              ) : (
                risks.map((risk, i) => (
                  <OperationTask key={risk.id} task={risk} index={i} />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Log Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-gunmetal/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-black text-brand-gunmetal tracking-tight">Log Operational Task</h2>
                  <button onClick={() => setIsModalOpen(false)} className="press-effect p-2 rounded-full hover:bg-black/5 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <LogTaskForm onSuccess={() => {
                  setIsModalOpen(false);
                  // Trigger re-fetch (can use a key or state)
                  setCampusFilter(prev => prev === "ALL" ? " " : "ALL");
                  setTimeout(() => setCampusFilter("ALL"), 10);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function ComplianceCard({ title, status, desc, exp, action, statusType = "success", actionIcon }: any) {
  return (
    <div className="card flex flex-col gap-4 border-l-4 border-l-brand-moonstone hover:shadow-soft">
      <div className="flex justify-between items-start">
        <h4 className="font-black text-brand-gunmetal text-sm leading-tight flex-1 pr-2">{title}</h4>
        <span className={clsx(
          "text-[9px] font-black px-2 py-1 rounded-[6px] uppercase tracking-wider",
          statusType === "success" ? "bg-emerald-50 text-emerald-700" : 
          statusType === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
        )}>
          {status}
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed min-h-[48px]">{desc}</p>
      <div className="mt-auto pt-4 border-t border-black/5 flex justify-between items-center">
        <span className="text-[10px] font-bold text-text-secondary">Exp: <span className="text-brand-gunmetal">{exp}</span></span>
        <button className="flex items-center gap-1.5 text-[10px] font-black text-brand-moonstone hover:underline uppercase tracking-widest">
          {action}
          {actionIcon || <ExternalLink className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

function OperationTask({ task, index }: any) {
  const sevColors: any = {
    CRITICAL: "bg-red-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-brand-moonstone"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-5 flex items-center justify-between border-black/[0.03] group hover:border-brand-moonstone/30"
    >
      <div className="flex items-center gap-5">
        <div className={clsx("w-1 h-8 rounded-full shrink-0", sevColors[task.severity] || "bg-gray-300")} />
        <div>
          <h4 className="text-sm font-black text-brand-gunmetal">{task.title}</h4>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
            {task.campus} · Logged by {task.creator?.name || 'Operations'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="hidden md:block text-[10px] font-black text-text-muted uppercase tracking-widest">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
        <button className="bg-brand-bg hover:bg-black/5 text-brand-gunmetal font-black text-[10px] py-2.5 px-6 rounded-lg uppercase tracking-widest transition-all">
          Review
        </button>
      </div>
    </motion.div>
  );
}

function LogTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      title: formData.get("title"),
      severity: formData.get("severity"),
      campus: formData.get("campus"),
      description: formData.get("description"),
    };

    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Task Title</label>
        <input 
          name="title"
          required
          placeholder="e.g. Broken perimeter fence"
          className="w-full bg-brand-bg border border-black/5 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-moonstone/10 outline-none"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Urgency</label>
          <select name="severity" className="w-full bg-brand-bg border border-black/5 rounded-2xl p-4 text-sm font-bold outline-none">
            <option value="CRITICAL">Critical / Immediate</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Standard Operation</option>
            <option value="LOW">Low Maintenance</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Target Campus</label>
          <select name="campus" className="w-full bg-brand-bg border border-black/5 rounded-2xl p-4 text-sm font-bold outline-none">
            <option value="PRIMARY">Wajina Primary</option>
            <option value="SECONDARY">Wajina College</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Instruction Details</label>
        <textarea 
          name="description"
          required
          placeholder="Describe the operational requirement..."
          className="w-full bg-brand-bg border border-black/5 rounded-2xl p-4 text-sm font-bold h-32 focus:ring-4 focus:ring-brand-moonstone/10 outline-none"
        />
      </div>

      <button 
        disabled={loading}
        className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 press-effect mt-4"
      >
        {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
        <span className="font-display font-black uppercase tracking-widest">Log Task into Queue</span>
      </button>
    </form>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
