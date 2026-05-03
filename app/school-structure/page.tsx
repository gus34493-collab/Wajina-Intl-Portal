
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  Building2, 
  Users, 
  BookOpen, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Layers, 
  History,
  ShieldCheck,
  Search,
  ExternalLink
} from "lucide-react";

export default function SchoolStructurePage() {
  const [activeSegment, setActiveSegment] = useState("CAMPUSES");

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Structure Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-brand-primary tracking-tight flex items-center gap-3">
              <Building2 className="text-brand-tertiary" size={28} />
              Wajina Institutional Structure
            </h1>
            <p className="text-brand-primary/60 text-sm font-medium mt-1">
              Cluster-wide management of campuses, departments, and academic arms.
            </p>
          </div>
          <button className="bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-brand-primary/10 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <Plus size={16} />
            Authorize New Entity
          </button>
        </div>

        {/* Global Topology Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StructureKPI label="Total Campuses" value="2" sub="Verified Clusters" icon={<MapPin size={16}/>} />
           <StructureKPI label="Departments" value="12" sub="Institutional Units" icon={<Layers size={16}/>} />
           <StructureKPI label="Class Arms" value="48" sub="Learning Pods" icon={<Users size={16}/>} />
           <StructureKPI label="System State" value="FINAL" sub="Academic 2025/26" icon={<ShieldCheck size={16} className="text-brand-forest"/>} />
        </div>

        {/* Hierarchical Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Segment Navigation */}
           <div className="lg:col-span-1 card p-2 flex flex-col gap-1 bg-white/50 border-brand-primary/8">
              <SegmentTab label="Campuses" active={activeSegment === "CAMPUSES"} onClick={() => setActiveSegment("CAMPUSES")} icon={<MapPin size={14}/>} />
              <SegmentTab label="Departments" active={activeSegment === "DEPARTMENTS"} onClick={() => setActiveSegment("DEPARTMENTS")} icon={<Layers size={14}/>} />
              <SegmentTab label="Class Hierarchy" active={activeSegment === "CLASSES"} onClick={() => setActiveSegment("CLASSES")} icon={<BookOpen size={14}/>} />
              <div className="mt-8 px-4 py-6 border-t border-brand-primary/8">
                 <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-[0.2em] mb-4">Meta Data Hub</p>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 bg-brand-forest rounded-full" />
                       <span className="text-token-micro font-bold text-brand-primary uppercase">Primary Wing A</span>
                    </div>
                    <div className="flex items-center gap-3 text-brand-tertiary">
                       <div className="w-1.5 h-1.5 bg-brand-tertiary/30 rounded-full" />
                       <span className="text-token-micro font-bold uppercase">Secondary Phase 1</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Registry View */}
           <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="card p-0 overflow-hidden border-2 border-brand-tertiary/5 shadow-xl">
                 <div className="p-6 border-b border-brand-primary/8 flex items-center justify-between bg-brand-blush/30">
                    <h4 className="font-black text-brand-primary uppercase text-token-micro tracking-widest">{activeSegment} Registry</h4>
                    <div className="relative w-48">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-tertiary" size={12} />
                       <input type="text" placeholder="Quick search..." className="w-full bg-white border border-brand-primary/8 rounded-lg pl-8 pr-3 py-1.5 text-token-micro font-bold focus:outline-none" />
                    </div>
                 </div>

                 {activeSegment === "CAMPUSES" && (
                    <div className="divide-y divide-black/[0.03]">
                       <CampusItem name="Primary Campus Cluster" lead="Mr. Adeyemi O. (Head Teacher)" population="285" status="ACTIVE" />
                       <CampusItem name="Secondary Campus Phase" lead="Dr. Ibrahim K. (Principal)" population="197" status="ACTIVE" />
                    </div>
                 )}

                 {activeSegment === "DEPARTMENTS" && (
                    <div className="divide-y divide-black/[0.03]">
                       <DeptItem name="Science & Tech (STEM)" lead="HOD Physics" subjects={8} />
                       <DeptItem name="Humanities & Arts" lead="HOD English" subjects={6} />
                       <DeptItem name="Vocational Studies" lead="HOD Commerce" subjects={4} />
                    </div>
                 )}

                 <div className="p-4 bg-brand-blush/30 text-center">
                    <button className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary hover:underline flex items-center gap-2 mx-auto">
                       Load Full Dimensional Audit <History size={12}/>
                    </button>
                 </div>
              </div>

              {/* Actionable alerts for the Director */}
              <div className="card bg-brand-primary text-white p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-12 translate-y-[-12px]">
                    <Layers size={140} />
                 </div>
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck size={20} className="text-brand-tertiary" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Architectural Policy Alert</h4>
                 </div>
                 <p className="max-w-md text-xs font-medium leading-relaxed opacity-80">
                    The institutional structure for the 2025/26 session was finalized on Dec 12th. Any structural changes (adding campuses or departments) now require an encrypted override key.
                 </p>
                 <div className="mt-8 flex gap-4">
                    <button className="px-6 py-3 bg-brand-tertiary rounded-xl text-token-micro font-black uppercase tracking-widest shadow-lg shadow-brand-tertiary/20">
                       Request Override
                    </button>
                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-token-micro font-black uppercase tracking-widest">
                       Policy Documentation
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StructureKPI({ label, value, sub, icon }: any) {
   return (
      <div className="card bg-white border border-brand-primary/8 p-5 rounded-2xl flex items-center justify-between shadow-sm">
         <div>
            <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-display font-black text-brand-primary mt-1">{value}</p>
            <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-wide">{sub}</p>
         </div>
         <div className="text-brand-tertiary opacity-30">{icon}</div>
      </div>
   );
}

function SegmentTab({ label, active, onClick, icon }: any) {
   return (
      <button 
         onClick={onClick}
         className={`flex items-center justify-between p-4 rounded-xl transition-all ${active ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-tertiary hover:bg-black/5'}`}
      >
         <div className="flex items-center gap-3">
            {icon}
            <span className="text-token-micro font-black uppercase tracking-widest">{label}</span>
         </div>
         {active && <ChevronRight size={14} />}
      </button>
   );
}

function CampusItem({ name, lead, population, status }: any) {
   return (
      <div className="p-6 flex items-center justify-between group hover:bg-brand-blush transition-all cursor-pointer">
         <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-tertiary/5 grid place-items-center text-brand-tertiary">
               <MapPin size={20} />
            </div>
            <div>
               <h4 className="font-black text-brand-primary uppercase tracking-tight">{name}</h4>
               <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-wider mt-0.5">{lead}</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-lg font-display font-black text-brand-primary">{population}</p>
            <span className="text-token-micro font-black text-brand-forest uppercase tracking-[0.2em]">{status}</span>
         </div>
      </div>
   );
}

function DeptItem({ name, lead, subjects }: any) {
   return (
      <div className="p-6 flex items-center justify-between group hover:bg-brand-blush transition-all cursor-pointer">
         <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-blush grid place-items-center text-brand-primary">
               <Layers size={20} />
            </div>
            <div>
               <h4 className="text-sm font-black text-brand-primary">{name}</h4>
               <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-wider mt-0.5">{lead}</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="text-right">
               <p className="text-sm font-black text-brand-primary">{subjects} Subjects</p>
               <p className="text-token-micro font-black text-brand-tertiary uppercase">Verified</p>
            </div>
            <ExternalLink size={14} className="text-brand-tertiary opacity-20 group-hover:opacity-60 transition-all" />
         </div>
      </div>
   );
}

