"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { BookOpen, Search, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SubjectAllocationPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [subjectName, setSubjectName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsRes, staffRes, subRes] = await Promise.all([
        fetch("/api/structure/classes"),
        fetch("/api/hr/staff"),
        fetch("/api/structure/subjects")
      ]);
      
      if (clsRes.ok) setClasses(await clsRes.json());
      if (staffRes.ok) setStaff((await staffRes.json()).staff || []);
      if (subRes.ok) setSubjects((await subRes.json()).subjects || []);
    } catch (err) {
      toast.error("Failed to load requisite data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !selectedClass || !selectedTeacher) {
      toast.error("Please fill all fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/structure/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subjectName,
          classId: selectedClass,
          teacherId: selectedTeacher
        })
      });
      if (res.ok) {
        toast.success("Subject created and assigned successfully!");
        setSubjectName("");
        setSelectedClass("");
        setSelectedTeacher("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to assign subject");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight flex items-center gap-3">
              <BookOpen className="text-brand-tertiary" size={28} />
              Subject Allocation System
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Dynamically add custom subjects and allocate teaching staff per class.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAssign} className="card flex flex-col gap-6">
              <h4 className="font-black text-token-micro uppercase text-brand-primary tracking-widest border-b border-brand-primary/8 pb-4">
                Add Custom Subject
              </h4>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-brand-primary/60 tracking-wider">Subject Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Further Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 bg-brand-blush text-sm font-medium focus:outline-none focus:border-brand-tertiary"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-brand-primary/60 tracking-wider">Target Class</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 bg-brand-blush text-sm font-medium focus:outline-none focus:border-brand-tertiary"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.campus})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-brand-primary/60 tracking-wider">Assign Teacher</label>
                <select 
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full border border-brand-primary/10 rounded-xl px-4 py-3 bg-brand-blush text-sm font-medium focus:outline-none focus:border-brand-tertiary"
                  required
                >
                  <option value="">-- Select Staff Member --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Processing..." : <><Plus size={16} /> Save & Assign</>}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
             <div className="p-6 border-b border-brand-primary/8 bg-brand-blush/30 flex items-center justify-between">
                <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">Active Allocations</h4>
                <div className="relative w-48">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={12} />
                   <input type="text" placeholder="Search subjects..." className="w-full bg-white border border-brand-primary/8 rounded-lg pl-8 pr-3 py-1.5 text-token-micro font-bold focus:outline-none" />
                </div>
             </div>
             
             {loading ? (
               <div className="p-10 flex justify-center text-brand-tertiary text-sm">Loading curriculum...</div>
             ) : subjects.length === 0 ? (
               <div className="p-20 text-center flex flex-col items-center opacity-60">
                 <BookOpen size={48} className="text-brand-tertiary mb-4" />
                 <h4 className="font-black text-brand-primary">No Subjects Found</h4>
                 <p className="text-xs text-brand-tertiary">Use the form to create your first custom subject allocation.</p>
               </div>
             ) : (
               <div className="divide-y divide-black/5 max-h-[600px] overflow-y-auto">
                 {subjects.map(sub => (
                   <div key={sub.id} className="p-6 flex items-center justify-between group hover:bg-brand-blush/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-brand-primary tracking-tight">{sub.name}</span>
                        <span className="text-token-micro font-bold text-brand-tertiary uppercase mt-1">
                          Class: {sub.class?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right flex flex-col items-end">
                          <span className="text-xs font-bold text-brand-primary/80">{sub.teacher?.name || 'No Teacher'}</span>
                          <span className="flex items-center gap-1 text-token-micro font-black text-brand-forest uppercase mt-1">
                            <CheckCircle2 size={10} /> Allocated
                          </span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
