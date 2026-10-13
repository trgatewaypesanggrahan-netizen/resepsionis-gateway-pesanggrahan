import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import SignaturePadLib from 'signature_pad';
import { RotateCcw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignaturePadProps {
  label?: string;
  required?: boolean;
  onChange?: (dataUrl: string | null) => void;
  height?: number;
  penColor?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({
  label = 'Tanda Tangan Digital',
  required = true,
  onChange,
  height = 160,
  penColor = '#0f172a'
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resize canvas according to device pixel ratio
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !padRef.current) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = container.getBoundingClientRect();
    const data = padRef.current.toData(); // preserve strokes

    canvas.width = rect.width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    padRef.current.clear();
    if (data && data.length > 0) {
      padRef.current.fromData(data);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLib(canvas, {
      penColor: penColor,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      minWidth: 1.5,
      maxWidth: 3.5,
      throttle: 8,
    });

    padRef.current = pad;
    resizeCanvas();

    const handleEndStroke = () => {
      const empty = pad.isEmpty();
      setHasDrawn(!empty);
      if (empty) {
        onChange?.(null);
      } else {
        onChange?.(pad.toDataURL('image/png'));
        setErrorMsg(null);
      }
    };

    pad.addEventListener('endStroke', handleEndStroke);

    const ro = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      ro.disconnect();
      pad.off();
    };
  }, [height, penColor]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (padRef.current) {
        padRef.current.clear();
        setHasDrawn(false);
        onChange?.(null);
      }
    },
    isEmpty: () => {
      return padRef.current ? padRef.current.isEmpty() : true;
    },
    toDataURL: () => {
      if (!padRef.current || padRef.current.isEmpty()) return '';
      return padRef.current.toDataURL('image/png');
    }
  }));

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
      setHasDrawn(false);
      onChange?.(null);
    }
  };

  const handleUndo = () => {
    if (!padRef.current) return;
    const data = padRef.current.toData();
    if (data && data.length > 0) {
      data.pop(); // remove last stroke
      padRef.current.fromData(data);
      const empty = padRef.current.isEmpty();
      setHasDrawn(!empty);
      onChange?.(empty ? null : padRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!hasDrawn}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasDrawn}
            className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full rounded-xl border-2 transition-all duration-200 overflow-hidden bg-slate-50/70 ${
          hasDrawn
            ? 'border-emerald-500/80 bg-white ring-2 ring-emerald-500/10'
            : errorMsg
            ? 'border-rose-400 bg-rose-50/30'
            : 'border-dashed border-slate-300 hover:border-slate-400 bg-white'
        }`}
        style={{ minHeight: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair block"
        />

        {/* Guideline line for signature */}
        <div className="pointer-events-none absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
          <span>Tanda tangani di area ini (Gunakan Jari / Stylus / Mouse)</span>
          <span className="hidden sm:inline">Gateway Pesanggrahan</span>
        </div>

        {/* Drawn feedback badge */}
        {hasDrawn && (
          <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tanda tangan terisi</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMsg}
        </p>
      )}
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';
