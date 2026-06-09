"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { Eye, Search, CheckCircle2, FileCheck, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAcademic } from "@/app/components/AcademicContext";

export default function ResultsPreviewPage() {
  const { activeSession, activeTerm } = useAcademic();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchStudentsWithGrades = async () => {
    if (!activeTerm || !activeSession) return;
    setLoading(true);
    try {
      // For a real app, this should fetch students and their grades grouped.
      // We will fetch grades for the term and group by student.
      const res = await fetch(`/api/grades?termId=${activeTerm.id}&sessionId=${activeSession.id}&status=FORM_APPROVED`);
      if (res.ok) {
        const data = await res.json();
        const grouped = data.grades.reduce((acc: any, grade: any) => {
          const sid = grade.student.id;
          if (!acc[sid]) {
            acc[sid] = {
              student: grade.student,
              grades: [],
              totalScore: 0,
            };
          }
          acc[sid].grades.push(grade);
          acc[sid].totalScore += grade.total || 0;
          return acc;
        }, {});
        
        setStudents(Object.values(grouped));
      }
    } catch (err) {
      toast.error("Failed to load results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsWithGrades();
  }, [activeTerm, activeSession]);

  const handlePublishAll = async () => {
    if (students.length === 0) {
      toast.error("No results to publish.");
      return;
    }
    if (!confirm("Are you sure you want to publish these results? They will become visible to parents.")) return;

    setIsPublishing(true);
    try {
      const res = await fetch("/api/report-cards/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId: activeTerm?.id, sessionId: activeSession?.id })
      });
      if (res.ok) {
        toast.success("Results published successfully!");
        setStudents([]);
        setSelectedStudent(null);
      } else {
        toast.error("Failed to publish results.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight flex items-center gap-3">
              <Eye className="text-brand-tertiary" size={28} />
              Results Preview & Publish
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Review how report cards will appear to parents before final publication.
            </p>
          </div>
          <button 
            onClick={handlePublishAll}
            disabled={isPublishing || students.length === 0}
            className="bg-brand-secondary text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-secondary/20 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isPublishing ? "Publishing..." : <><Send size={16} /> Publish All Results</>}
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center text-brand-tertiary">Loading previews...</div>
        ) : students.length === 0 ? (
           <div className="p-20 card text-center flex flex-col items-center opacity-60">
             <FileCheck size={48} className="text-brand-tertiary mb-4" />
             <h4 className="font-black text-brand-primary">No Pending Results</h4>
             <p className="text-xs text-brand-tertiary">All approved grades have already been published or none are awaiting your review.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student List */}
            <div className="lg:col-span-1 card p-0 overflow-hidden flex flex-col max-h-[700px]">
              <div className="p-4 border-b border-brand-primary/10 bg-brand-blush/30">
                <div className="relative w-full">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={14} />
                   <input type="text" placeholder="Search students..." className="w-full bg-white border border-brand-primary/8 rounded-lg pl-9 pr-3 py-2 text-sm font-bold focus:outline-none focus:border-brand-tertiary transition-colors" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-black/5">
                {students.map(s => (
                  <button 
                    key={s.student.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left p-4 flex items-center justify-between group transition-colors ${selectedStudent?.student.id === s.student.id ? 'bg-brand-primary text-white' : 'hover:bg-brand-blush text-brand-primary'}`}
                  >
                    <div>
                      <h4 className="font-black text-sm tracking-tight">{s.student.name}</h4>
                      <p className={`text-xs font-bold mt-1 ${selectedStudent?.student.id === s.student.id ? 'text-brand-secondary' : 'text-brand-tertiary'}`}>
                        {s.grades.length} Subjects
                      </p>
                    </div>
                    <ChevronRight size={16} className={selectedStudent?.student.id === s.student.id ? 'text-white' : 'text-brand-primary/20 group-hover:text-brand-primary/40'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              {selectedStudent ? (
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-primary/5 p-8 relative overflow-hidden">
                   {/* Watermark */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] font-black text-brand-primary/[0.02] -rotate-12 pointer-events-none select-none uppercase tracking-widest">
                     PREVIEW
                   </div>
                   
                   <div className="flex flex-col items-center mb-8 border-b border-brand-primary/10 pb-8 relative z-10">
                     <img src="/images/logo-no-bg.png" alt="Logo" className="w-16 h-16 mb-4" />
                     <h2 className="text-xl font-black text-brand-primary uppercase tracking-[0.2em] text-center">Wajina International Schools</h2>
                     <h3 className="text-sm font-bold text-brand-tertiary uppercase tracking-widest mt-2 text-center">Termly Academic Report Card</h3>
                     <div className="flex items-center gap-4 mt-6 text-xs font-bold text-brand-primary/80 bg-brand-blush/50 px-6 py-2 rounded-full border border-brand-primary/10">
                       <span>Student: <strong className="text-brand-primary">{selectedStudent.student.name}</strong></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-brand-tertiary/30" />
                       <span>Term: <strong className="text-brand-primary">{activeTerm?.name}</strong></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-brand-tertiary/30" />
                       <span>Session: <strong className="text-brand-primary">{activeSession?.name}</strong></span>
                     </div>
                   </div>

                   <table className="w-full text-left relative z-10 border-collapse">
                     <thead>
                       <tr className="border-b-2 border-brand-primary text-token-micro uppercase text-brand-primary font-black tracking-widest">
                         <th className="py-3 px-2">Subject</th>
                         <th className="py-3 px-2 text-center w-20">CA</th>
                         <th className="py-3 px-2 text-center w-20">Exam</th>
                         <th className="py-3 px-2 text-center w-20">Total</th>
                         <th className="py-3 px-2 text-center w-20">Grade</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-brand-primary/5">
                       {selectedStudent.grades.map((grade: any) => (
                         <tr key={grade.id} className="text-sm font-bold text-brand-primary/80 hover:bg-brand-blush/20">
                           <td className="py-4 px-2">{grade.subject?.name}</td>
                           <td className="py-4 px-2 text-center">{(grade.firstCA || 0) + (grade.secondCA || 0)}</td>
                           <td className="py-4 px-2 text-center">{grade.exam || 0}</td>
                           <td className="py-4 px-2 text-center font-black text-brand-primary">{grade.total || 0}</td>
                           <td className="py-4 px-2 text-center">
                             <span className="bg-brand-primary/5 px-2 py-1 rounded text-brand-primary">{grade.grade || '-'}</span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-brand-primary/10 rounded-2xl flex flex-col items-center justify-center text-brand-primary/40 bg-brand-blush/10">
                  <Eye size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-sm uppercase tracking-widest">Select a student to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

// ChevronRight icon component
function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
