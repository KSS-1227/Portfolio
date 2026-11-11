"use client";

import { useReducedMotion } from "./MotionProvider";
import { Sparkles, EyeOff } from "lucide-react";

export function ReducedMotionToggle({ compact = false }: { compact?: boolean }) {
  const { reducedMotion, toggleReducedMotion } = useReducedMotion();

  return (
    <button
      onClick={toggleReducedMotion}
      type="button"
      aria-label={reducedMotion ? "Enable animations" : "Reduce animations"}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all text-zinc-400 hover:text-zinc-200"
      title={reducedMotion ? "Animations reduced (Click to enable)" : "Animations enabled (Click to reduce)"}
    >
      {reducedMotion ? (
        <>
          <EyeOff className="w-3 h-3 text-amber-400" />
          {!compact && <span>Motion: Off</span>}
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-emerald-400" />
          {!compact && <span>Motion: On</span>}
        </>
      )}
    </button>
  );
}
