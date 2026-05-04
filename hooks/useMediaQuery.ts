"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect media query matches.
 * Usage: const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial state
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Define listener for changes
    const listener = () => setMatches(media.matches);
    
    // Support both modern and legacy listener attachment
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

/**
 * Pre-defined breakpoint hooks for convenience
 */
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () => useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsGalaxyA51 = () => useMediaQuery("(max-width: 412px)");
