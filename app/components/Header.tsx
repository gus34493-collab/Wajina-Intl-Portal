"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Bell, ArrowLeft, ChevronDown, UserCircle, LogOut, Camera, User, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Header({ user, loading, onUserUpdate, onMobileMenuToggle }: { user: any, loading: boolean, onUserUpdate?: (user: any) => void, onMobileMenuToggle?: () => void }) {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good day");
  const [theme, setTheme] = useState("light");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("GOOD MORNING");
    else if (hour < 17) setGreeting("GOOD AFTERNOON");
    else setGreeting("GOOD EVENING");

    const savedTheme = localStorage.getItem("wajina-theme") || "light";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("wajina-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      sessionStorage.clear();
      toast.success("You've been signed out");
      window.location.href = "/portal";
    } catch (err) {
      window.location.href = "/portal";
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const promise = fetch("/api/auth/profile-photo", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      if (onUserUpdate) onUserUpdate(data.user);
      return data;
    });

    toast.promise(promise, {
      loading: "Updating your photo...",
      success: "Photo updated!",
      error: "Upload failed",
    });

    setIsDropdownOpen(false);
  };

  const userName = user?.name?.split(" ")[0] || "USER";

  return (
    <header role="banner" className="flex items-center justify-between h-20 px-4 md:px-0 bg-transparent relative z-50">
      {/* Mobile Menu Toggle (Left) */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden w-12 h-12 rounded-xl border border-brand-primary/5 bg-white text-brand-primary grid place-items-center shadow-sm"
      >
        <Menu size={20} />
      </button>

      {/* Left Zone: Greeting Slab — ALWAYS visible with scaling */}
      <div className="flex items-center gap-2 md:gap-8 min-w-0 flex-1">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl border border-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all grid place-items-center bg-white shadow-sm group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform md:size-[18px]" />
        </button>

        <div className="min-w-0">
          <h2 className="text-token-micro md:text-token-micro font-display font-black text-brand-primary/40 tracking-[0.2em] md:tracking-[0.3em] uppercase mb-0.5 md:mb-1 truncate">
            {greeting}
          </h2>
          <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
            <p className="text-token-micro md:text-sm font-black text-brand-primary uppercase tracking-tight truncate">
              <span className="text-brand-accent">{userName}</span>
            </p>
            {user?.role !== "DIRECTOR" && user?.campus && (
              <span className="text-token-micro md:text-token-micro font-black text-brand-primary/40 uppercase tracking-[0.2em] border-l border-brand-primary/10 pl-2 md:pl-3 truncate">
                {user.campus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Zone: Command Actions */}
      <div className="flex items-center gap-4 md:gap-8 ml-auto md:ml-0">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-xl border border-brand-primary/5 hover:border-brand-primary transition-all grid place-items-center bg-white text-brand-primary shadow-sm"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="grid relative w-11 h-11 md:w-12 md:h-12 rounded-xl border border-brand-primary/5 hover:border-brand-primary transition-all place-items-center bg-white text-brand-primary shadow-sm shrink-0">
            <Bell size={18} className="md:size-5" />
            <span className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-accent border-2 border-white rounded-full" />
          </button>
        </div>

        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 cursor-pointer group md:bg-white/50 md:backdrop-blur-sm md:border border-brand-primary/5 md:px-4 md:py-2 rounded-2xl hover:bg-white transition-all shadow-sm"
          >
            <div className="w-12 h-12 md:w-10 md:h-10 bg-white rounded-xl border border-brand-primary/10 overflow-hidden relative shadow-inner">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} className="text-brand-primary/20 absolute inset-0 m-auto" />
              )}
            </div>
            <div className="block min-w-0 text-right">
              <p className="text-token-micro md:text-token-micro font-black text-brand-primary uppercase tracking-wider leading-none mb-0.5 md:mb-1 truncate">{user?.name}</p>
              <p className="text-token-micro md:text-token-micro font-black text-brand-accent uppercase tracking-widest opacity-80 truncate">{user?.role}</p>
            </div>
            <ChevronDown size={12} className={cn("text-brand-primary transition-all opacity-40 block", isDropdownOpen && "rotate-180 opacity-100")} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setIsDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 mt-6 w-72 bg-white border border-brand-primary/10 p-0 shadow-[0_40px_80px_-15px_rgba(22,48,43,0.25)] rounded-[2.5rem] overflow-hidden z-[60]"
                >
                  <div className="bg-brand-primary p-8 text-white text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <p className="text-token-micro font-black tracking-[0.4em] mb-3 opacity-60">MY ACCOUNT</p>
                    <p className="text-base font-black uppercase tracking-tight truncate">{user?.name}</p>
                    <p className="text-token-micro font-bold text-brand-secondary uppercase tracking-[0.2em] mt-1">{user?.role}</p>
                  </div>

                  <div className="p-4 space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-4 p-5 hover:bg-white rounded-[1.5rem] text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors">
                        <Camera size={18} className="text-brand-primary group-hover:text-brand-accent" />
                      </div>
                      <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">Update Photo</span>
                    </button>

                    <button className="w-full flex items-center gap-4 p-5 hover:bg-white rounded-[1.5rem] text-left transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors">
                        <User size={18} className="text-brand-primary group-hover:text-brand-accent" />
                      </div>
                      <span className="text-token-micro font-black text-brand-primary uppercase tracking-widest">View Profile</span>
                    </button>

                    <div className="h-px bg-brand-primary/5 mx-6 my-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 p-5 hover:bg-rose-50 text-rose-600 rounded-[1.5rem] text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-600/5 flex items-center justify-center group-hover:bg-rose-600/10 transition-colors">
                        <LogOut size={18} />
                      </div>
                      <span className="text-token-micro font-black uppercase tracking-widest">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
        </div>
      </div>
    </header>
  );
}

