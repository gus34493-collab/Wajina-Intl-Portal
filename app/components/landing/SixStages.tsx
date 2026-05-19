"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

const STAGES = [
  {
    title: "Foundation",
    period: "Creche & Nursery · Ages 1–4",
    ethos: "Nurture",
    description: "Your child's very first school moments happen here — and we handle them with the care they deserve. Our creche and nursery is a warm, colourful world of gentle discovery. We're not just watching them grow; we're part of it.",
    image: "/images/stage-foundation.jpg",
  },
  {
    title: "Discovery",
    period: "Lower Primary · Ages 5–8",
    ethos: "Explore",
    description: "This is where learning becomes exciting — and we make sure every child feels it. Letters become stories worth telling. Numbers become puzzles worth solving. The confidence we build here travels with them for life.",
    image: "/images/stage-excellence.jpg",
  },
  {
    title: "Excellence",
    period: "Upper Primary · Ages 9–11",
    ethos: "Mastery",
    description: "By now, they're not just learning — they're starting to shine. We raise the bar on purpose, because we know what they're capable of. They discover it too, and that changes everything.",
    image: "/images/stage-character.jpg",
  },
  {
    title: "Character",
    period: "Junior Secondary · Ages 12–14",
    ethos: "Integrity",
    description: "These are the years that shape who they become, not just what they know. We invest equally in their integrity, their grit, and their sense of self. You'll see it at home. They'll feel it in themselves.",
    image: "/images/IMG-20260430-WA0002.jpg",
  },
  {
    title: "Innovation",
    period: "Senior Secondary · Ages 15–18",
    ethos: "Prepare",
    description: "WASSCE-ready. Confident. Hungry for more. We prepare them to walk into Nigeria's most competitive spaces and hold their own. This is what all those years have been building toward.",
    image: "/images/students-presenting.jpg",
  },
  {
    title: "Impact",
    period: "Alumni & Legacy",
    ethos: "Legacy",
    description: "Once a Wajina student, always a Wajina student. Our graduates carry something well beyond certificates — a way of thinking, showing up, and leading that people notice. That's what we're really building here.",
    image: "/images/stage-impact.jpg",
  },
];

// ── SVG coordinate system ─────────────────────────────────────────────────────
const VB_W = 400;
const VB_H = 1200;
const LX = 150; // 37.5% from left
const RX = 250; // 62.5% from left
const START_Y = 100;
const GAP_Y = 220; // wider vertical gap — image+text stacked per stage needs room
const COLORS = ["#6AB547", "#E67737", "#6AB547", "#E67737", "#6AB547", "#E67737"];

type NodeData = (typeof STAGES)[0] & {
  x: number; y: number;
  xPct: string; yPct: string;
  side: "left" | "right";
  color: string;
};

const NODES: NodeData[] = STAGES.map((s, i) => {
  const x = i % 2 === 0 ? LX : RX;
  const y = START_Y + i * GAP_Y;
  return {
    ...s,
    x, y,
    xPct: `${(x / VB_W) * 100}%`,
    yPct: `${(y / VB_H) * 100}%`,
    side: i % 2 === 0 ? "left" : "right",
    color: COLORS[i],
  };
});

const PATH_D = (() => {
  const parts: string[] = [`M ${NODES[0].x} ${NODES[0].y}`];
  for (let i = 1; i < NODES.length; i++) {
    const a = NODES[i - 1];
    const b = NODES[i];
    const midY = (a.y + b.y) / 2;
    parts.push(`C ${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`);
  }
  return parts.join(" ");
})();

const DOTS = [
  { cx: 200, cy: 65,   r: 3,   o: 0.12 },
  { cx: 120, cy: 218,  r: 2,   o: 0.08 },
  { cx: 280, cy: 360,  r: 3.5, o: 0.07 },
  { cx: 160, cy: 458,  r: 2,   o: 0.10 },
  { cx: 240, cy: 594,  r: 2.5, o: 0.08 },
  { cx: 130, cy: 714,  r: 2,   o: 0.11 },
  { cx: 270, cy: 829,  r: 3,   o: 0.07 },
  { cx: 175, cy: 960,  r: 2,   o: 0.09 },
  { cx: 225, cy: 1067, r: 3,   o: 0.08 },
  { cx: 150, cy: 1154, r: 2.5, o: 0.07 },
];

