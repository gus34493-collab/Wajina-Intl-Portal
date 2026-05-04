"use client";

import React, {
  CSSProperties,
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Section = {
  id?: string;
  background: string;
  leftLabel?: ReactNode;
  title: string | ReactNode;
  rightLabel?: ReactNode;
  description?: string;
  renderBackground?: (active: boolean, previous: boolean) => ReactNode;
};

type Colors = Partial<{
  text: string;
  overlay: string;
  pageBg: string;
  stageBg: string;
}>;

type Durations = Partial<{
  change: number;
  snap: number;
}>;

export type FullScreenFXAPI = {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  getIndex: () => number;
  refresh: () => void;
};

export type FullScreenFXProps = {
  sections: Section[];
  className?: string;
  style?: CSSProperties;

  fontFamily?: string;
  header?: ReactNode;
  footer?: ReactNode;
  gap?: number;
  gridPaddingX?: number;

  showProgress?: boolean;
  debug?: boolean;

  durations?: Durations;
  reduceMotion?: boolean;
  smoothScroll?: boolean;

  bgTransition?: "fade" | "wipe";
  parallaxAmount?: number;

  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  initialIndex?: number;

  colors?: Colors;

  apiRef?: React.Ref<FullScreenFXAPI>;
  ariaLabel?: string;

  sectionHeightVh?: number;
  columnHeaders?: { left?: string; right?: string };
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const FullScreenScrollFX = forwardRef<HTMLDivElement, FullScreenFXProps>(
  (
    {
      sections,
      className,
      style,

      fontFamily = '"Rubik Wide", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      header,
      footer,
      gap = 1,
      gridPaddingX = 2,

      showProgress = true,
      debug = false,

      durations = { change: 0.7, snap: 800 },
      reduceMotion,
      smoothScroll: _smoothScroll = false,

      bgTransition = "fade",
      parallaxAmount = 4,

      currentIndex,
      onIndexChange,
      initialIndex = 0,

      colors = {
        text: "rgba(245,245,245,0.92)",
        overlay: "rgba(0,0,0,0.35)",
        pageBg: "#ffffff",
        stageBg: "#000000",
      },

      apiRef,
      ariaLabel = "Full screen scroll slideshow",

      sectionHeightVh = 50,
      columnHeaders,
    },
    ref
  ) => {
    const total = sections.length;
    const [localIndex, setLocalIndex] = useState(clamp(initialIndex, 0, Math.max(0, total - 1)));
    const isControlled = typeof currentIndex === "number";
    const index = isControlled ? clamp(currentIndex!, 0, Math.max(0, total - 1)) : localIndex;

    const rootRef = useRef<HTMLDivElement | null>(null);
    const fixedRef = useRef<HTMLDivElement | null>(null);
    const fixedSectionRef = useRef<HTMLDivElement | null>(null);

    const bgRefs = useRef<HTMLImageElement[]>([]);
    const wordRefs = useRef<HTMLSpanElement[][]>([]);
    const descriptionRefs = useRef<HTMLParagraphElement[]>([]);

    const leftTrackRef = useRef<HTMLDivElement | null>(null);
    const rightTrackRef = useRef<HTMLDivElement | null>(null);
    const leftItemRefs = useRef<HTMLDivElement[]>([]);
    const rightItemRefs = useRef<HTMLDivElement[]>([]);

    const progressFillRef = useRef<HTMLDivElement | null>(null);
    const currentNumberRef = useRef<HTMLSpanElement | null>(null);

    const stRef = useRef<ScrollTrigger | null>(null);
    const lastIndexRef = useRef(index);
    const isAnimatingRef = useRef(false);
    const isSnappingRef = useRef(false);
    const sectionTopRef = useRef<number[]>([]);

    const prefersReduced = useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);
    const motionOff = reduceMotion ?? prefersReduced;

    const tempWordBucket = useRef<HTMLSpanElement[]>([]);
    const splitWords = (text: string) => {
      const words = text.split(/\s+/).filter(Boolean);
      return words.map((w, i) => (
        <span className="fx-word-mask" key={i}>
          <span className="fx-word" ref={(el) => { if (el) tempWordBucket.current.push(el); }}>{w}</span>
          {i < words.length - 1 ? " " : null}
        </span>
      ));
    };
    const WordsCollector = ({ onReady }: { onReady: () => void }) => {
      useEffect(() => onReady(), []); // eslint-disable-line
      return null;
    };

    const computePositions = () => {
      const el = fixedSectionRef.current;
      if (!el) return;
      const top = el.offsetTop;
      const h = el.offsetHeight;
      const arr: number[] = [];
      for (let i = 0; i < total; i++) arr.push(top + (h * i) / total);
      sectionTopRef.current = arr;
    };

    const measureAndCenterLists = (toIndex = index, animate = true) => {
      const centerTrack = (
        container: HTMLDivElement | null,
        items: HTMLDivElement[],
        trackRef: React.RefObject<HTMLDivElement | null>
      ) => {
        if (!container || items.length === 0 || !trackRef.current) return;
        // Skip if track is hidden (mobile)
        if (getComputedStyle(container).display === "none") return;
        const first = items[0];
        const second = items[1];
        const contRect = container.getBoundingClientRect();
        let rowH = first.getBoundingClientRect().height;
        if (second) {
          rowH = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
        }
        const targetY = contRect.height / 2 - rowH / 2 - toIndex * rowH;
        if (animate) {
          gsap.to(trackRef.current, {
            y: targetY,
            duration: (durations.change ?? 0.7) * 0.9,
            ease: "power3.out",
          });
        } else {
          gsap.set(trackRef.current, { y: targetY });
        }
      };

      measureRAF(() => {
        measureRAF(() => {
          centerTrack(leftTrackRef.current, leftItemRefs.current, leftTrackRef);
          centerTrack(rightTrackRef.current, rightItemRefs.current, rightTrackRef);
        });
      });
    };

    const measureRAF = (fn: () => void) => {
      if (typeof window === "undefined") return;
      requestAnimationFrame(() => requestAnimationFrame(fn));
    };

    useLayoutEffect(() => {
      if (typeof window === "undefined") return;
      const fixed = fixedRef.current;
      const fs = fixedSectionRef.current;
      if (!fixed || !fs || total === 0) return;

      gsap.set(bgRefs.current, { opacity: 0, scale: 1.04, yPercent: 0 });
      if (bgRefs.current[0]) gsap.set(bgRefs.current[0], { opacity: 1, scale: 1 });

      wordRefs.current.forEach((words, sIdx) => {
        words.forEach((w) => {
          gsap.set(w, {
            yPercent: sIdx === index ? 0 : 100,
            opacity: sIdx === index ? 1 : 0,
          });
        });
      });

      descriptionRefs.current.forEach((el, i) => {
        if (el) gsap.set(el, { opacity: i === index ? 1 : 0, y: i === index ? 0 : 12 });
      });

      computePositions();
      measureAndCenterLists(index, false);

      const st = ScrollTrigger.create({
        trigger: fs,
        start: "top top",
        end: "bottom bottom",
        pin: fixed,
        pinSpacing: true,
        onUpdate: (self) => {
          if (motionOff || isSnappingRef.current) return;
          const prog = self.progress;
          const target = Math.min(total - 1, Math.floor(prog * total));
          if (target !== lastIndexRef.current && !isAnimatingRef.current) {
            const next = lastIndexRef.current + (target > lastIndexRef.current ? 1 : -1);
            goTo(next, false);
          }
          if (progressFillRef.current) {
            const p = (lastIndexRef.current / (total - 1 || 1)) * 100;
            progressFillRef.current.style.width = `${p}%`;
          }
        },
      });

      stRef.current = st;

      if (initialIndex && initialIndex > 0 && initialIndex < total) {
        requestAnimationFrame(() => goTo(initialIndex, false));
      }

      const ro = new ResizeObserver(() => {
        computePositions();
        measureAndCenterLists(lastIndexRef.current, false);
        ScrollTrigger.refresh();
      });
      ro.observe(fs);

      return () => {
        ro.disconnect();
        st.kill();
        stRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [total, initialIndex, motionOff, bgTransition, parallaxAmount]);

    const changeSection = (to: number) => {
      if (to === lastIndexRef.current || isAnimatingRef.current) return;
      const from = lastIndexRef.current;
      const down = to > from;
      isAnimatingRef.current = true;

      if (!isControlled) setLocalIndex(to);
      onIndexChange?.(to);

      if (currentNumberRef.current) {
        currentNumberRef.current.textContent = String(to + 1).padStart(2, "0");
      }
      if (progressFillRef.current) {
        const p = (to / (total - 1 || 1)) * 100;
        progressFillRef.current.style.width = `${p}%`;
      }

      const D = durations.change ?? 0.7;

      // Title word animation
      const outWords = wordRefs.current[from] || [];
      const inWords = wordRefs.current[to] || [];
      if (outWords.length) {
        gsap.to(outWords, {
          yPercent: down ? -100 : 100,
          opacity: 0,
          duration: D * 0.6,
          stagger: down ? 0.03 : -0.03,
          ease: "power3.out",
        });
      }
      if (inWords.length) {
        gsap.set(inWords, { yPercent: down ? 100 : -100, opacity: 0 });
        gsap.to(inWords, {
          yPercent: 0,
          opacity: 1,
          duration: D,
          stagger: down ? 0.05 : -0.05,
          ease: "power3.out",
        });
      }

      // Description animation
      const outDesc = descriptionRefs.current[from];
      const inDesc = descriptionRefs.current[to];
      if (outDesc) {
        gsap.to(outDesc, { opacity: 0, y: down ? -8 : 8, duration: D * 0.45, ease: "power3.out" });
      }
      if (inDesc) {
        gsap.set(inDesc, { opacity: 0, y: down ? 10 : -10 });
        gsap.to(inDesc, { opacity: 1, y: 0, duration: D, delay: D * 0.35, ease: "power3.out" });
      }

      // Backgrounds
      const prevBg = bgRefs.current[from];
      const newBg = bgRefs.current[to];
      if (bgTransition === "fade") {
        if (newBg) {
          gsap.set(newBg, { opacity: 0, scale: 1.04, yPercent: down ? 1 : -1 });
          gsap.to(newBg, { opacity: 1, scale: 1, yPercent: 0, duration: D, ease: "power2.out" });
        }
        if (prevBg) {
          gsap.to(prevBg, {
            opacity: 0,
            yPercent: down ? -parallaxAmount : parallaxAmount,
            duration: D,
            ease: "power2.out",
          });
        }
      } else {
        if (newBg) {
          gsap.set(newBg, {
            opacity: 1,
            clipPath: down ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
            scale: 1,
            yPercent: 0,
          });
          gsap.to(newBg, { clipPath: "inset(0 0 0 0)", duration: D, ease: "power3.out" });
        }
        if (prevBg) {
          gsap.to(prevBg, { opacity: 0, duration: D * 0.8, ease: "power2.out" });
        }
      }

      // Side list animations
      measureAndCenterLists(to, true);

      leftItemRefs.current.forEach((el, i) => {
        el.classList.toggle("active", i === to);
        gsap.to(el, {
          opacity: i === to ? 1 : 0.35,
          x: i === to ? 10 : 0,
          duration: D * 0.6,
          ease: "power3.out",
        });
      });
      rightItemRefs.current.forEach((el, i) => {
        el.classList.toggle("active", i === to);
        gsap.to(el, {
          opacity: i === to ? 1 : 0.35,
          x: i === to ? -10 : 0,
          duration: D * 0.6,
          ease: "power3.out",
        });
      });

      gsap.delayedCall(D, () => {
        lastIndexRef.current = to;
        isAnimatingRef.current = false;
      });
    };

    const goTo = (to: number, withScroll = true) => {
      const clamped = clamp(to, 0, total - 1);
      isSnappingRef.current = true;
      changeSection(clamped);

      const pos = sectionTopRef.current[clamped];
      const snapMs = durations.snap ?? 800;

      if (withScroll && typeof window !== "undefined") {
        window.scrollTo({ top: pos, behavior: "smooth" });
        setTimeout(() => (isSnappingRef.current = false), snapMs);
      } else {
        setTimeout(() => (isSnappingRef.current = false), 10);
      }
    };

    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    useImperativeHandle(apiRef, () => ({
      next,
      prev,
      goTo,
      getIndex: () => index,
      refresh: () => ScrollTrigger.refresh(),
    }));

    const handleJump = (i: number) => goTo(i);
    const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleJump(i);
      }
    };

    const handleLoadedStagger = () => {
      leftItemRefs.current.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.5, delay: i * 0.06, ease: "power3.out" }
        );
      });
      rightItemRefs.current.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.5, delay: 0.2 + i * 0.06, ease: "power3.out" }
        );
      });
    };

    useEffect(() => {
      handleLoadedStagger();
      measureAndCenterLists(index, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cssVars: CSSProperties = {
      ["--fx-font" as any]: fontFamily,
      ["--fx-text" as any]: colors.text ?? "rgba(245,245,245,0.92)",
      ["--fx-overlay" as any]: colors.overlay ?? "rgba(0,0,0,0.35)",
      ["--fx-page-bg" as any]: colors.pageBg ?? "#fff",
      ["--fx-stage-bg" as any]: colors.stageBg ?? "#000",
      ["--fx-gap" as any]: `${gap}rem`,
      ["--fx-grid-px" as any]: `${gridPaddingX}rem`,
      ["--fx-row-gap" as any]: "10px",
    };

    return (
      <div
        ref={(node) => {
          (rootRef as any).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
        }}
        className={["fx", className].filter(Boolean).join(" ")}
        style={{ ...cssVars, ...style }}
        aria-label={ariaLabel}
      >
        {debug && <div className="fx-debug">Section: {index}</div>}

        <div className="fx-scroll">
          <div className="fx-fixed-section" ref={fixedSectionRef}>
            <div className="fx-fixed" ref={fixedRef}>
              {/* Backgrounds */}
              <div className="fx-bgs" aria-hidden="true">
                {sections.map((s, i) => (
                  <div className="fx-bg" key={s.id ?? i}>
                    {s.renderBackground ? (
                      s.renderBackground(index === i, lastIndexRef.current === i)
                    ) : (
                      <>
                        <img
                          ref={(el) => { if (el) bgRefs.current[i] = el; }}
                          src={s.background}
                          alt=""
                          className="fx-bg-img"
                          loading={i === 0 ? "eager" : "lazy"}
                        />
                        <div className="fx-bg-overlay" />
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="fx-grid">
                {/* Header */}
                {header && <div className="fx-header">{header}</div>}

                {/* Content */}
                <div className="fx-content">
                  {/* Left track */}
                  <div className="fx-left" role="list">
                    {columnHeaders?.left && (
                      <div className="fx-col-header fx-col-header-left">{columnHeaders.left}</div>
                    )}
                    <div className="fx-track" ref={leftTrackRef}>
                      {sections.map((s, i) => (
                        <div
                          key={`L-${s.id ?? i}`}
                          className={`fx-item fx-left-item ${i === index ? "active" : ""}`}
                          ref={(el) => { if (el) leftItemRefs.current[i] = el; }}
                          onClick={() => handleJump(i)}
                          onKeyDown={(e) => handleKeyDown(e, i)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={i === index}
                        >
                          {s.leftLabel}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Center */}
                  <div className="fx-center">
                    {sections.map((s, sIdx) => {
                      tempWordBucket.current = [];
                      const isString = typeof s.title === "string";
                      return (
                        <div
                          key={`C-${s.id ?? sIdx}`}
                          className={`fx-featured ${sIdx === index ? "active" : ""}`}
                        >
                          {/* Mobile: period · ethos metadata row */}
                          <div className="fx-mobile-meta">
                            {s.leftLabel && (
                              <span className="fx-mobile-label">{s.leftLabel}</span>
                            )}
                            {s.leftLabel && s.rightLabel && (
                              <span className="fx-mobile-sep" aria-hidden="true">·</span>
                            )}
                            {s.rightLabel && (
                              <span className="fx-mobile-label">{s.rightLabel}</span>
                            )}
                          </div>

                          <h3 className="fx-featured-title">
                            {isString ? splitWords(s.title as string) : s.title}
                          </h3>

                          {s.description && (
                            <p
                              className="fx-description"
                              ref={(el) => { if (el) descriptionRefs.current[sIdx] = el; }}
                            >
                              {s.description}
                            </p>
                          )}

                          <WordsCollector
                            onReady={() => {
                              if (tempWordBucket.current.length) {
                                wordRefs.current[sIdx] = [...tempWordBucket.current];
                              }
                              tempWordBucket.current = [];
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right track */}
                  <div className="fx-right" role="list">
                    {columnHeaders?.right && (
                      <div className="fx-col-header fx-col-header-right">{columnHeaders.right}</div>
                    )}
                    <div className="fx-track" ref={rightTrackRef}>
                      {sections.map((s, i) => (
                        <div
                          key={`R-${s.id ?? i}`}
                          className={`fx-item fx-right-item ${i === index ? "active" : ""}`}
                          ref={(el) => { if (el) rightItemRefs.current[i] = el; }}
                          onClick={() => handleJump(i)}
                          onKeyDown={(e) => handleKeyDown(e, i)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={i === index}
                        >
                          {s.rightLabel}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="fx-footer">
                  {footer && <div className="fx-footer-title">{footer}</div>}
                  {showProgress && (
                    <div className="fx-progress">
                      <div className="fx-progress-numbers">
                        <span ref={currentNumberRef}>{String(index + 1).padStart(2, "0")}</span>
                        <span>{String(total).padStart(2, "0")}</span>
                      </div>
                      <div className="fx-progress-bar">
                        <div className="fx-progress-fill" ref={progressFillRef} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          /* ── Base ── */
          .fx {
            width: 100%;
            overflow: hidden;
            background: var(--fx-page-bg);
            font-family: var(--fx-font);
            letter-spacing: -0.02em;
          }

          .fx-debug {
            position: fixed; bottom: 10px; right: 10px; z-index: 9999;
            background: rgba(255,255,255,0.85); color: #000;
            padding: 6px 8px; font: 12px/1 monospace;
          }

          /* ── Scroll structure ── */
          .fx-fixed-section { height: ${Math.max(1, total) * sectionHeightVh}vh; position: relative; }
          .fx-fixed { position: sticky; top: 0; height: 100vh; width: 100%; overflow: hidden; background: var(--fx-page-bg); }

          /* ── Grid ── */
          .fx-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: var(--fx-gap);
            padding: 0 var(--fx-grid-px);
            position: relative;
            height: 100%;
            z-index: 2;
          }

          /* ── Backgrounds ── */
          .fx-bgs { position: absolute; inset: 0; background: var(--fx-stage-bg); z-index: 1; }
          .fx-bg  { position: absolute; inset: 0; }
          .fx-bg-img {
            position: absolute; inset: -10% 0 -10% 0;
            width: 100%; height: 120%; object-fit: cover;
            filter: brightness(0.8);
            opacity: 0;
            will-change: transform, opacity;
          }
          .fx-bg-overlay { position: absolute; inset: 0; background: var(--fx-overlay); }

          /* ── Header ── */
          .fx-header {
            grid-column: 1 / 13;
            align-self: start;
            padding-top: 6vh;
            text-align: center;
            color: var(--fx-text);
          }
          .fx-header > * { display: block; }

          /* ── Content (3-col) ── */
          .fx-content {
            grid-column: 1 / 13;
            position: absolute; inset: 0;
            display: grid;
            grid-template-columns: 1fr 1.4fr 1fr;
            align-items: center;
            height: 100%;
            padding: 0 var(--fx-grid-px);
          }

          /* ── Side tracks ── */
          .fx-left, .fx-right {
            height: 60vh;
            overflow: hidden;
            display: grid;
            align-content: center;
            position: relative;
          }
          .fx-left { justify-items: start; }
          .fx-right { justify-items: end; }
          .fx-track { will-change: transform; }

          /* ── Column headers ── */
          .fx-col-header {
            position: absolute;
            top: 5vh;
            font-size: 0.52rem;
            font-weight: 800;
            letter-spacing: 0.38em;
            text-transform: uppercase;
            color: var(--fx-text);
            opacity: 0.28;
          }
          .fx-col-header-left  { left: 0; }
          .fx-col-header-right { right: 0; }

          /* ── List items ── */
          .fx-item {
            color: var(--fx-text);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            line-height: 1;
            margin: calc(var(--fx-row-gap) / 2) 0;
            opacity: 0.35;
            position: relative;
            font-size: clamp(0.9rem, 2.2vw, 1.7rem);
            user-select: none;
            cursor: pointer;
            outline: none;
          }
          .fx-item:focus-visible {
            outline: 1px solid var(--fx-text);
            outline-offset: 4px;
          }
          .fx-left-item.active { opacity: 1; transform: translateX(10px); padding-left: 16px; }
          .fx-right-item.active { opacity: 1; transform: translateX(-10px); padding-right: 16px; }

          .fx-left-item.active::before,
          .fx-right-item.active::after {
            content: "";
            position: absolute; top: 50%; transform: translateY(-50%);
            width: 5px; height: 5px; background: var(--fx-text); border-radius: 50%;
          }
          .fx-left-item.active::before { left: 0; }
          .fx-right-item.active::after  { right: 0; }

          /* ── Center column ── */
          .fx-center {
            position: relative;
            display: grid;
            place-items: center;
            text-align: center;
            height: 60vh;
            overflow: visible;
          }
          .fx-featured {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            padding: 0 1rem;
          }
          .fx-featured.active { opacity: 1; visibility: visible; }

          .fx-featured-title {
            margin: 0;
            color: var(--fx-text);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.01em;
            font-size: clamp(2rem, 7vw, 5.5rem);
            line-height: 1;
          }
          .fx-word-mask { display: inline-block; overflow: hidden; vertical-align: middle; }
          .fx-word      { display: inline-block; vertical-align: middle; }

          /* ── Description ── */
          .fx-description {
            margin-top: 1.4rem;
            font-size: clamp(0.72rem, 1.3vw, 0.87rem);
            font-weight: 400;
            line-height: 1.7;
            letter-spacing: 0.015em;
            text-transform: none;
            color: var(--fx-text);
            opacity: 0.52;
            max-width: 36ch;
            text-align: center;
          }

          /* ── Mobile metadata (period · ethos) — desktop: hidden ── */
          .fx-mobile-meta { display: none; }

          /* ── Footer ── */
          .fx-footer {
            grid-column: 1 / 13;
            align-self: end;
            padding-bottom: 5vh;
            text-align: center;
          }
          .fx-footer-title {
            color: var(--fx-text);
            font-size: clamp(1.6rem, 7vw, 7rem);
            font-weight: 900;
            letter-spacing: -0.01em;
            line-height: 0.9;
          }

          /* ── Progress ── */
          .fx-progress { width: 220px; margin: 1.4rem auto 0; }
          .fx-progress-numbers {
            display: flex;
            justify-content: space-between;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--fx-text);
            opacity: 0.4;
            margin-bottom: 0.45rem;
          }
          .fx-progress-bar  { height: 1px; background: rgba(245,245,245,0.15); position: relative; }
          .fx-progress-fill { position: absolute; inset: 0 auto 0 0; width: 0%; background: var(--fx-text); transition: width 0.35s ease; }

          /* ── Tablet: 640–1023px — keep 3-col, compress ── */
          @media (min-width: 640px) and (max-width: 1023px) {
            .fx-content { grid-template-columns: 0.65fr 1.7fr 0.65fr; }
            .fx-item { font-size: clamp(0.72rem, 1.6vw, 1rem); }
            .fx-featured-title { font-size: clamp(1.6rem, 5.5vw, 3.5rem); }
            .fx-description { font-size: clamp(0.68rem, 1.1vw, 0.8rem); max-width: 30ch; }
            .fx-left, .fx-right { height: 55vh; }
            .fx-center { height: 55vh; }
          }

          /* ── Mobile: <640px — compressed 3-column ── */
          @media (max-width: 639px) {
            .fx-content { grid-template-columns: 0.55fr 1.9fr 0.55fr; padding: 0 0.75rem; }
            .fx-left, .fx-right { height: 55vh; }
            .fx-center { height: 55vh; }

            .fx-item { font-size: clamp(0.5rem, 2.8vw, 0.7rem); letter-spacing: 0; }
            .fx-left-item.active  { transform: translateX(5px); padding-left: 10px; }
            .fx-right-item.active { transform: translateX(-5px); padding-right: 10px; }

            .fx-left-item.active::before,
            .fx-right-item.active::after { width: 4px; height: 4px; }

            .fx-featured-title { font-size: clamp(1.6rem, 9vw, 2.8rem); }
            .fx-description {
              font-size: 0.68rem;
              max-width: 22ch;
              margin-top: 0.9rem;
              line-height: 1.55;
            }
            .fx-col-header { font-size: 0.42rem; letter-spacing: 0.25em; top: 3.5vh; }
            .fx-footer { padding-bottom: 3vh; }
            .fx-progress { width: 130px; }
            .fx-progress-numbers { font-size: 0.58rem; }
          }
        `}</style>
      </div>
    );
  }
);

FullScreenScrollFX.displayName = "FullScreenScrollFX";
