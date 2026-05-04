"use client";

import { useEffect } from "react";

export default function LegacyAtmosphere() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--aura-x", `${x}%`);
      document.documentElement.style.setProperty("--aura-y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return <div className="grain-overlay" aria-hidden="true" />;
}