// Growth journey watermarks — progress from geometric shapes (toys/blocks) to STEM notation
const GROWTH_BG = [
  { sym: "◻", x: "3%",  y: "4%",  fs: "2.2rem", op: 0.07, dur: 8.5, delay: 0 },
  { sym: "○",  x: "88%", y: "7%",  fs: "2.8rem", op: 0.05, dur: 7.2, delay: 1.3 },
  { sym: "△",  x: "5%",  y: "16%", fs: "2rem",   op: 0.06, dur: 9.1, delay: 2.5 },
  { sym: "◻",  x: "90%", y: "21%", fs: "1.8rem", op: 0.04, dur: 7.8, delay: 0.7 },
  { sym: "A",  x: "4%",  y: "39%", fs: "3.4rem", op: 0.05, dur: 7.3, delay: 1.9 },
  { sym: "1",  x: "89%", y: "45%", fs: "3rem",   op: 0.05, dur: 8.2, delay: 0.4 },
  { sym: "B",  x: "6%",  y: "53%", fs: "2.5rem", op: 0.04, dur: 9.6, delay: 3.1 },
  { sym: "Σ",  x: "87%", y: "61%", fs: "3.5rem", op: 0.06, dur: 7.6, delay: 1.6 },
  { sym: "π",  x: "4%",  y: "71%", fs: "3rem",   op: 0.07, dur: 8.1, delay: 0.2 },
  { sym: "∞",  x: "89%", y: "79%", fs: "3.4rem", op: 0.05, dur: 9.3, delay: 2.2 },
  { sym: "α",  x: "5%",  y: "85%", fs: "2.8rem", op: 0.06, dur: 7.1, delay: 0.9 },
  { sym: "★",  x: "86%", y: "92%", fs: "2.5rem", op: 0.05, dur: 8.7, delay: 2.8 },
];

// ── Image card ────────────────────────────────────────────────────────────────
function NodeImage({ node }: { node: NodeData }) {
  return (
    <div style={{
      borderRadius: 8,
      overflow: "hidden",
      border: `1px solid ${node.color}30`,
      background: "rgba(14,18,10,0.6)",
    }}>
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.image}
          alt={node.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.75) saturate(0.85)" }}
          loading="lazy"
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(14,18,10,0.85) 100%)",
        }} />
        <p style={{
          position: "absolute", bottom: 8, left: 10,
          margin: 0, fontSize: "0.42rem", fontWeight: 900,
          letterSpacing: "0.28em", textTransform: "uppercase",
          color: node.color, whiteSpace: "nowrap",
        }}>
          {node.period}
        </p>
      </div>
    </div>
  );
}

// ── Text block ────────────────────────────────────────────────────────────────
function NodeText({ node, align }: { node: NodeData; align: "left" | "right" | "center" }) {
  return (
    <div style={{ textAlign: align }}>
      <h3 style={{
        margin: "0 0 0.5rem",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
        fontWeight: 900,
        color: "var(--color-cinematic-bone)",
        textTransform: "uppercase",
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
      }}>
        {node.title}
      </h3>
      <p style={{
        margin: 0,
        fontSize: "clamp(0.6rem, 0.9vw, 0.68rem)",
        color: "var(--color-cinematic-dim-2)",
        lineHeight: 1.72,
      }}>
        {node.description}
      </p>
    </div>
  );
}

