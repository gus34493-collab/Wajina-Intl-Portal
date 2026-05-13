"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import {
  Handshake,
  Users,
  MessageSquare,
  Search,
  ChevronRight,
  TrendingUp,
  MailCheck,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";

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
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">COMMUNITY STEWARDSHIP</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Parent <span className="text-brand-secondary">Relations</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" size={14} />
              <input
                placeholder="Search parents..."
                className="bg-white border border-brand-primary/8 text-brand-primary pl-9 pr-4 py-2 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-secondary/20 w-52"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              PR
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Engagement Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-token-micro font-black text-white/50 uppercase tracking-widest">Active Households</p>
                <p className="text-5xl font-display font-black text-white tracking-tighter leading-none">{parents.length}</p>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                <EngagementItem label="Participation Rate" value="78%" />
                <EngagementItem label="Response Velocity" value="4h" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex flex-col gap-4">
              <h4 className="font-black text-brand-primary text-token-micro uppercase tracking-widest flex items-center gap-2">
                <MailCheck size={14} className="text-brand-secondary" /> Mass Communication
              </h4>
              <div className="flex flex-col gap-3">
                <button className="w-full py-3.5 bg-brand-primary text-white text-token-micro font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
                  Send Newsletter
                </button>
                <button className="w-full py-3.5 bg-brand-primary/5 border border-brand-primary/8 text-brand-primary text-token-micro font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary/10 transition-all">
                  Urgent Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* Parent Directory */}
          <div className="lg:col-span-3">
            {/* Mobile search */}
            <div className="relative md:hidden mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" size={14} />
              <input
                placeholder="Search parents..."
                className="w-full bg-white border border-brand-primary/8 text-brand-primary pl-9 pr-4 py-3 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-secondary/20"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-brand-primary/8 h-40 animate-pulse" />
                ))
              ) : parents.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-brand-primary/8">
                  <Users className="mx-auto text-brand-primary/10 mb-4" size={48} />
                  <h3 className="text-lg font-black text-brand-primary">No Active Households</h3>
                  <p className="text-brand-primary/40 text-sm mt-1">Start by synchronizing your parent registry.</p>
                </div>
              ) : parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm group hover:border-brand-secondary/20 transition-all p-6 flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/8 grid place-items-center text-brand-primary font-display font-black text-lg group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                        {parent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-brand-primary leading-tight">{parent.name}</h4>
                        <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-widest">{parent.email}</p>
                      </div>
                    </div>
                    <button className="p-2 text-brand-primary/30 hover:text-brand-secondary transition-colors">
                      <MessageSquare size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-brand-primary/5">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Wards</p>
                      <p className="text-xs font-black text-brand-primary">2 Students</p>
                    </div>
                    <div className="flex flex-col gap-0.5 ml-auto">
                      <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">Status</p>
                      <div className="flex items-center gap-1.5 text-brand-secondary">
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

function EngagementItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-token-micro font-black text-white/50 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-1.5 font-display font-black text-white">
        <TrendingUp size={12} className="text-brand-secondary" />
        {value}
      </div>
    </div>
  );
}
