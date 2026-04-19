import Image from "next/image";
import Link from "next/link";
import { LandingHero } from "./components/LandingHero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden">
      {/* Structural Orbs (Static) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-moonstone/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-saffron/5 rounded-full blur-[120px]" />

      <main>
        <LandingHero />
      </main>

      {/* Desktop Design Footer (Static) */}
      <footer className="py-20 border-t border-black/5 relative z-10">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6 mb-8 md:mb-0">
            <Image 
              src="/images/Logo.png" 
              alt="Wajina Logo" 
              width={32} 
              height={32} 
              className="grayscale opacity-40 hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
            />
            <span>Wajina International Schools</span>
          </div>
          <div className="flex gap-12">
            <Link href="#" className="hover:text-brand-gunmetal transition-colors">Safety</Link>
            <Link href="#" className="hover:text-brand-gunmetal transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-brand-gunmetal transition-colors">Governance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
