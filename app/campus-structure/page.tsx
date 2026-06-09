"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Building2, 
  Users, 
  BookOpen, 
  RefreshCcw,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { toast } from "sonner";

export default function CampusStructurePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ARMS" | "SUBJECTS">("ARMS");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data
  const [classes, setClasses] = useState<any[]>([]);
  const [arms, setArms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Form states - ARMS
  const [armForm, setArmForm] = useState({ classId: "", label: "", teacherId: "" });
  const [isSubmittingArm, setIsSubmittingArm] = useState(false);

  // Form states - SUBJECTS
  const [subjectForm, setSubjectForm] = useState({ name: "", classId: "", teacherId: "" });
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);

  // Form states - REASSIGN
  const [assignForm, setAssignForm] = useState({ id: "", teacherId: "" });
  const [isAssigningSubject, setIsAssigningSubject] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      // Fetch classes for user's campus
      const campusQuery = user?.campus ? `?campus=${user.campus}` : "";
      
      const [clsRes, armsRes, subRes, teachersRes] = await Promise.all([
        fetch(`/api/structure/classes${campusQuery}`),
        fetch(`/api/structure/arms`),
        fetch(`/api/structure/subjects`),
        fetch(`/api/users?role=TEACHER,FORM_TEACHER,HEAD_TEACHER,PRINCIPAL,HOD,DEAN`)
      ]);

      if (clsRes.ok) {
        const data = await clsRes.json();
        setClasses(data);
      }
      if (armsRes.ok) {
        const data = await armsRes.json();
        // Filter arms to only show those belonging to user's campus classes
        if (user?.campus) {
          setArms(data.filter((a: any) => a.class?.campus === user.campus));
        } else {
          setArms(data);
        }
      }
      if (subRes.ok) {
        const data = await subRes.json();
        if (user?.campus) {
          setSubjects(data.subjects?.filter((s: any) => s.class?.campus === user.campus || s.campus === user.campus) || []);
        } else {
          setSubjects(data.subjects || []);
        }
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        if (user?.campus) {
          setTeachers(data.users?.filter((t: any) => t.campus === user.campus) || []);
        } else {
          setTeachers(data.users || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreateArm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!armForm.classId || !armForm.label) return toast.error("Class and label are required");
    
    setIsSubmittingArm(true);
    try {
      const res = await fetch("/api/structure/arms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: armForm.classId,
          label: armForm.label,
          teacherId: armForm.teacherId || null
        })
      });

      if (res.ok) {
        toast.success("Arm created successfully");
        setArmForm({ classId: "", label: "", teacherId: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create arm");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmittingArm(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.classId || !subjectForm.teacherId) {
      return toast.error("Name, class, and teacher are required");
    }
    
    setIsSubmittingSubject(true);
    try {
      const res = await fetch(`/api/structure/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: subjectForm.name,
          classId: subjectForm.classId,
          teacherId: subjectForm.teacherId 
        })
      });

      if (res.ok) {
        toast.success("Subject created successfully");
        setSubjectForm({ name: "", classId: "", teacherId: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create subject");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.id || !assignForm.teacherId) return toast.error("Subject and teacher are required");
    
    setIsAssigningSubject(true);
    try {
      const res = await fetch(`/api/structure/subjects/${assignForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: assignForm.teacherId })
      });

      if (res.ok) {
        toast.success("Teacher assigned successfully");
        setAssignForm({ id: "", teacherId: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to assign teacher");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsAssigningSubject(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header matching the video */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-blush/30 p-6 rounded-2xl border border-brand-primary/10">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary uppercase tracking-tight flex items-center gap-3">
              <Building2 className="text-brand-tertiary" size={28} />
              School Structure
            </h1>
            <p className="text-brand-tertiary text-xs font-bold mt-1 tracking-widest uppercase">
              Manage Class Arms and Subject Assignments
            </p>
          </div>
          <button 
            onClick={() => fetchData(true)}
            className="bg-white border border-brand-primary/10 text-brand-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-black/5 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-xl shadow-brand-primary/5 border border-brand-primary/10 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-brand-primary/10">
            <button 
              onClick={() => setActiveTab("ARMS")}
              className={`flex items-center gap-2 px-8 py-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "ARMS" ? "bg-brand-primary text-white" : "text-brand-primary hover:bg-brand-blush/50"}`}
            >
              <Users size={16} />
              Class Arms
            </button>
            <button 
              onClick={() => setActiveTab("SUBJECTS")}
              className={`flex items-center gap-2 px-8 py-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "SUBJECTS" ? "bg-brand-primary text-white" : "text-brand-primary hover:bg-brand-blush/50"}`}
            >
              <BookOpen size={16} />
              Subjects
            </button>
          </div>

          <div className="p-0">
            {activeTab === "ARMS" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-brand-primary/10">
                {/* Add Arm Form */}
                <div className="p-6 bg-brand-blush/10">
                  <h3 className="flex items-center gap-2 text-token-micro font-black text-brand-primary uppercase tracking-widest mb-6">
                    <Plus size={14} /> Add Arm
                  </h3>
                  <form onSubmit={handleCreateArm} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Class</label>
                      <select 
                        required
                        value={armForm.classId}
                        onChange={e => setArmForm({...armForm, classId: e.target.value})}
                        className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                      >
                        <option value="">Select Class...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.category || 'N/A'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Arm Label</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. A, B, Gold, etc."
                        value={armForm.label}
                        onChange={e => setArmForm({...armForm, label: e.target.value})}
                        className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors placeholder:font-normal placeholder:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">
                        Form Teacher <span className="opacity-50 lowercase">(optional)</span>
                      </label>
                      <select 
                        value={armForm.teacherId}
                        onChange={e => setArmForm({...armForm, teacherId: e.target.value})}
                        className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                      >
                        <option value="">Assign later</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmittingArm}
                      className="w-full mt-4 bg-brand-primary text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {isSubmittingArm ? (
                        <><Loader2 size={14} className="animate-spin" /> CREATING...</>
                      ) : (
                        "CREATE ARM"
                      )}
                    </button>
                  </form>
                </div>

                {/* Arms List */}
                <div className="lg:col-span-3">
                  <div className="p-6 border-b border-brand-primary/10 flex justify-between items-center bg-white">
                    <h3 className="text-token-micro font-black text-brand-primary uppercase tracking-widest">
                      Class Arms — {arms.length} Records
                    </h3>
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">All Classes</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-blush/20">
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Full Name</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Class</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Campus</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Form Teacher</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10 text-center">Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-primary/5">
                        {arms.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-brand-primary/40">
                              No arms found for your campus. Create one to get started.
                            </td>
                          </tr>
                        ) : arms.map(arm => (
                          <tr key={arm.id} className="hover:bg-brand-blush/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-black text-brand-primary text-sm">{arm.fullName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-tertiary text-xs uppercase tracking-wider">{arm.class?.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-primary/60 text-xs uppercase tracking-wider">{arm.class?.campus}</span>
                            </td>
                            <td className="px-6 py-4">
                              {arm.teacher ? (
                                <span className="font-bold text-brand-primary text-sm">{arm.teacher.name}</span>
                              ) : (
                                <span className="font-bold text-brand-tertiary/60 text-sm italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center justify-center bg-black text-white rounded-full w-8 h-6 text-xs font-black">
                                {arm._count?.students || 0}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "SUBJECTS" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-brand-primary/10">
                {/* Forms Column */}
                <div className="flex flex-col bg-brand-blush/10 divide-y divide-brand-primary/10">
                  {/* Add Subject Form */}
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-token-micro font-black text-brand-primary uppercase tracking-widest mb-6">
                      <Plus size={14} /> Add Subjects
                    </h3>
                    <form onSubmit={handleCreateSubject} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Subject Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="e.g. Further Mathematics"
                          value={subjectForm.name}
                          onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                          className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors placeholder:font-normal placeholder:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Target Class</label>
                        <select 
                          required
                          value={subjectForm.classId}
                          onChange={e => setSubjectForm({...subjectForm, classId: e.target.value})}
                          className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                        >
                          <option value="">Select Class...</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.category || 'N/A'})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Assign Teacher</label>
                        <select 
                          required
                          value={subjectForm.teacherId}
                          onChange={e => setSubjectForm({...subjectForm, teacherId: e.target.value})}
                          className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                        >
                          <option value="">Select Teacher...</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmittingSubject}
                        className="w-full mt-4 bg-brand-primary text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                      >
                        {isSubmittingSubject ? (
                          <><Loader2 size={14} className="animate-spin" /> SAVING...</>
                        ) : (
                          "SAVE & ASSIGN"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Assign Subject Form */}
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-token-micro font-black text-brand-primary uppercase tracking-widest mb-6">
                      <CheckCircle2 size={14} /> Reassign Teacher
                    </h3>
                    <form onSubmit={handleAssignSubject} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Subject</label>
                        <select 
                          required
                          value={assignForm.id}
                          onChange={e => setAssignForm({...assignForm, id: e.target.value})}
                          className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                        >
                          <option value="">Select Subject...</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.class?.name || "Global"})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1">Teacher</label>
                        <select 
                          required
                          value={assignForm.teacherId}
                          onChange={e => setAssignForm({...assignForm, teacherId: e.target.value})}
                          className="w-full bg-white border border-brand-primary/20 rounded-lg px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-tertiary transition-colors"
                        >
                          <option value="">Select Teacher...</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isAssigningSubject}
                        className="w-full mt-4 bg-brand-primary text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                      >
                        {isAssigningSubject ? (
                          <><Loader2 size={14} className="animate-spin" /> REASSIGNING...</>
                        ) : (
                          "REASSIGN TEACHER"
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Subjects List */}
                <div className="lg:col-span-3">
                  <div className="p-6 border-b border-brand-primary/10 flex justify-between items-center bg-white">
                    <h3 className="text-token-micro font-black text-brand-primary uppercase tracking-widest">
                      Subjects — {subjects.length} Records
                    </h3>
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">Your Campus</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-blush/20">
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Subject Name</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Class</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Campus</th>
                          <th className="px-6 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest border-b border-brand-primary/10">Assigned Teacher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-primary/5">
                        {subjects.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-brand-primary/40">
                              No subjects found for your campus.
                            </td>
                          </tr>
                        ) : subjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-brand-blush/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-black text-brand-primary text-sm">{sub.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-tertiary text-xs uppercase tracking-wider">{sub.class?.name || "Global"}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-brand-primary/60 text-xs uppercase tracking-wider">{sub.class?.campus || sub.campus}</span>
                            </td>
                            <td className="px-6 py-4">
                              {sub.teacher ? (
                                <span className="font-bold text-brand-primary text-sm flex items-center gap-2">
                                  {sub.teacher.name}
                                </span>
                              ) : (
                                <span className="font-bold text-brand-tertiary/60 text-sm flex items-center gap-2 italic">
                                  <AlertCircle size={14} className="text-brand-tertiary" /> Unassigned
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
