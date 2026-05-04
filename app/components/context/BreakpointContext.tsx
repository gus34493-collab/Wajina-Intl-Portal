"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type BreakpointState = {
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  width: number;
};

const BreakpointContext = createContext<BreakpointState | undefined>(undefined);

export function BreakpointProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BreakpointState>({
    isMobile: true, // Default to mobile for SSR
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setState({
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isLaptop: w >= 1024 && w < 1440,
        isDesktop: w >= 1440,
        width: w,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <BreakpointContext.Provider value={state}>
      {children}
    </BreakpointContext.Provider>
  );
}

export function useGlobalBreakpoint() {
  const context = useContext(BreakpointContext);
  if (context === undefined) {
    throw new Error("useGlobalBreakpoint must be used within a BreakpointProvider");
  }
  return context;
}

