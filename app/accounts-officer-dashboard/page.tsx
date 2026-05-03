"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { Stamp, Receipt, FileCheck, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { cn } from "@/lib/utils";

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

  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.4em]">{campus || "PRIMARY"} CONTROL</span>
            </div>
            <h1 className="text-3xl font-display font-black text-brand-primary tracking-tighter uppercase mb-1">Financial Center</h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-brand-primary/8 rounded-xl px-4 py-3 shadow-sm self-start">
            <Calendar size={16} className="text-brand-tertiary" />
            <span className="text-xs font-black text-brand-primary tracking-wide uppercase">{currentDate}</span>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a href="/results-approval" className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300 no-underline">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><Stamp size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">ATTESTATION</p>
              <p className="text-lg font-black text-brand-primary leading-tight">Verification Queue</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest mt-1">Sign-off required</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-brand-primary/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </a>
          <a href="/director-finances" className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300 no-underline">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><Receipt size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">REVENUE</p>
              <p className="text-lg font-black text-brand-primary leading-tight">Campus Overview</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest mt-1">{campus || "PRIMARY"} Ledger</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-brand-primary/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </a>
          <a href="/expense-approval" className="card flex items-center gap-8 group hover:translate-y-[-4px] transition-all duration-300 no-underline">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner"><FileCheck size={24} className="text-brand-accent" /></div>
            <div>
              <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-1">AUTHORIZATION</p>
              <p className="text-lg font-black text-brand-primary leading-tight">Expense Review</p>
              <p className="text-token-micro font-black text-brand-accent uppercase tracking-widest mt-1">Audit Protocol</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-brand-primary/20 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </a>
        </div>

        {/* Pending Expenses */}
        <div className="card">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-brand-primary text-lg">Pending Expense Authorizations</h4>
            <a href="/expense-approval" className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary hover:underline">View All →</a>
          </div>
          <div className="flex flex-col gap-4">
            {expenses.length === 0 ? (
              <p className="text-xs text-brand-tertiary text-center py-12 italic">No pending expense claims at this time.</p>
            ) : (
              expenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-brand-blush/50 rounded-xl border border-brand-primary/5 hover:border-brand-tertiary/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-accent/10 grid place-items-center shrink-0"><Receipt size={16} className="text-brand-accent" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-brand-primary truncate">{e.description || "Expense Claim"}</p>
                      <p className="text-token-micro font-bold text-brand-tertiary">₦{e.amount?.toLocaleString()} • {e.requestedBy || "Staff"}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-brand-tertiary opacity-50 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

