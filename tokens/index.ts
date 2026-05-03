/**
 * Wajina International Schools — Design Token System
 * Source of truth: ./design-tokens.json
 *
 * Import pattern:
 *   import { tokens, motionEasing, motionDuration } from '@/tokens';
 *
 * Motion variants pattern:
 *   transition={{ ease: motionEasing.brand, duration: motionDuration.base }}
 */

import rawTokens from './design-tokens.json';

// ─── Primitive types ──────────────────────────────────────────────────────────

/** Four-point cubic-bezier tuple, compatible with Motion's `ease` prop. */
export type CubicBezier = [number, number, number, number];

export interface DesignToken<T = string> {
  value: T;
  description: string;
}

export interface FluidFontSizeToken extends DesignToken<string> {
  min: string;
  max: string;
}

export interface EasingToken {
  value: CubicBezier;
  cssValue: string;
  description: string;
}

export interface DurationToken {
  value: number;
  unit: 'ms';
  description: string;
}

// ─── Color types ──────────────────────────────────────────────────────────────

export interface BrandColors {
  primary:   DesignToken;
  secondary: DesignToken;
  accent:    DesignToken;
  tertiary:  DesignToken;
  surface:   DesignToken;
}

export interface SemanticColors {
  success: DesignToken;
  error:   DesignToken;
  blush:   DesignToken;
}

export interface CinematicColors {
  ink:      DesignToken;
  deep:     DesignToken;
  surface:  DesignToken;
  surface2: DesignToken;
  bone:     DesignToken;
  cream:    DesignToken;
  haze:     DesignToken;
  moss:     DesignToken;
  mossGlow: DesignToken;
  mossDeep: DesignToken;
  tang:     DesignToken;
  tangGlow: DesignToken;
  blue:     DesignToken;
  dim:      DesignToken;
  dim2:     DesignToken;
}

export interface SurfaceColors {
  foreground: DesignToken;
  background: DesignToken;
  border:     DesignToken;
}

export interface ColorTokens {
  brand:     BrandColors;
  semantic:  SemanticColors;
  cinematic: CinematicColors;
  surface:   SurfaceColors;
}

// ─── Typography types ─────────────────────────────────────────────────────────

export interface ContainerFontSizes {
  xs:   FluidFontSizeToken;
  sm:   FluidFontSizeToken;
  base: FluidFontSizeToken;
  h4:   FluidFontSizeToken;
  h3:   FluidFontSizeToken;
  h2:   FluidFontSizeToken;
  h1:   FluidFontSizeToken;
}

export interface GlobalFontSizes {
  h1:      FluidFontSizeToken;
  display: FluidFontSizeToken;
}

export interface TypographyTokens {
  fontFamily: {
    display: DesignToken;
    sans:    DesignToken;
    serif:   DesignToken;
  };
  fontSize: {
    /** Use inside @container-aware components. Preferred value uses `cqi`. */
    container: ContainerFontSizes;
    /** Use at :root / hero scope with no parent container. Preferred value uses `svw`. */
    global: GlobalFontSizes;
  };
  fontWeight: {
    light:   DesignToken<number>;
    regular: DesignToken<number>;
    medium:  DesignToken<number>;
    bold:    DesignToken<number>;
    black:   DesignToken<number>;
  };
  letterSpacing: {
    tight:   DesignToken;
    normal:  DesignToken;
    wide:    DesignToken;
    wider:   DesignToken;
    widest:  DesignToken;
  };
  lineHeight: {
    none:    DesignToken<number>;
    tight:   DesignToken<number>;
    snug:    DesignToken<number>;
    normal:  DesignToken<number>;
    relaxed: DesignToken<number>;
  };
}

// ─── Spacing / radius / shadow types ─────────────────────────────────────────

export type SpacingScale = Record<
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24',
  DesignToken
>;

export interface BorderRadiusTokens {
  none: DesignToken;
  sm:   DesignToken;
  base: DesignToken;
  md:   DesignToken;
  lg:   DesignToken;
  xl:   DesignToken;
  '2xl': DesignToken;
  '3xl': DesignToken;
  card: DesignToken;
  full: DesignToken;
}

export interface ShadowTokens {
  soft:     DesignToken;
  card:     DesignToken;
  prestige: DesignToken;
  premium:  DesignToken;
}

// ─── Motion types ─────────────────────────────────────────────────────────────

export interface MotionTokens {
  easing: {
    brand:     EasingToken;
    easeOut:   EasingToken;
    easeIn:    EasingToken;
    easeInOut: EasingToken;
  };
  duration: {
    instant:   DurationToken;
    fast:      DurationToken;
    base:      DurationToken;
    moderate:  DurationToken;
    slow:      DurationToken;
    cinematic: DurationToken;
  };
}

// ─── Root token interface ─────────────────────────────────────────────────────

export interface DesignTokens {
  meta: {
    project:          string;
    version:          string;
    typographicScale: string;
    ratio:            number;
    wcagCompliance:   string;
    maintainer:       string;
  };
  color:        ColorTokens;
  typography:   TypographyTokens;
  spacing:      SpacingScale;
  borderRadius: BorderRadiusTokens;
  shadow:       ShadowTokens;
  motion:       MotionTokens;
}

// ─── Typed export ─────────────────────────────────────────────────────────────

export const tokens = rawTokens as unknown as DesignTokens;

// ─── Motion helpers ───────────────────────────────────────────────────────────

/**
 * Easing curves typed as `CubicBezier` tuples, ready for Motion's `ease` prop.
 *
 * @example
 * <motion.div transition={{ ease: motionEasing.brand, duration: motionDuration.base }} />
 */
export const motionEasing = {
  brand:     rawTokens.motion.easing.brand.value     as CubicBezier,
  easeOut:   rawTokens.motion.easing.easeOut.value   as CubicBezier,
  easeIn:    rawTokens.motion.easing.easeIn.value     as CubicBezier,
  easeInOut: rawTokens.motion.easing.easeInOut.value as CubicBezier,
} as const;

/**
 * Duration values converted from ms → seconds for Motion's `transition.duration` prop.
 *
 * @example
 * transition={{ duration: motionDuration.base }}   // 0.3
 * transition={{ duration: motionDuration.slow }}   // 0.7
 */
export const motionDuration = {
  instant:   rawTokens.motion.duration.instant.value   / 1000,
  fast:      rawTokens.motion.duration.fast.value       / 1000,
  base:      rawTokens.motion.duration.base.value       / 1000,
  moderate:  rawTokens.motion.duration.moderate.value  / 1000,
  slow:      rawTokens.motion.duration.slow.value       / 1000,
  cinematic: rawTokens.motion.duration.cinematic.value / 1000,
} as const;

/**
 * Brand color hex values, extracted for direct use in inline styles or
 * Motion's `animate` prop where CSS variables are not available.
 *
 * Prefer CSS custom properties in stylesheets. Use this only when a
 * JS-side value is strictly required (e.g. canvas, WebGL, chart libraries).
 */
export const brandColors = {
  primary:   rawTokens.color.brand.primary.value,
  secondary: rawTokens.color.brand.secondary.value,
  accent:    rawTokens.color.brand.accent.value,
  tertiary:  rawTokens.color.brand.tertiary.value,
  surface:   rawTokens.color.brand.surface.value,
} as const;

export type BrandColorKey = keyof typeof brandColors;
