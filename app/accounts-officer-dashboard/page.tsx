"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { Stamp, Receipt, FileCheck, ChevronRight, Bell } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function AccountsOfficerDashboard() {
  const { campus } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/finance/pending-expenses?limit=5");
        if (res.ok) {
          const d = await res.json();
          setExpenses(d.expenses || []);
        }
      } catch (err) {
        console.error("Accounts Officer Dashboard Sync Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} CONTROL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
              Financial <span className="text-brand-secondary">Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-brand-primary/8 shadow-sm text-brand-primary/50 hover:text-brand-primary transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-black text-white text-sm select-none">
              AC
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/results-approval" className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300 no-underline">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/8 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shrink-0">
              <Stamp size={22} className="text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-1">Attestation</p>
              <p className="text-base font-black text-brand-primary leading-tight">Verification Queue</p>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-1">Sign-off required</p>
            </div>
            <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>

          <a href="/director-finances" className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300 no-underline">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/8 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shrink-0">
              <Receipt size={22} className="text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mb-1">Revenue</p>
              <p className="text-base font-black text-brand-primary leading-tight">Campus Overview</p>
              <p className="text-token-micro font-black text-brand-secondary uppercase tracking-widest mt-1">{campus || "PRIMARY"} Ledger</p>
            </div>
            <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>

          <a href="/expense-approval" className="bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 p-6 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300 no-underline">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <FileCheck size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-token-micro font-black text-white/50 uppercase tracking-widest mb-1">Authorization</p>
              <p className="text-base font-black text-white leading-tight">Expense Review</p>
              <p className="text-token-micro font-black text-white/60 uppercase tracking-widest mt-1">Audit Protocol</p>
            </div>
            <ChevronRight size={14} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>
        </div>

        {/* Pending Expenses */}
        <div className="bg-white rounded-3xl border border-brand-primary/8 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-brand-primary">Pending Expense Authorizations</h4>
            <a href="/expense-approval" className="text-token-micro font-black uppercase tracking-widest text-brand-secondary hover:underline">View All →</a>
          </div>
          <div className="flex flex-col gap-3">
            {expenses.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <Receipt size={28} className="text-brand-primary/10" />
                <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest italic">No pending expense claims at this time.</p>
              </div>
            ) : (
              expenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/40 rounded-2xl border border-brand-primary/5 hover:border-brand-secondary/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-secondary/10 grid place-items-center shrink-0">
                      <Receipt size={16} className="text-brand-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{e.description || "Expense Claim"}</p>
                      <p className="text-token-micro font-bold text-brand-primary/40 uppercase tracking-wider">₦{e.amount?.toLocaleString()} · {e.requestedBy || "Staff"}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-brand-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
