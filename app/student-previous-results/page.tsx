
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  History, 
  Search, 
  ChevronRight, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  Layers,
  Download,
  AlertCircle
} from "lucide-react";

export default function StudentPreviousResultsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/structure/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          if (data.length > 0 && !selectedSession) {
            setSelectedSession(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    }

    async function fetchGrades() {
      if (!selectedSession) return;
      try {
        const response = await fetch(`/api/grades?sessionId=${selectedSession}`);
        if (response.ok) {
          const data = await response.json();
          setGrades(data.grades || []);
        }
      } catch (err) {
        console.error("Result Archive Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (sessions.length === 0) fetchSessions();
    if (selectedSession) fetchGrades();
  }, [selectedSession, sessions.length]);

  // Group grades by term for display
  const terms = Array.from(new Set(grades.map(g => g.term?.name))).sort();

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight flex items-center gap-3">
              <History className="text-brand-tertiary" size={28} />
              Academic Performance Archive
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Longitudinal tracking of academic progress across historical sessions.
            </p>
          </div>
          <button className="bg-brand-forest text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-forest/10 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <Download size={16} />
            Institutional Transcript
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar Filter */}
           <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="card flex flex-col gap-6">
                 <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-brand-tertiary" />
                    <h4 className="font-black text-token-micro text-brand-primary uppercase tracking-[0.15em]">Select Session</h4>
                 </div>
                 <div className="flex flex-col gap-2">
                    {sessions.map(s => (
                       <button 
                          key={s.id}
                          onClick={() => setSelectedSession(s.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSession === s.id ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-brand-blush border-brand-primary/8 text-brand-tertiary hover:bg-white'}`}
                       >
                          <p className="text-token-micro font-black uppercase tracking-widest">{s.name}</p>
                          <p className={`text-xs font-bold mt-1 ${selectedSession === s.id ? 'text-brand-tertiary' : 'text-brand-primary'}`}>{s.year}</p>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="card bg-brand-tertiary/5 border-brand-tertiary/10 p-6">
                 <div className="flex items-start gap-4">
                    <AlertCircle size={20} className="text-brand-tertiary mt-1" />
                    <div>
                       <h4 className="font-black text-xs text-brand-primary uppercase tracking-tight mb-2">Transcript Notice</h4>
                       <p className="text-token-micro font-bold text-brand-primary/60 leading-relaxed">
                          Only verified results are displayed in the archive. For corrections, please contact the VP Academics office.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Results Board */}
           <div className="lg:col-span-3 flex flex-col gap-8">
              {loading ? (
                 <div className="h-96 card animate-pulse" />
              ) : grades.length === 0 ? (
                 <div className="h-96 card border-dashed flex flex-col items-center justify-center text-center opacity-60">
                    <Layers size={48} className="text-brand-tertiary mb-4" />
                    <h4 className="font-black text-brand-primary">No Archives Found</h4>
                    <p className="text-xs text-brand-tertiary max-w-xs mt-1">We couldn't find any verified results for the selected session.</p>
                 </div>
              ) : (
                terms.map(termName => {
                   const termGrades = grades.filter(g => g.term?.name === termName);
                   const avg = Math.round(termGrades.reduce((sum, g) => sum + g.total, 0) / termGrades.length);

                   return (
                     <div key={termName as string} className="card p-0 overflow-hidden">
                        <div className="p-6 border-b border-brand-primary/8 bg-brand-blush flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <BookOpen size={16} className="text-brand-tertiary" />
                              <h4 className="font-black text-brand-primary uppercase tracking-widest text-token-micro">{termName as string} Term Performance</h4>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-token-micro font-black text-brand-tertiary uppercase">Term Avg:</span>
                              <span className="text-sm font-black text-brand-forest">{avg}%</span>
                           </div>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                <tr className="bg-white/50 text-token-micro font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/8">
                                   <th className="px-6 py-4">Subject</th>
                                   <th className="px-6 py-4">CA Total</th>
                                   <th className="px-6 py-4">Exam</th>
                                   <th className="px-6 py-4">Total</th>
                                   <th className="px-6 py-4 text-center">Grade</th>
                                   <th className="px-6 py-4 text-right">Review</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/5">
                                 {termGrades.map(g => (
                                   <tr key={g.id} className="group hover:bg-brand-blush/50 transition-colors">
                                      <td className="px-6 py-4">
                                         <p className="text-xs font-black text-brand-primary uppercase tracking-wide">{g.subject.name}</p>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-bold text-brand-tertiary">
                                         {g.firstCA + g.secondCA + g.thirdCA}
                                      </td>
                                      <td className="px-6 py-4 text-xs font-bold text-brand-tertiary">
                                         {g.exam}
                                      </td>
                                      <td className="px-6 py-4">
                                         <span className="text-xs font-black text-brand-primary">{g.total}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                         <span className={`inline-flex px-2 py-0.5 rounded text-token-micro font-black ${g.total >= 70 ? 'bg-brand-forest/10 text-brand-forest' : 'bg-brand-accent/10 text-brand-accent'}`}>
                                            {g.grade || "C"}
                                         </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button className="w-8 h-8 rounded-lg bg-brand-blush grid place-items-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-sm border border-brand-primary/8">
                                             <ChevronRight size={14} className="text-brand-primary" />
                                          </button>
                                      </td>
                                   </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   );
                })
              )}
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

