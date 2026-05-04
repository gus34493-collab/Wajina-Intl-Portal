"use client";

/**
 * Modern implementation of the legacy Wajina Telemetry system.
 * This ensures that legacy code calling window.Wajina.Telemetry.log()
 * still works, while providing a modern Next.js interface.
 */

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  component: string;
  message: string;
  stack?: string | null;
  url: string;
  userAgent: string;
}

const LOG_ENDPOINT = '/api/audit/logs';
const BATCH_INTERVAL = 5000;
let logQueue: LogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const flush = async () => {
  if (logQueue.length === 0) return;

  const payload = [...logQueue];
  logQueue = [];
  flushTimeout = null;

  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: payload }),
      keepalive: true,
    });
  } catch (e) {
    console.warn("[Telemetry] Sync failed", e);
  }
};

export const telemetry = {
  log: (level: string, component: string, details: any) => {
    if (typeof window === "undefined") return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase() as any,
      component: component,
      message: details instanceof Error ? details.message : String(details),
      stack: details instanceof Error ? details.stack : null,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Deduplicate in current batch
    const isDuplicate = logQueue.some(
      (q) => q.message === entry.message && q.component === entry.component
    );
    
    if (!isDuplicate) {
      logQueue.push(entry);
    }

    if (!flushTimeout) {
      flushTimeout = setTimeout(flush, BATCH_INTERVAL);
    }
  },
};

// Initialize on window if in browser context
if (typeof window !== "undefined") {
  (window as any).Wajina = (window as any).Wajina || {};
  (window as any).Wajina.Telemetry = telemetry;
}
