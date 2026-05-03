"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GridBoxProps {
  children: React.ReactNode;
  colSpan?: string; // e.g., "col-span-12", "md:col-span-6"
  rowSpan?: string; // e.g., "row-span-1"
  className?: string;
  id?: string;
}

/**
 * Wajina Academy GridBox
 * Standardized container for all landing page elements.
 */
export default function GridBox({ 
  children, 
  colSpan = "col-span-12", 
  rowSpan = "row-auto",
  className,
  id 
}: GridBoxProps) {
  // We can add a subtle scale factor here if width is very small
  // But for now, we'll stick to the fluid typography which handles 90% of the scaling.
  
  return (
    <div 
      id={id}
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        colSpan,
        rowSpan,
        className
      )}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}

