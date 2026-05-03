"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Handshake, 
  Users, 
  MessageSquare, 
  Search, 
  Filter,
  ChevronRight,
  TrendingUp,
  MailCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function ParentRelationsPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parents?query=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setParents(data.parents || []);
      }
    } catch (err) {
      console.error("Failed to fetch parents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [searchQuery]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto py-8">
        
        {/* Header Unit */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-tertiary/10 flex items-center justify-center text-brand-tertiary">
                   <Handshake size={16} />
                </div>
                <span className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest">Community Stewardship</span>
             </div>
             <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-tight">Parent Relations Command</h1>
             <p className="text-brand-primary/60 text-lg font-medium mt-1">Institutional parent engagement strategies and relationship management.</p>
           </div>
           
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tertiary" size={16} />
              <Input 
                 placeholder="Search parents..." 
                 className="bg-white border-brand-primary/8 text-brand-primary pl-11 rounded-xl h-14 shadow-sm"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           
           {/* Sidebar: Engagement Metrics */}
           <div className="lg:col-span-1 space-y-8">
              <div className="card glass-premium p-10 flex flex-col gap-8">
                 <div className="flex flex-col gap-1">
                    <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Active Households</p>
                    <p className="text-4xl font-display font-black text-brand-primary">{parents.length}</p>
                 </div>
                 <div className="flex flex-col gap-4 pt-4 border-t border-brand-primary/8">
                    <EngagementItem label="Participation Rate" value="78%" color="text-brand-success" />
                    <EngagementItem label="Response Velocity" value="4h" color="text-brand-tertiary" />
                 </div>
              </div>

              <div className="card bg-brand-blush p-8 flex flex-col gap-6">
                 <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro flex items-center gap-2">
                    <MailCheck size={14} className="text-brand-tertiary" /> Mass Communication
                 </h4>
                 <div className="space-y-4">
                    <button className="w-full py-4 bg-brand-primary text-white text-token-micro font-black uppercase tracking-widest rounded-xl hover:opacity-90">
                       Send Newsletter
                    </button>
                    <button className="w-full py-4 bg-white border border-brand-primary/8 text-brand-primary text-token-micro font-black uppercase tracking-widest rounded-xl hover:bg-white/50">
                       Urgent Broadcast
                    </button>
                 </div>
              </div>
           </div>

           {/* Parent Directory */}
           <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {loading ? (
                    Array(4).fill(0).map((_, i) => (
                       <div key={i} className="card h-40 animate-pulse bg-white/50" />
                    ))
                 ) : parents.length === 0 ? (
                    <div className="col-span-full py-32 text-center card bg-white">
                       <Users className="mx-auto text-brand-tertiary/10 mb-6" size={64} />
                       <h3 className="text-xl font-black text-brand-primary">No Active Households</h3>
                       <p className="text-brand-tertiary text-sm mt-1">Start by synchronizing your parent registry.</p>
                    </div>
                 ) : parents.map((parent) => (
                    <motion.div 
                       key={parent.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="card group hover:border-brand-tertiary/20 transition-all p-8 flex flex-col gap-6"
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-brand-blush grid place-items-center text-brand-primary/60 group-hover:text-brand-tertiary transition-colors font-display font-black text-lg">
                                {parent.name.charAt(0)}
                             </div>
                             <div>
                                <h4 className="font-black text-brand-primary leading-tight">{parent.name}</h4>
                                <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest">{parent.email}</p>
                             </div>
                          </div>
                          <button className="p-2 text-brand-tertiary hover:text-brand-tertiary transition-colors">
                             <MessageSquare size={18} />
                          </button>
                       </div>

                       <div className="flex items-center gap-6 pt-4 border-t border-brand-primary/8">
                          <div className="flex flex-col gap-0.5">
                             <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-tighter">Wards</p>
                             <p className="text-xs font-black text-brand-primary">2 Students</p>
                          </div>
                          <div className="flex flex-col gap-0.5 ml-auto">
                             <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-tighter">Status</p>
                             <div className="flex items-center gap-1.5 text-brand-success">
                                <MailCheck size={12} />
                                <span className="text-token-micro font-black uppercase">Verified</span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </DashboardShell>
  );
}

function EngagementItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-token-caption font-black text-brand-tertiary uppercase tracking-tight">{label}</span>
       <div className={`flex items-center gap-2 font-display font-black text-lg ${color}`}>
          <TrendingUp size={14} />
          {value}
       </div>
    </div>
  );
}

