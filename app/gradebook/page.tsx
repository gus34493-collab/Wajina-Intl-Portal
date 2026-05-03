"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  ArrowLeft, 
  Save, 
  RotateCw, 
  Search, 
  ChevronDown,
  FileCheck,
  AlertCircle,
  HelpCircle,
  LayoutGrid,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAssessmentConfig, calculateScore } from "@/lib/academic-engine";

export default function Gradebook() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [grades, setGrades] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/structure/subjects");
        const json = await res.json();
        setSubjects(json.subjects || []);
      } catch (err) {
        console.error("Gradebook init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadSubject(sub: any) {
    setLoading(true);
    setActiveSubject(sub);
    
    // Resolve Config
    const assessmentConfig = getAssessmentConfig(sub.class.campus, sub.class.category, sub.class.name);
    setConfig(assessmentConfig);

    try {
      const studentRes = await fetch(`/api/users?role=STUDENT&classId=${sub.class.id}`);
      const studentJson = await studentRes.json();
      setStudents(studentJson.users || []);

      // Pre-load existing grades
      const gradeRes = await fetch(`/api/grades?subjectId=${sub.id}&termId=current`);
      const gradeJson = await gradeRes.json();
      
      const gradeMap = new Map();
      (gradeJson.grades || []).forEach((g: any) => {
        gradeMap.set(g.studentId, g);
      });
      setGrades(gradeMap);

    } catch (err) {
      console.error("Subject load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCellChange(studentId: string, key: string, val: string) {
    const numericVal = parseFloat(val) || 0;
    
    // Update Local State Map
    const newGrades = new Map(grades);
    const existing = newGrades.get(studentId) || { studentId };
    const updated = { ...existing, [key]: numericVal };
    
    // Re-calculate Total/Grade
    const result = calculateScore(updated, config);
    newGrades.set(studentId, { ...updated, total: result.total, grade: result.grade });

    setGrades(newGrades);
    triggerAutoSave(newGrades);
  }

  function triggerAutoSave(currentGrades: Map<string, any>) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSyncing(true);
    
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch("/api/grades/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId: activeSubject.id,
            termId: 'current', // Logic usually resolves 'current' on backend but good to be explicit
            sessionId: 'current',
            grades: Array.from(currentGrades.values())
          })
        });
        setSyncing(false);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 2000);
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 h-[calc(100vh-140px)]">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveSubject(null)}
                className="w-12 h-12 rounded-2xl bg-white border border-brand-primary/8 shadow-premium flex items-center justify-center text-brand-primary hover:bg-brand-blush transition-all"
              >
                 <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight uppercase italic underline decoration-brand-tertiary/20">
                   {activeSubject ? `${activeSubject.name} Marksheet` : "Academic Registry"}
                </h1>
                <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em] mt-1">
                   {activeSubject ? `${activeSubject.class.name} • ${activeSubject.class.campus}` : "Select a instructional domain to begin entry."}
                </p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className={clsx(
                "flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all",
                syncing ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accent" : "bg-brand-success/10 border-brand-success/20 text-brand-success"
              )}>
                 {syncing ? <RotateCw size={14} className="animate-spin" /> : <FileCheck size={14} />}
                 <span className="text-token-micro font-black uppercase tracking-widest">{syncing ? "Synchronizing..." : "Registry Synced"}</span>
              </div>
              <button className="bg-brand-primary text-white rounded-2xl px-6 py-2.5 font-black text-token-micro uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                 <Save size={14} /> Commit Batch
              </button>
           </div>
        </div>

        {!activeSubject ? (
          /* Subject Selector */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar">
             {loading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-40 bg-white border border-brand-primary/8 rounded-[32px] animate-pulse" />
                ))
             ) : subjects.map((sub, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 onClick={() => loadSubject(sub)}
                 className="card p-8 group hover:-translate-y-2 cursor-pointer transition-all border-none shadow-premium bg-white flex flex-col justify-between"
               >
                  <div className="flex justify-between items-start">
                     <div className="w-12 h-12 rounded-2xl bg-brand-tertiary/10 flex items-center justify-center text-brand-tertiary">
                        <LayoutGrid size={20} />
                     </div>
                     <span className="text-token-micro font-black px-3 py-1 bg-brand-blush rounded-lg uppercase tracking-widest text-brand-tertiary">{sub.class.campus}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight group-hover:text-brand-tertiary transition-colors">{sub.name}</h3>
                    <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest mt-1 italic">{sub.class.name}</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                     <div className="flex -space-x-2">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="w-6 h-6 rounded-full bg-brand-blush border-2 border-white" />
                        ))}
                        <div className="w-6 h-6 rounded-full bg-brand-primary text-white text-token-micro font-black flex items-center justify-center">+24</div>
                     </div>
                     <Zap size={14} className="text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
               </motion.div>
             ))}
          </div>
        ) : (
          /* High-Density Grid */
          <div className="flex flex-col gap-6 bg-white border border-brand-primary/8 rounded-[32px] p-8 shadow-premium overflow-hidden">
             
             {/* Toolbar */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tertiary" size={16} />
                   <input 
                     placeholder="Filter students by name/ID..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-brand-blush border border-brand-primary/8 rounded-2xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-brand-tertiary/5 focus:border-brand-tertiary/20 transition-all"
                   />
                </div>

                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-success" />
                      <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">Auto-calculate ON</span>
                   </div>
                   <button className="flex items-center gap-2 text-token-micro font-black text-brand-tertiary uppercase tracking-widest">
                      <HelpCircle size={14} /> Guidelines
                   </button>
                </div>
             </div>

             {/* Table View */}
             <div className="flex-1 overflow-auto rounded-[24px] border border-brand-primary/8 custom-scrollbar bg-brand-blush/30">
                <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 z-20">
                      <tr className="bg-white/80 backdrop-blur-md shadow-sm">
                         <th className="px-8 py-5 text-token-micro font-black uppercase tracking-[0.25em] text-brand-tertiary sticky left-0 z-30 bg-white">Scholastic Identity</th>
                         {config?.labels.map((l: string, i: number) => (
                           <th key={i} className="px-6 py-5 text-token-micro font-black uppercase tracking-[0.1em] text-brand-primary border-l border-brand-primary/8 text-center">
                              {l} <span className="opacity-30">({config.maxScores[i]})</span>
                           </th>
                         ))}
                         <th className="px-8 py-5 text-token-micro font-black uppercase tracking-[0.1em] text-brand-tertiary border-l border-brand-primary/8 text-center">Cyclical Total</th>
                         <th className="px-8 py-5 text-token-micro font-black uppercase tracking-[0.1em] text-brand-primary border-l border-brand-primary/8 text-center">Grade</th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredStudents.map((s, idx) => {
                         const studentGrades = grades.get(s.id) || {};
                         const total = studentGrades.total || 0;
                         return (
                           <tr key={idx} className="group hover:bg-white transition-colors border-b border-brand-primary/8">
                              <td className="px-8 py-5 sticky left-0 z-10 bg-white group-hover:bg-brand-blush/50 transition-colors">
                                 <div className="font-black text-brand-primary text-xs">{s.name}</div>
                                 <div className="text-token-micro font-bold text-brand-tertiary mt-1 uppercase tracking-widest">{s.id}</div>
                              </td>
                              {config?.maxScores.map((max: number, ki: number) => {
                                 const key = ['firstCA','secondCA','thirdCA','fourthCA','fifthCA','exam'][ki];
                                 const val = studentGrades[key] || "";
                                 return (
                                   <td key={ki} className="px-0 py-0 border-l border-brand-primary/8 group-hover:border-brand-tertiary/10 bg-transparent">
                                      <input 
                                        type="number"
                                        step="0.5"
                                        max={max}
                                        value={val}
                                        placeholder="0"
                                        onChange={(e) => handleCellChange(s.id, key, e.target.value)}
                                        className="w-full h-[60px] bg-transparent text-center text-xs font-black text-brand-primary outline-none focus:bg-white focus:ring-inset focus:ring-4 focus:ring-brand-tertiary/5 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                   </td>
                                 );
                              })}
                              <td className="px-8 py-5 border-l border-brand-primary/8 text-center">
                                 <span className={clsx(
                                   "text-token-caption font-black italic",
                                   total >= 50 ? "text-brand-tertiary" : "text-brand-error"
                                 )}>{total.toFixed(1)}</span>
                              </td>
                              <td className="px-8 py-5 border-l border-brand-primary/8 text-center">
                                 <span className="text-token-caption font-black text-brand-primary opacity-40">{studentGrades.grade || "-"}</span>
                              </td>
                           </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>

             {/* Footer Stats / Legend */}
             <div className="flex items-center justify-between pt-4 border-t border-brand-primary/8 text-token-micro font-black uppercase tracking-widest text-brand-tertiary">
                <div className="flex gap-8">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded bg-brand-tertiary" /> Corrective Entry
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded bg-brand-accent" /> Audit Required
                   </div>
                </div>
                <div>Showing {filteredStudents.length} Students in {activeSubject.class.name}</div>
             </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

