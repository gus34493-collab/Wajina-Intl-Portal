"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Settings2, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface StaffChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StaffChoiceModal({ isOpen, onClose }: StaffChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-primary/80 backdrop-blur-md"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-brand-primary/8"
        >
          {/* Header */}
          <div className="p-8 border-b border-brand-primary/8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-black text-brand-primary tracking-tight uppercase leading-none mb-2">
                Staff Management <span className="text-brand-secondary">Portal</span>
              </h2>
              <p className="text-brand-tertiary text-xs font-bold uppercase tracking-widest">Select Operational Workflow</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-brand-blush flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Choices Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChoiceCard
              title="Onboarding Pipeline"
              description="Provision new staff accounts, issue credentials, and track initial deployment."
              href="/staff-onboarding"
              icon={<UserPlus size={32} />}
              onClose={onClose}
            />
            <ChoiceCard
              title="Active Fleet Management"
              description="Review attendance, process promotions, suspensions, or archival actions."
              href="/staff-directory"
              icon={<Settings2 size={32} />}
              onClose={onClose}
              variant="accent"
            />
          </div>

          <div className="bg-brand-blush/50 p-6 text-center">
            <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.3em]">Institutional Leadership Protocol • Wajina Portal</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ChoiceCard({ title, description, href, icon, onClose, variant = "primary" }: any) {
  return (
    <Link href={href} onClick={onClose} className="group">
      <div className={`h-full p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col gap-6 ${
        variant === 'accent' 
          ? 'bg-brand-primary text-white border-white/5 hover:shadow-2xl hover:shadow-brand-primary/20 hover:-translate-y-1' 
          : 'bg-white text-brand-primary border-brand-primary/8 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1'
      }`}>
        {/* Glow Element */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-all group-hover:scale-150 ${
          variant === 'accent' ? 'bg-brand-secondary' : 'bg-brand-primary'
        }`} />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
          variant === 'accent' ? 'bg-white/10 text-brand-secondary' : 'bg-brand-blush text-brand-primary'
        }`}>
          {icon}
        </div>

        <div>
          <h3 className="text-xl font-display font-black tracking-tight mb-2 uppercase">{title}</h3>
          <p className={`text-xs font-medium leading-relaxed ${
            variant === 'accent' ? 'text-white/60' : 'text-brand-tertiary'
          }`}>
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 text-token-micro font-black uppercase tracking-widest pt-4 border-t border-current/10">
          Begin Workflow
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

