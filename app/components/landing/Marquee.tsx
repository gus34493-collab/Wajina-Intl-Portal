"use client";

const ITEMS = [
  "Academic Excellence",
  "British & Nigerian Curriculum",
  "Character Leadership",
  "WAEC · IGCSE",
  "Global Citizenship",
  "Wajina International Schools",
  "Creche to Secondary",
  "A Citadel of Excellence",
  "Innovation Hub",
  "Holistic Development",
];

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div
      className="overflow-hidden py-4"
      style={{
        background: "var(--color-cinematic-surface)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 32s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center shrink-0">
            <span
              className="text-[11px] font-black uppercase tracking-[0.35em] px-8"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                color: i % 4 === 0 ? "var(--color-cinematic-moss)" : "var(--color-cinematic-dim-2)",
              }}
            >
              {item}
            </span>
            <span
              style={{
                color: "var(--color-cinematic-moss)",
                opacity: 0.35,
                fontSize: "7px",
                lineHeight: 1,
              }}
            >
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
