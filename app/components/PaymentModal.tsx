"use client";

import { useState } from "react";
import { X, CreditCard, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initiatePayment } from "@/app/actions/payment";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ward: any;
}

export default function PaymentModal({ isOpen, onClose, ward }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real app, these would be fetched from FeeConfig based on ward.classId
  const items = [
    { id: "TUITION", label: "Term 3 Tuition Fee", amount: 150000 },
    { id: "BUS", label: "School Bus Service", amount: 25000 },
    { id: "BOOKS", label: "Learning Materials & Books", amount: 15000 },
  ];

  const handlePay = async (item: any) => {
    setLoading(true);
    setError(null);
    try {
      // Get user from some context or pass it down. 
      // For this implementation, the initiatePayment action will handle finding the user session.
      const user = { id: "PARENT_FALLBACK" }; // Placeholder, actions use cookies-verified session

      const result = await initiatePayment({
        amount: item.amount,
        email: "parent@wajina.com.ng", // In real use, fetch from user session
        name: "Wajina Parent", 
        studentId: ward.id,
        category: item.id,
      }, user);

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      setError(err.message || "Could not start payment process.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-primary/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl border border-brand-primary/8"
          >
            {/* Header */}
            <div className="p-8 bg-brand-blush flex justify-between items-center border-b border-brand-primary/8">
              <div>
                <h3 className="text-xl font-display font-black text-brand-primary">Institutional Billing</h3>
                <p className="text-token-micro font-bold text-brand-tertiary uppercase tracking-widest mt-1">Beneficiary: {ward.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-primary hover:bg-white/80 transition-all border border-brand-primary/8"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-brand-error/10 border border-brand-error/20 rounded-xl text-brand-error text-xs font-bold leading-relaxed">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="group flex items-center justify-between p-5 rounded-2xl bg-brand-blush border border-brand-primary/8 hover:border-brand-tertiary/30 hover:bg-white transition-all cursor-pointer"
                    onClick={() => !loading && handlePay(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-brand-primary/8 flex items-center justify-center">
                        <CreditCard size={18} className="text-brand-tertiary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-brand-primary">{item.label}</p>
                        <p className="text-token-micro font-bold text-brand-tertiary">Standard Institutional Rate</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-4">
                      <span className="text-sm font-black text-brand-primary">₦{item.amount.toLocaleString()}</span>
                      <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 p-4 bg-brand-blush/50 rounded-2xl border border-dashed border-brand-primary/10">
                <ShieldCheck className="text-brand-secondary shrink-0" size={20} />
                <p className="text-token-micro text-brand-tertiary font-medium leading-relaxed">
                  Secured by **Flutterwave**. Your payment information is encrypted and never stored on Wajina servers.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex items-center justify-center opacity-20 contrast-0">
               <span className="text-xs font-black tracking-widest uppercase">Flutterwave Verified Merchant</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

