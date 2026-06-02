
"use client";

import { useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { 
  UserPlus, 
  Mail, 
  Briefcase, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/components/AuthContext";

export default function StaffOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  //  Fixed Lines
const { user } = useAuth();
const userRole = user?.role;
const userCampus = user?.campus;
  const isGlobalRole = ["DIRECTOR", "HR", "VP_ADMIN"].includes(userRole as string);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "TEACHER",
    campus: isGlobalRole ? "PRIMARY" : (userCampus || "PRIMARY"),
    department: ""
  });
  const [provisionedUser, setProvisionedUser] = useState<any>(null);

  const handleNext = () => setStep(s => s + 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Onboarding failed");
      }

      const data = await response.json();
      setProvisionedUser(data);
      setStep(4); // Success step
      toast.success("Institutional Account Provisioned");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-12 py-8">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between px-12">
           <StepIndicator active={step >= 1} label="Identity" sub="Personal details" last={false} />
           <StepIndicator active={step >= 2} label="Placement" sub="Role & Campus" last={false} />
           <StepIndicator active={step >= 3} label="Auth" sub="Security setup" last={false} />
           <StepIndicator active={step >= 4} label="Ready" sub="Complete" last={true} />
        </div>

        {/* Content Area */}
        <div className="card bg-white p-12 min-h-[500px] flex flex-col items-center text-center">
            {step === 1 && (
               <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-20 h-20 rounded-3xl bg-brand-tertiary/10 grid place-items-center text-brand-tertiary">
                      <UserPlus size={40} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-brand-primary tracking-tight">Staff Identity Initiation</h2>
                    <p className="text-brand-primary/60 text-sm font-medium mt-2">Enter the legal full name and verified workspace email.</p>
                  </div>
                  <div className="w-full max-w-md space-y-4 text-left">
                     <div className="space-y-1.5">
                        <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest px-1">Full Legal Name</label>
                        <input 
                           type="text" 
                           placeholder="e.g. Dr. Jane Smith"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full bg-brand-blush/50 border border-brand-primary/8 rounded-2xl px-5 py-4 text-sm font-bold text-brand-primary focus:ring-2 focus:ring-brand-tertiary/20 outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest px-1">Institutional Email</label>
                        <input 
                           type="email" 
                           placeholder="j.smith@wajinaschools.com"
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           className="w-full bg-brand-blush/50 border border-brand-primary/8 rounded-2xl px-5 py-4 text-sm font-bold text-brand-primary focus:ring-2 focus:ring-brand-tertiary/20 outline-none"
                        />
                     </div>
                  </div>
                  <button 
                     onClick={handleNext}
                     disabled={!formData.name || !formData.email}
                     className="w-full max-w-md bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                  >
                     Review Appointment
                     <ArrowRight size={16} />
                  </button>
               </div>
            )}

            {step === 2 && (
               <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 grid place-items-center text-brand-accent">
                      <Briefcase size={40} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-brand-primary tracking-tight">Professional Placement</h2>
                    <p className="text-brand-primary/60 text-sm font-medium mt-2">Map the new hire to their institutional role and campus.</p>
                  </div>
                  <div className="w-full max-w-md grid grid-cols-2 gap-4 text-left">
                     <div className="space-y-1.5 col-span-2">
                        <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest px-1">Assigned Role</label>
                        <select 
                           value={formData.role}
                           onChange={(e) => setFormData({...formData, role: e.target.value})}
                           className="w-full bg-brand-blush/50 border border-brand-primary/8 rounded-2xl px-5 py-4 text-sm font-bold text-brand-primary outline-none"
                        >
                           <option value="TEACHER">Teaching Staff</option>
                           <option value="FORM_TEACHER">Form Teacher</option>
                           <option value="HOD">Head of Department</option>
                           <option value="HEAD_TEACHER">Head Teacher</option>
                           <option value="ACCOUNTS_OFFICER">Accounts Officer</option>
                           <option value="BURSAR">Bursar</option>
                        </select>
                     </div>
                     <div className="space-y-1.5 col-span-2">
                        <label className="text-token-micro font-black text-brand-primary uppercase tracking-widest px-1">Institutional Campus</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['PRIMARY', 'SECONDARY'].map(c => (
                              <button 
                                 key={c}
                                 onClick={() => setFormData({...formData, campus: c})}
                                 disabled={!isGlobalRole && formData.campus !== c}
                                 className={`py-4 rounded-xl border font-black text-token-micro tracking-widest uppercase transition-all ${formData.campus === c ? 'bg-brand-tertiary border-brand-tertiary text-white shadow-lg' : 'bg-brand-blush border-brand-primary/8 text-brand-tertiary'} ${!isGlobalRole && formData.campus !== c ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white cursor-pointer'}`}
                              >
                                 {c}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  <button 
                     onClick={handleNext}
                     className="w-full max-w-md bg-brand-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     Confirm Authorization
                     <ArrowRight size={16} />
                  </button>
                  <button 
                     onClick={() => setStep(1)}
                     className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest hover:text-brand-primary"
                  >
                     Back to Identity
                  </button>
               </div>
            )}

            {step === 3 && (
               <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 rounded-3xl bg-brand-secondary/10 grid place-items-center text-brand-secondary">
                      <ShieldCheck size={40} />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-3xl font-display font-black text-brand-primary tracking-tight">Security Affirmation</h2>
                    <p className="text-brand-primary/60 text-sm font-medium mt-2 leading-relaxed">
                       You are provisioning a new institutional account for <span className="text-brand-secondary font-black font-display underline underline-offset-4 decoration-brand-secondary/20">{formData.name}</span> as a <span className="text-brand-tertiary font-black font-display uppercase tracking-widest">{formData.role}</span>. 
                    </p>
                  </div>
                  
                  <div className="w-full max-w-md bg-brand-lightblue/5 border border-brand-lightblue/10 rounded-3xl p-6 flex items-start gap-4 text-left">
                     <AlertCircle size={24} className="text-brand-tertiary shrink-0 mt-1" />
                     <div>
                        <p className="text-xs font-black text-brand-primary uppercase tracking-tight mb-1">Onboarding Logic</p>
                        <p className="text-token-micro font-medium text-brand-primary/70 leading-relaxed">
                           A cryptographically secure temporary password will be generated. The user must perform a mandatory password reset upon their first login attempt.
                        </p>
                     </div>
                  </div>

                  <button 
                     onClick={handleSubmit}
                     disabled={loading}
                     className="w-full max-w-md bg-brand-secondary text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {loading ? "Encrypting Identity..." : "Finalize & Provision"}
                     {!loading && <CheckCircle2 size={16} />}
                  </button>
               </div>
            )}

            {step === 4 && provisionedUser && (
               <div className="w-full flex flex-col items-center gap-8 animate-in zoom-in-90 duration-500">
                  <div className="w-24 h-24 rounded-[2rem] bg-brand-secondary grid place-items-center text-white shadow-2xl shadow-brand-secondary/30">
                      <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-display font-black text-brand-primary tracking-tight">Onboarding Successful</h2>
                    <p className="text-brand-primary/60 text-sm font-medium mt-2 italic">Institutional account is now live.</p>
                  </div>

                  <div className="w-full max-w-md border-2 border-dashed border-brand-secondary/30 rounded-3xl p-8 bg-brand-blush/50">
                     <div className="flex flex-col items-center gap-6">
                        <div className="space-y-1">
                           <p className="text-token-micro font-black text-brand-tertiary uppercase tracking-widest">Master Credentials</p>
                           <p className="text-xl font-display font-black text-brand-primary">{provisionedUser.user.email}</p>
                        </div>
                        <div className="w-full p-6 bg-white border border-brand-secondary/20 rounded-2xl">
                           <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mb-2">Temporary Access Key</p>
                           <p className="text-lg font-mono font-black text-brand-primary select-all tracking-wider">{provisionedUser.temporaryPassword}</p>
                        </div>
                        <p className="text-token-micro font-bold text-brand-tertiary leading-relaxed">
                           Share these credentials securely with the appointee. The key will expire after the first session initialization.
                        </p>
                     </div>
                  </div>

                  <button 
                     onClick={() => {
                        setStep(1);
                        setFormData({ name: "", email: "", role: "TEACHER", campus: "PRIMARY", department: "" });
                        setProvisionedUser(null);
                     }}
                     className="bg-brand-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-primary/90 transition-all"
                  >
                     Provision Another Staff
                  </button>
               </div>
            )}
        </div>

        {/* Footer Help */}
        <div className="flex items-center justify-center gap-12 text-token-micro font-black text-brand-tertiary uppercase tracking-widest opacity-40">
           <div className="flex items-center gap-2">
              <Building2 size={16} />
              Wajina primary
           </div>
           <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              verified identity
           </div>
           <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              AES-256 Encrypted
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StepIndicator({ active, label, sub, last }: any) {
   return (
      <div className={`flex items-center gap-4 ${last ? '' : 'flex-1'}`}>
         <div className="flex flex-col items-center text-center">
            <div className={`w-8 h-8 rounded-xl grid place-items-center text-token-micro font-black border-2 transition-all ${active ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-tertiary border-brand-primary/8'}`}>
               {active ? <CheckCircle2 size={14} /> : '•'}
            </div>
            <div className="mt-2">
               <p className={`text-token-micro font-black uppercase tracking-tighter ${active ? 'text-brand-primary' : 'text-brand-tertiary'}`}>{label}</p>
               <p className="text-token-micro font-bold opacity-40 uppercase whitespace-nowrap">{sub}</p>
            </div>
         </div>
         {!last && <div className={`h-[2px] mb-8 flex-1 rounded-full transition-all ${active ? 'bg-brand-primary/20' : 'bg-black/5'}`} />}
      </div>
   );
}

