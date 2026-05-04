"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, CheckCircle, PenTool } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
}

export function SignatureCanvas({ onSave, onCancel }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#20373B"; // brand-gunmetal
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasContent(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas && hasContent) {
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative aspect-[2/1] w-full border-2 border-dashed border-brand-moonstone/20 rounded-2xl bg-white/50 backdrop-blur-sm overflow-hidden touch-none group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
        <div className="absolute top-4 right-4 text-[10px] font-black text-brand-moonstone/30 uppercase tracking-widest pointer-events-none group-hover:opacity-0 transition-opacity">
          Institutional Blank Canvas
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="rounded-xl px-4 border-brand-moonstone/10 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="rounded-xl px-4 text-text-muted"
          >
            Cancel
          </Button>
        </div>

        <Button
          size="sm"
          disabled={!hasContent}
          onClick={handleSave}
          className="bg-brand-gunmetal hover:bg-brand-gunmetal/90 text-white rounded-xl px-6 font-bold shadow-lg shadow-brand-gunmetal/20 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Apply Identity Seal
        </Button>
      </div>
    </div>
  );
}
