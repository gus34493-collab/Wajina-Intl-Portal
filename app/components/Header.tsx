"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Bell, ArrowLeft, ChevronDown, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good day");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Initialize theme from local storage if available
    const savedTheme = localStorage.getItem("wajina-theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("wajina-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  const userName = user?.name?.split(" ")[0] || "User";

  return (
    <header className="flex items-center justify-between h-20 px-4 md:px-0 bg-transparent transition-all">
      {/* Left Zone: Greeting & Context */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="press-effect w-10 h-10 rounded-full grid place-items-center bg-black/5 text-brand-moonstone hover:bg-black/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-lg md:text-xl font-display font-black text-brand-gunmetal tracking-tight">
            {greeting}, <span className="text-brand-moonstone">{userName}</span>
          </h2>
        </div>
      </div>

      {/* Right Zone: Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-text-secondary">
          <button
            onClick={toggleTheme}
            className="press-effect w-10 h-10 rounded-full grid place-items-center bg-black/5 hover:bg-black/10 transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="press-effect relative p-1.5 text-text-secondary hover:text-brand-moonstone transition-colors">
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-error border-2 border-brand-bg rounded-full" />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-black/5" />

        <motion.div 
          whileHover={{ x: 2 }}
          className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-black/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-moonstone/10 grid place-items-center text-brand-moonstone overflow-hidden border border-brand-moonstone/10">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={20} />
            )}
          </div>
          <ChevronDown size={14} className="text-text-muted group-hover:text-brand-gunmetal transition-colors" />
        </motion.div>
      </div>
    </header>
  );
}
