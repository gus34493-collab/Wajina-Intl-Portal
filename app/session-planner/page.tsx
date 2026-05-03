"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  CalendarDays, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Zap,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function SessionPlannerPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Header Unit */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                   <Clock size={16} />
                </div>
                <span className="text-token-micro font-black uppercase text-brand-accent tracking-widest">Temporal Governance</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-tight">Academic Session Planner</h1>
             <p className="text-brand-primary/60 text-lg font-medium mt-1">Configure institutional timelines, term breaks, and session transitions.</p>
           </div>
           
           <div className="flex gap-3">
              <Button className="bg-brand-primary text-white px-8 py-7 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20">
                 <Plus size={18} className="mr-2" />
                 Open New Session
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Current Context */}
           <div className="lg:col-span-1 space-y-8">
              <div className="card glass-premium p-10 border-l-4 border-l-brand-tertiary">
                 <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-brand-primary text-token-micro uppercase tracking-widest">Active Horizon</h4>
                    <span className="px-3 py-1 bg-brand-success/10 text-brand-success rounded-full text-token-micro font-black uppercase">LIVE</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-3xl font-display font-black text-brand-primary">2025/2026 Session</p>
                    <p className="text-sm font-bold text-brand-tertiary uppercase tracking-wide">First Term · Week 8</p>
                 </div>
                 <div className="mt-10 p-6 bg-brand-blush rounded-2xl flex items-center gap-4">
                    <Zap size={20} className="text-brand-accent" />
                    <div>
                       <p className="text-token-micro font-black text-brand-primary uppercase mb-0.5">Transition Readiness</p>
                       <p className="text-xs font-medium text-brand-primary/60">Next term starts in 24 days.</p>
                    </div>
                 </div>
              </div>

              <div className="card bg-brand-blush border-dashed border-2 border-brand-primary/8 p-8 flex flex-col gap-6">
                 <h4 className="font-black text-brand-tertiary text-token-micro uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14} /> Global Constraints
                 </h4>
                 <div className="space-y-4">
                    <ConstraintItem label="Min Instructional Days" value="84" />
                    <ConstraintItem label="Examination Buffer" value="10 Days" />
                    <ConstraintItem label="Public Holidays Sync" value="Verified" />
                 </div>
              </div>
           </div>

           {/* Timeline Explorer */}
           <div className="lg:col-span-2 space-y-8">
              {loading ? (
                 <div className="py-20 text-center italic text-brand-tertiary">Loading academic timelines...</div>
              ) : sessions.length === 0 ? (
                 <div className="card bg-white py-32 text-center">
                    <CalendarDays className="mx-auto text-brand-tertiary/10 mb-6" size={64} />
                    <h3 className="text-xl font-black text-brand-primary">No Timeline Anchors</h3>
                    <p className="text-brand-tertiary text-sm mt-1">Start by defining your first institutional session.</p>
                 </div>
              ) : sessions.map((session) => (
                 <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card group hover:border-brand-tertiary/20 transition-all p-10 flex flex-col gap-8"
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl grid place-items-center ${session.status === 'ACTIVE' ? 'bg-brand-tertiary text-white shadow-lg shadow-brand-tertiary/20' : 'bg-brand-blush text-brand-tertiary'}`}>
                             <CalendarDays size={24} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-brand-primary tracking-tight">{session.name}</h4>
                             <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest">
                                {new Date(session.startDate).getFullYear()} - {new Date(session.endDate).getFullYear()} Period
                             </p>
                          </div>
                       </div>
                       <ArrowRight size={20} className="text-brand-tertiary group-hover:translate-x-1 group-hover:text-brand-tertiary transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {session.terms.map((term: any) => (
                          <div key={term.id} className={`p-6 rounded-2xl border transition-all ${term.status === 'ACTIVE' ? 'bg-brand-tertiary/5 border-brand-tertiary/20' : 'bg-white border-brand-primary/8'}`}>
                             <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mb-1">{term.name}</p>
                             <div className="flex items-center justify-between">
                                <span className={`text-xs font-black uppercase ${term.status === 'ACTIVE' ? 'text-brand-primary' : 'text-brand-tertiary'}`}>{term.status}</span>
                                {term.status === 'COMPLETED' ? <CheckCircle2 size={12} className="text-brand-success" /> : term.status === 'ACTIVE' ? <Zap size={12} className="text-brand-accent animate-pulse" /> : <div className="w-2 h-2 rounded-full border border-brand-primary/10" />}
                             </div>
                          </div>
                       ))}
                    </div>
                 </motion.div>
              ))}
           </div>

        </div>

      </div>
    </DashboardShell>
  );
}

function ConstraintItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-token-caption font-black text-brand-tertiary uppercase tracking-tight">{label}</span>
       <span className="text-xs font-black text-brand-primary">{value}</span>
    </div>
  );
}

