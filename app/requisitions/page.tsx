"use client";

import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { Inbox, Plus } from "lucide-react";

export default function RequisitionsPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-token-micro font-black uppercase tracking-widest text-brand-tertiary">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
            <span>Operations Hub</span>
          </div>
          <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight leading-tight uppercase">
            Manage <span className="text-brand-secondary">Requisitions</span>
          </h1>
          <p className="max-w-3xl text-brand-primary/70 text-sm font-black uppercase tracking-widest">
            Create new requisitions, review pending approvals, and access purchase requests.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <button
            type="button"
            onClick={() => router.push("/requisitions/new")}
            className="group rounded-[2rem] border border-brand-primary/10 bg-white p-8 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/5 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                <Plus size={24} />
              </div>
              <span className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary">
                Start Request
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-brand-primary mb-2 uppercase">
                Initiate Requisition
              </h2>
              <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50">Launch a new purchase request for supplies, services, or resources.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/requisitions/inbox")}
            className="group rounded-[2rem] border border-brand-primary/10 bg-white p-8 text-left shadow-[var(--shadow-soft)] transition-all hover:border-brand-secondary/30 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-secondary/10 text-brand-secondary transition-colors group-hover:bg-brand-secondary group-hover:text-white relative">
                <Inbox size={24} />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-[0.65rem] font-black text-white shadow-md border-2 border-white">
                  !
                </span>
              </div>
              <span className="text-token-micro font-black uppercase tracking-widest text-brand-tertiary">
                Approval Inbox
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-brand-primary mb-2 uppercase">
                View Pending
              </h2>
              <p className="text-token-micro font-black uppercase tracking-widest text-brand-primary/50">Review and process requisitions assigned to your approval queue.</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
