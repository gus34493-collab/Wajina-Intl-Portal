"use client";

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
              <div
                className="w-8 h-8 flex items-center justify-center font-black text-sm select-none"
                style={{
                  background: "var(--color-cinematic-moss)",
                  color: "var(--color-cinematic-ink)",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                }}
              >
                W
              </div>
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

          {/* Pathways */}
          <div className="space-y-6">
            <h4
              className="text-[10px] font-black uppercase tracking-[0.4em]"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}
            >
              Pathways
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                "Early Years",
                "Primary School",
                "Junior Secondary",
                "Senior Secondary",
                "Enrichment Hub",
              ].map((link) => (
                <a
                  key={link}
                  href="#pathways"
                  className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.22)")
                  }
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* The School */}
          <div className="space-y-6">
            <h4
              className="text-[10px] font-black uppercase tracking-[0.4em]"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}
            >
              The School
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                "About Us",
                "Board of Governors",
                "Academic Staff",
                "News & Events",
                "Admissions",
              ].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cinematic-moss)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.22)")
                  }
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Visit */}
          <div className="space-y-6">
            <h4
              className="text-[10px] font-black uppercase tracking-[0.4em]"
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
                  123 Excellence Avenue,
                  <br />
                  Makurdi, Benue State,
                  <br />
                  Nigeria
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} style={{ color: "var(--color-cinematic-moss)" }} />
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                >
                  +234 (0) 800 WAJINA
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: "var(--color-cinematic-moss)" }} />
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)" }}
                >
                  info@wajina.edu.ng
                </p>
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
            className="text-[9px] font-black uppercase tracking-[0.3em]"
            style={{ color: "rgba(255,255,255,0.14)", fontFamily: "var(--font-sans)" }}
          >
            © 2025–2026 Wajina International Schools. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Portal Login"].map((label) => (
              <a
                key={label}
                href={label === "Portal Login" ? "/login" : "#"}
                className="text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-200"
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
