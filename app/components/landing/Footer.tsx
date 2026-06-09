"use client";

import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer({ minimal: _ = false }: { minimal?: boolean }) {
  return (
    <footer
      id="contact"
      className="pt-24 pb-10 px-6"
      style={{
        background: "#070907",
        borderTop: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-no-bg.png"
                alt="Wajina International Schools"
                width={32}
                height={32}
                priority
                className="rounded-full object-contain bg-white"
                style={{ width: "var(--space-8)", height: "var(--space-8)", padding: "var(--space-1)" }}
              />
              <span
                className="font-black tracking-tight"
                style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-sans)" }}
              >
                Wajina
              </span>
            </div>
            <p
              className="text-xs leading-loose"
              style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
            >
              Empowering the next generation of African leaders through intellectual
              excellence and character leadership. A citadel built to outlast its founders.
            </p>
          </div>

          {/* Academic Stages */}
          <div className="space-y-6">
            <h4
              className="text-token-micro font-black uppercase tracking-[0.4em]"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}
            >
              Academic Stages
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Early Years", href: "#wajina-path" },
                { label: "Primary School", href: "#wajina-path" },
                { label: "Junior Secondary", href: "#wajina-path" },
                { label: "Senior Secondary", href: "#wajina-path" },
                { label: "Enrichment Hub", href: "#pillars" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* The School */}
          <div className="space-y-6">
            <h4
              className="text-token-micro font-black uppercase tracking-[0.4em]"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}
            >
              The School
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: "About Us", href: "#citadel" },
                { label: "Our Patriarch", href: "#patriarch" },
                { label: "Our Faculty", href: "#faculty" },
                { label: "Voices", href: "#voices" },
                { label: "Admissions", href: "#admissions" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Visit */}
          <div className="space-y-6">
            <h4
              className="text-token-micro font-black uppercase tracking-[0.4em]"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}
            >
              Visit
            </h4>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--color-cinematic-moss)" }}
                />
                <p
                  className="text-xs leading-loose"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                >
                  #1 & 2 Mama Wajina Junction,
                  <br />
                  off Mama Wajina Road, Welfare Quarters,
                  <br />
                  Makurdi, Benue State, Nigeria
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} style={{ color: "var(--color-cinematic-moss)" }} />
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                >
                  0706 955 0064
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: "var(--color-cinematic-moss)" }} />
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                >
                  wajinainternational@gmail.com
                </p>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://facebook.com/WajinaOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a
                  href="https://instagram.com/WajinaOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a
                  href="https://twitter.com/WajinaOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p
            className="text-token-micro font-black uppercase tracking-[0.3em]"
            style={{ color: "rgba(255,255,255,0.14)", fontFamily: "var(--font-sans)" }}
          >
            © 2025–2026 Wajina International Schools. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Portal Login"].map((label) => (
              <a
                key={label}
                href={label === "Portal Login" ? "/login" : "#"}
                className="text-token-micro font-black uppercase tracking-[0.3em] transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.14)", fontFamily: "var(--font-sans)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.14)")
                }
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
