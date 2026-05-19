"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { useAuth } from "@/app/components/AuthContext";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Eye,
  BookOpen,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function TeacherSubmissionsReview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const campusParam = user?.role !== "DIRECTOR" ? user?.campus : null;
        const response = await fetch(`/api/requests${campusParam ? `?campus=${campusParam}` : ""}`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Academic Review Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [user]);

  const filteredRequests = filter === "ALL" 
    ? requests 
    : requests.filter(r => r.category === filter);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight">
              Academic Submission Command
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Quality assurance of lesson plans, exam questions, and curriculum deployment.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertCircle size={14} className="text-brand-accent" />
                <span className="text-token-micro font-black text-brand-accent uppercase tracking-widest">{pendingCount} Pending Review</span>
             </div>
          </div>
        </div>

        {/* Global Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatMetric label="Lesson Plans" count={requests.filter(r => r.category === 'LESSON_PLAN').length} icon={<BookOpen size={16}/>} />
           <StatMetric label="Exam Questions" count={requests.filter(r => r.category === 'EXAM_QUESTIONS').length} icon={<FileText size={16}/>} />
           <StatMetric label="Result Sheets" count={requests.filter(r => r.category === 'RESULT_SHEET').length} icon={<CheckCircle size={16}/>} />
           <StatMetric label="Approved Today" count={0} icon={<CheckCircle size={16} className="text-brand-forest"/>} />
        </div>

        {/* Filtration & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 border border-brand-primary/5 p-2 rounded-2xl">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-2">
            <FilterTab active={filter === "ALL"} onClick={() => setFilter("ALL")} label="All Submissions" />
            <FilterTab active={filter === "LESSON_PLAN"} onClick={() => setFilter("LESSON_PLAN")} label="Lesson Plans" />
            <FilterTab active={filter === "EXAM_QUESTIONS"} onClick={() => setFilter("EXAM_QUESTIONS")} label="Exam Questions" />
            <FilterTab active={filter === "RESULT_SHEET"} onClick={() => setFilter("RESULT_SHEET")} label="Result Sheets" />
          </div>
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={14} />
            <input 
              type="text" 
              placeholder="Search by teacher name..." 
              className="w-full bg-white border border-brand-primary/8 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-tertiary/20"
            />
          </div>
        </div>

        {/* Submissions Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-44 card animate-pulse" />)
          ) : filteredRequests.length === 0 ? (
            <div className="col-span-full h-64 card border-dashed flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-full bg-brand-blush grid place-items-center mb-4">
                  <Clock size={24} className="text-brand-tertiary opacity-30" />
               </div>
               <h4 className="font-black text-brand-primary">No Submissions Found</h4>
               <p className="text-xs text-brand-tertiary mt-1">Teachers in your campus have not uploaded any records for this category.</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <SubmissionCard key={req.id} request={req} />
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StatMetric({ label, count, icon }: any) {
  return (
    <div className="bg-white border border-brand-primary/8 rounded-2xl p-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
        <p className="text-xl font-display font-black text-brand-primary mt-0.5">{count}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center text-brand-tertiary">
        {icon}
      </div>
    </div>
  );
}

function FilterTab({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-token-micro font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/10' : 'text-brand-tertiary hover:bg-black/5'}`}
    >
      {label}
    </button>
  );
}

function SubmissionCard({ request }: any) {
  const isPending = request.status === "PENDING";
  
  return (
    <div className="card group hover:border-brand-tertiary/30 transition-all flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${request.category === 'LESSON_PLAN' ? 'bg-brand-tertiary/5 text-brand-tertiary' : 'bg-brand-accent/5 text-brand-accent'}`}>
            {request.category === 'LESSON_PLAN' ? <BookOpen size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h4 className="font-black text-brand-primary tracking-tight">{request.title || "Academic Submission"}</h4>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-token-micro font-bold text-brand-tertiary uppercase">{request.sender?.name || "Staff"}</span>
               <span className="text-token-micro opacity-30 text-brand-primary">•</span>
               <span className="text-token-micro font-black text-brand-tertiary uppercase">{request.sender?.campus} Campus</span>
            </div>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-token-micro font-black tracking-[0.1em] uppercase ${isPending ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-forest/10 text-brand-forest'}`}>
           {request.status}
        </div>
      </div>

      <div className="flex-1 bg-brand-blush/50 rounded-2xl p-4 border border-brand-primary/5">
        <p className="text-xs text-brand-primary/60 leading-relaxed line-clamp-2">
          {request.description || "No additional description provided by the staff member."}
        </p>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-brand-primary/5">
           <div className="flex items-center gap-2">
              <Calendar size={12} className="text-brand-tertiary" />
              <span className="text-token-micro font-bold text-brand-tertiary uppercase">Sub: {new Date(request.createdAt).toLocaleDateString()}</span>
           </div>
           <div className="flex items-center gap-2">
              <Clock size={12} className="text-brand-tertiary" />
              <span className="text-token-micro font-bold text-brand-tertiary uppercase">Due: Week 8 Audit</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
         <button className="flex-1 bg-white border border-brand-primary/10 hover:border-brand-tertiary/30 py-3 rounded-xl flex items-center justify-center gap-2 text-token-micro font-black text-brand-primary uppercase tracking-widest transition-all">
            <Eye size={14} className="text-brand-tertiary" />
            View Document
         </button>
         {isPending && (
           <>
            <button className="w-12 h-12 rounded-xl bg-brand-forest/10 text-brand-forest hover:bg-brand-forest hover:text-white transition-all grid place-items-center">
                <CheckCircle size={18} />
            </button>
            <button className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all grid place-items-center">
                <XCircle size={18} />
            </button>
           </>
         )}
      </div>
    </div>
  );
}

