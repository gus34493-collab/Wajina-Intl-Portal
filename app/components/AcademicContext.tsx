"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";

export interface ActiveSession {
  id: string;
  name: string;
  year: string;
}

export interface ActiveTerm {
  id: string;
  name: string;
  sessionId: string;
  startDate: string;
  endDate: string;
}

interface AcademicContextType {
  activeSession: ActiveSession | null;
  activeTerm: ActiveTerm | null;
  loading: boolean;
  refresh: () => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/academic-context");
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.activeSession ?? null);
        setActiveTerm(data.activeTerm ?? null);
      }
    } catch {
      // silent — null state is a valid display state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContext(); }, [fetchContext]);

  return (
    <AcademicContext.Provider value={{ activeSession, activeTerm, loading, refresh: fetchContext }}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error("useAcademic must be used within an AcademicProvider");
  }
  return context;
}
