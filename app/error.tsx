"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-[#f8f7f4]">
      <div className="w-16 h-16 rounded-3xl bg-brand-primary/[0.06] border border-brand-primary/10 flex items-center justify-center">
        <span className="text-2xl font-black text-brand-primary/30">!</span>
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-black text-brand-primary uppercase tracking-widest mb-2">
          Something Went Wrong
        </h2>
        <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
          {error.message || "An unexpected error occurred"}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-8 py-3.5 bg-brand-primary text-white rounded-2xl font-black text-token-micro uppercase tracking-widest hover:bg-brand-primary/90 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
