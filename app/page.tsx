"use client";

import { useState, useEffect } from "react";
import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero";
import Marquee from "./components/landing/Marquee";
import SixStages from "./components/landing/SixStages";
import About from "./components/landing/About";
import Features from "./components/landing/Features";
import Patriarch from "./components/landing/Patriarch";
import Faculty from "./components/landing/Faculty";
import TestimonialsCarousel from "./components/landing/TestimonialsCarousel";
import NextChapter from "./components/landing/NextChapter";
import AdmissionsCTA from "./components/landing/AdmissionsCTA";
import Footer from "./components/landing/Footer";
import AdmissionsModal from "./components/landing/AdmissionsModal";

export default function LandingPage() {
  const [isAdmissionsModalOpen, setIsAdmissionsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAdmissions = () => setIsAdmissionsModalOpen(true);
    window.addEventListener("open-admissions", handleOpenAdmissions);
    return () => window.removeEventListener("open-admissions", handleOpenAdmissions);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--color-cinematic-ink)" }}>
      <Navbar />
      <Hero />
      <Marquee />
      <SixStages />
      <About />
      <Features />
      <Patriarch />
      <Faculty />
      <TestimonialsCarousel />
      <NextChapter />
      <AdmissionsCTA />
      <Footer />

      <AdmissionsModal
        isOpen={isAdmissionsModalOpen}
        onClose={() => setIsAdmissionsModalOpen(false)}
      />
    </main>
  );
}
