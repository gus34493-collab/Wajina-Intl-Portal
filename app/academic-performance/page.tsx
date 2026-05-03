"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BookOpen,
  Users,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AcademicPerformance() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/subjects");
        const data = await res.json();
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      } catch (err) {
        console.error("Failed to fetch academic analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.className.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">Subject Intelligence</h1>
          <p className="text-brand-primary/60 text-sm font-medium mt-1">Institutional academic performance metrics and mastery trends.</p>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tertiary w-5 h-5 group-focus-within:scale-110 transition-transform" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject nomenclature or class..."
              className="w-full bg-white border border-brand-primary/8 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-soft focus:ring-4 focus:ring-brand-tertiary/10 outline-none transition-all placeholder:text-brand-tertiary/50"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <div className="bg-white border border-brand-primary/8 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm border-l-4 border-l-brand-tertiary">
                <BookOpen className="w-5 h-5 text-brand-tertiary" />
                <div>
                   <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest">Active Subjects</p>
                   <p className="text-sm font-black text-brand-primary leading-none mt-0.5">{subjects.length}</p>
                </div>
             </div>
             <div className="bg-white border border-brand-primary/8 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm border-l-4 border-l-brand-success">
                <GraduationCap className="w-5 h-5 text-brand-success" />
                <div>
                   <p className="text-token-micro font-black uppercase text-brand-tertiary tracking-widest">High Mastery</p>
                   <p className="text-sm font-black text-brand-primary leading-none mt-0.5">
                    {subjects.filter(s => s.average >= 70).length}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SubjectSkeleton key={i} />
              ))
            ) : filteredSubjects.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-50">
                <p className="font-bold text-brand-tertiary">Zero subject data found in current academic vector.</p>
              </div>
            ) : (
              filteredSubjects.map((s, i) => (
                <SubjectCard key={s.id} subject={s} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </DashboardShell>
  );
}

function SubjectCard({ subject, index }: { subject: any, index: number }) {
  const isHigh = subject.average >= 70;
  const isLow = subject.average < 45;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      layout
      className="card border-l-4 hover:scale-[1.02] transition-all group"
      style={{ borderLeftColor: isHigh ? "#22c55e" : isLow ? "#ef4444" : "#519CAB" }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-display font-black text-brand-primary tracking-tight leading-tight group-hover:text-brand-tertiary transition-colors">
            {subject.name}
          </h3>
          <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.15em] mt-1">{subject.className}</p>
        </div>
        <div className={clsx(
          "p-2 rounded-xl transition-colors",
          isHigh ? "bg-brand-secondary/10 text-brand-secondary" : isLow ? "bg-rose-50 text-rose-700" : "bg-brand-blush text-brand-tertiary"
        )}>
          {isHigh ? <TrendingUp size={20} /> : isLow ? <TrendingDown size={20} /> : <Minus size={20} />}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-8">
        <span className={clsx(
          "text-4xl font-display font-black tracking-tighter",
          isHigh ? "text-brand-success" : isLow ? "text-brand-error" : "text-brand-primary"
        )}>
          {subject.average}
        </span>
        <span className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Avg Score</span>
      </div>

      <div className="pt-4 border-t border-brand-primary/8 flex justify-between items-center">
        <div className="flex items-center gap-2 text-brand-primary/60">
          <Users size={14} className="text-brand-tertiary" />
          <span className="text-token-micro font-black uppercase tracking-widest">{subject.studentCount} Scholars</span>
        </div>
        <button className="flex items-center gap-1 text-token-micro font-black text-brand-tertiary hover:underline uppercase tracking-widest">
          View Data
          <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function SubjectSkeleton() {
  return (
    <div className="card h-52 flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-brand-blush rounded animate-pulse" />
          <div className="h-2 w-20 bg-brand-blush rounded animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-brand-blush rounded-xl animate-pulse" />
      </div>
      <div className="flex-1 flex items-center">
        <div className="h-10 w-24 bg-brand-blush rounded animate-pulse" />
      </div>
      <div className="h-8 w-full border-t border-brand-primary/8 pt-2 flex justify-between items-center">
         <div className="h-2 w-16 bg-brand-blush rounded animate-pulse" />
         <div className="h-2 w-20 bg-brand-blush rounded animate-pulse" />
      </div>
    </div>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

