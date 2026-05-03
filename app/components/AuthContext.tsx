"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface AuthContextType {
  user: any;
  loading: boolean;
  campus: string | null;
  isDirector: boolean;
  updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        // Correct behavior for logged out users - do nothing
        setUser(null);
      }
    } catch (err) {
      // Only log true network errors
      console.warn("[AuthProvider] Network connectivity issue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const updateUser = (newUser: any) => setUser(newUser);
  const isDirector = user?.role === "DIRECTOR";
  const campus = user?.campus || null;

  return (
    <AuthContext.Provider value={{ user, loading, campus, isDirector, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

