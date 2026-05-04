"use client";

import { useEffect } from "react";
import { telemetry } from "@/lib/telemetry";
import "@/lib/sanitizer";

export default function TelemetryInit() {
  useEffect(() => {
    // This effect ensures the library is initialized on the client.
    // The lib/telemetry.ts file itself attaches to window.
    console.log("[Wajina] Telemetry initialized.");
  }, []);

  return null;
}