// ── Stage node ────────────────────────────────────────────────────────────────
function StageNode({
  node,
  index,
  pathLength,
}: {
  node: NodeData;
  index: number;
  pathLength: MotionValue<number>;
}) {
  const threshold = index / NODES.length;
  const lo = Math.max(0, threshold - 0.04);
  const hi = Math.min(1, threshold + 0.06);
  const imageEnd = Math.min(1, threshold + 0.11);
  const textEnd = Math.min(1, threshold + 0.16);

  const ringGlow = useTransform(pathLength, [lo, hi], [0, 1]);
  const innerDim = useTransform(pathLength, [lo, hi], [0.35, 1]);
  const imageOpacity = useTransform(pathLength, [hi, imageEnd], [0, 1]);
  const imageY = useTransform(pathLength, [hi, imageEnd], [10, 0]);
  const textOpacity = useTransform(pathLength, [imageEnd, textEnd], [0, 1]);
  const textY = useTransform(pathLength, [imageEnd, textEnd], [6, 0]);

  const isLeft = node.side === "left";

  // Image → outer side. Text → inner side (opposite). Never inline display — let Tailwind win.
  const outerPos = isLeft ? { right: "calc(100% + 20px)" } : { left: "calc(100% + 20px)" };
  const innerPos = isLeft ? { left:  "calc(100% + 20px)" } : { right: "calc(100% + 20px)" };

  return (
    <div
      style={{
        position: "absolute",
        left: node.xPct,
        top: node.yPct,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Ring + inner node */}
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1.5px solid ${node.color}1a`,
          background: `radial-gradient(circle, ${node.color}06 0%, transparent 70%)`,
        }} />
        <motion.div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1.5px solid ${node.color}70`,
          background: `radial-gradient(circle, ${node.color}1a 0%, transparent 70%)`,
          boxShadow: `0 0 28px ${node.color}44, 0 0 10px ${node.color}28`,
          opacity: ringGlow,
        }} />
        <motion.div style={{
          position: "absolute", inset: 10,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 30%, ${node.color}ff 0%, ${node.color}cc 100%)`,
          boxShadow: `inset 0 2px 6px rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 14px ${node.color}33`,
          border: "2px solid rgba(255,255,255,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          opacity: innerDim,
        }}>
          <span style={{ fontSize: "0.35rem", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(14,18,10,0.6)", lineHeight: 1 }}>Stage</span>
          <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0E120A", lineHeight: 1, fontFamily: "var(--font-display)" }}>{index + 1}</span>
          <span style={{ fontSize: "0.32rem", fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(14,18,10,0.45)", lineHeight: 1 }}>{node.ethos}</span>
        </motion.div>
      </div>

      {/* Desktop image — OUTER side. className controls display; no inline display override. */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          ...outerPos,
          width: 268,
          pointerEvents: "none",
        }}
      >
        <motion.div style={{ opacity: imageOpacity, y: imageY }}>
          <NodeImage node={node} />
        </motion.div>
      </div>

      {/* Desktop text — INNER side (opposite to image). Same rule: no inline display. */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          ...innerPos,
          width: 160,
          pointerEvents: "none",
        }}
      >
        <motion.div style={{ opacity: textOpacity, y: textY }}>
          <NodeText node={node} align={isLeft ? "left" : "right"} />
        </motion.div>
      </div>

      {/* Mobile: stacked below badge, anchored to outer side so it never crosses into the other column. */}
      <div
        className="flex flex-col md:hidden"
        style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          ...(isLeft ? { right: "50%" } : { left: "50%" }),
          width: "clamp(80px, 38vw, 260px)",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        <motion.div style={{ opacity: imageOpacity, y: imageY }}>
          <NodeImage node={node} />
        </motion.div>
        <motion.div style={{ opacity: textOpacity, y: textY }}>
          <NodeText node={node} align="center" />
        </motion.div>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export default function SixStages() {
  const mapRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: mapRef,
    offset: ["start end", "end start"],
  });

  const pathLength = useTransform(scrollYProgress, [0.05, 0.78], [0, 1]);

  return (
    <section
      id="wajina-path"
      style={{
        background: "var(--color-cinematic-ink)",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "14rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: "7rem", paddingBottom: "4rem" }}>
        <span style={{
          display: "block",
          fontSize: "0.58rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.5em",
          color: "var(--color-cinematic-moss)",
          marginBottom: "1.25rem",
        }}>
          The Wajina Path
        </span>
        <h2 style={{
          margin: "0 0 1.25rem",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
          lineHeight: 1.05,
          color: "var(--color-cinematic-bone)",
        }}>
          <span style={{ fontStyle: "italic" }}>Six Stages,</span>
          {" "}
          <span style={{ color: "var(--color-cinematic-moss)" }}>One Journey.</span>
        </h2>
        <p style={{
          margin: "0 auto",
          maxWidth: 500,
          fontSize: "clamp(0.78rem, 1.3vw, 0.9rem)",
          color: "var(--color-cinematic-dim-2)",
          lineHeight: 1.78,
        }}>
          From your child&apos;s very first day with us, to the moment they step out ready to lead — every stage of the Wajina journey is deliberate, warm, and built around who they&apos;re becoming.
        </p>
      </div>

      {/* Growth journey watermarks — absolutely-positioned behind everything */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {GROWTH_BG.map((g, i) => (
          <motion.span
            key={i}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: g.dur, repeat: Infinity, ease: "easeInOut", delay: g.delay }}
            style={{
              position: "absolute",
              left: g.x,
              top: g.y,
              fontSize: g.fs,
              opacity: g.op,
              color: "var(--color-cinematic-moss)",
              fontFamily: "var(--font-display)",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {g.sym}
          </motion.span>
        ))}
      </div>

      {/* Map — wider container so content can breathe on both sides of the path */}
      <div
        ref={mapRef}
        style={{
          position: "relative",
          width: "min(1000px, 95vw)",
          height: "clamp(1450px, 180vw, 2100px)",
          margin: "0 auto",
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          aria-hidden="true"
        >
          {DOTS.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.cx} cy={d.cy} r={d.r}
              fill="#6AB547" opacity={d.o}
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 5.5 + i * 0.45, repeat: Infinity, ease: "easeInOut", delay: i * 0.55 }}
            />
          ))}
          {/* Glow layer */}
          <motion.path
            d={PATH_D}
            fill="none"
            stroke="#6AB547"
            strokeWidth={10}
            strokeLinecap="round"
            strokeOpacity={0.10}
            style={{ pathLength }}
          />
          {/* Dashed ribbon */}
          <motion.path
            d={PATH_D}
            fill="none"
            stroke="#6AB547"
            strokeWidth={2}
            strokeLinecap="round"
            strokeOpacity={0.5}
            strokeDasharray="6 6"
            style={{ pathLength }}
          />
        </svg>

        {NODES.map((node, i) => (
          <StageNode key={node.title} node={node} index={i} pathLength={pathLength} />
        ))}
      </div>
    </section>
  );
}
