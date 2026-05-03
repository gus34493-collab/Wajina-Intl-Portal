"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Users, 
  Search, 
  FileBox, 
  GraduationCap, 
  ChevronRight,
  Filter,
  History,
  IdCard
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function PupilRecordsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?query=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto py-6 px-4 sm:px-6">
        
        {/* Search Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">Pupil Records Archive</h1>
             <p className="text-brand-primary/60 text-base font-medium mt-1">Central institutional registry for student academic & lifecycle data</p>
           </div>
           
           <div className="relative w-full md:w-[400px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tertiary" size={18} />
             <Input 
                className="pl-12 py-7 rounded-2xl border-brand-primary/8 bg-white shadow-sm focus:ring-brand-tertiary/20"
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* Sidebar Filter / Recents */}
           <div className="lg:col-span-3 space-y-6">
              <div className="card glass-premium p-8">
                 <div className="flex items-center gap-3 mb-8">
                    <Filter size={18} className="text-brand-tertiary" />
                    <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-caption">Lifecycle Filters</h4>
                 </div>
                 <div className="space-y-3">
                    <FilterButton label="Active Students" count={students.length} active />
                    <FilterButton label="Graduated" count={0} />
                    <FilterButton label="Transferred" count={0} />
                    <FilterButton label="Withdrawn" count={0} />
                 </div>
              </div>

              <div className="card p-8 bg-brand-blush/50 border-dashed border-2">
                 <h4 className="font-black text-brand-tertiary uppercase tracking-widest text-token-micro mb-6 flex items-center gap-2">
                   <History size={14} /> Recently Accessed
                 </h4>
                 <div className="space-y-4">
                    <p className="text-token-caption font-bold text-brand-tertiary italic">No recent record views detected in this session.</p>
                 </div>
              </div>
           </div>

           {/* Main Students List */}
           <div className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {loading ? (
                    Array(6).fill(0).map((_, i) => (
                       <div key={i} className="card h-48 animate-pulse bg-white/50" />
                    ))
                 ) : students.length === 0 ? (
                    <div className="col-span-full py-20 text-center card bg-white">
                       <FileBox className="mx-auto text-brand-tertiary/20 mb-4" size={48} />
                       <h3 className="font-black text-brand-primary">No Records Found</h3>
                       <p className="text-brand-tertiary text-sm mt-1">Adjust your search parameters or query.</p>
                    </div>
                 ) : students.map((student) => (
                    <motion.div 
                       key={student.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       onClick={() => setSelectedStudent(student)}
                       className="card group cursor-pointer hover:border-brand-tertiary/20 transition-all flex flex-col gap-6"
                    >
                       <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary/60 group-hover:text-brand-tertiary transition-colors font-display text-xl font-black">
                                {student.name.charAt(0)}
                             </div>
                             <div>
                                <p className="font-black text-brand-primary text-lg">{student.name}</p>
                                <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{student.enrolledClass?.name || "No Class"}</p>
                             </div>
                          </div>
                          <ChevronRight size={18} className="text-brand-tertiary group-hover:translate-x-1 transition-transform" />
                       </div>

                       <div className="flex items-center gap-6 pt-4 border-t border-brand-primary/8">
                          <div className="flex flex-col gap-1">
                             <p className="text-token-micro font-bold text-brand-tertiary uppercase">Student ID</p>
                             <p className="text-xs font-black text-brand-primary">{student.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                             <p className="text-token-micro font-bold text-brand-tertiary uppercase">Enrollment</p>
                             <p className="text-xs font-black text-brand-primary">{student.enrolledArm?.fullName || "N/A"}</p>
                          </div>
                          <div className="flex flex-col gap-1 ml-auto">
                             <span className="px-3 py-1 bg-brand-tertiary/10 text-brand-tertiary rounded-full text-token-micro font-black uppercase tracking-widest">
                                Active
                             </span>
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

function FilterButton({ label, count, active = false }: { label: string, count: number, active?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
      active 
      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
      : "bg-white border border-brand-primary/8 text-brand-primary hover:bg-brand-blush"
    }`}>
      <span className="text-xs font-black uppercase tracking-tight">{label}</span>
      <span className={`text-token-micro font-black px-2 py-0.5 rounded-lg ${active ? "bg-white/20" : "bg-brand-blush"}`}>{count}</span>
    </button>
  );
}

