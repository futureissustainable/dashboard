"use client";

import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import type { Hook } from "@/lib/types";

const LEVER_COLORS: Record<string, string> = {
  "cost savings": "#22c55e",
  "modernity contradiction": "#a855f7",
  "time value": "#f59e0b",
  "health/indoor environment": "#ef4444",
  "social comparison": "#3b82f6",
  "material purity": "#10b981",
  "lifetime cost": "#f97316",
  "sleep/performance": "#8b5cf6",
  "parental fear": "#ec4899",
  "industry failure": "#6366f1",
  "humor/absurdity": "#fbbf24",
  "regulation/compliance": "#64748b",
  "investment/roi": "#14b8a6",
};

function getLeverColor(lever: string): string {
  const key = lever.toLowerCase();
  for (const [k, v] of Object.entries(LEVER_COLORS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return "#666666";
}

export default function HookCard({
  hook,
  selected,
  score,
  feedbackText,
  onToggleSelect,
  onScoreChange,
  onFeedbackChange,
}: {
  hook: Hook;
  selected: boolean;
  score: number;
  feedbackText: string;
  onToggleSelect: (id: string) => void;
  onScoreChange: (id: string, score: number) => void;
  onFeedbackChange: (id: string, feedback: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const leverColor = getLeverColor(hook.psychological_lever);

  return (
    <div
      className={`border bg-surface p-3 sm:p-4 transition-colors duration-100 ${
        selected ? "border-green-400/60" : "border-border"
      }`}
    >
      {/* Top row: checkbox + hook text */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleSelect(hook.id)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 border flex items-center justify-center transition-colors duration-100 ${
            selected
              ? "border-green-400 bg-green-400/20 text-green-400"
              : "border-border hover:border-foreground-secondary"
          }`}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground font-medium leading-relaxed">
            &ldquo;{hook.hook_text}&rdquo;
          </p>

          {/* Lever tag + audience */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border"
              style={{ color: leverColor, borderColor: `${leverColor}40` }}
            >
              {hook.psychological_lever}
            </span>
            <span className="text-[11px] text-muted">
              {hook.target_audience}
            </span>
          </div>

          {/* Angle */}
          <p className="text-[11px] text-foreground-secondary mt-1.5 leading-relaxed">
            {hook.angle}
          </p>
        </div>
      </div>

      {/* Expand for differentiation + platform_meta */}
      {expanded && (
        <div className="mt-3 pl-8 space-y-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Differentiation
            </span>
            <p className="text-[11px] text-foreground-secondary mt-0.5">
              {hook.differentiation}
            </p>
          </div>
          {Object.keys(hook.platform_meta).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(hook.platform_meta).map(([k, v]) => (
                <span
                  key={k}
                  className="text-[10px] text-foreground-secondary bg-surface-elevated px-2 py-0.5 font-mono"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom row: expand + score */}
      <div className="flex items-center justify-between mt-3 pl-8">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-100"
        >
          {expanded ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
          {expanded ? "Less" : "More"}
        </button>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => onScoreChange(hook.id, parseInt(e.target.value, 10))}
            className="score-slider w-20"
          />
          <span className="font-mono text-[12px] font-bold tabular-nums w-7 text-right">
            {score}
          </span>
        </div>
      </div>

      {/* Optional feedback textarea (collapsed by default) */}
      <div className="mt-2 pl-8">
        <input
          type="text"
          value={feedbackText}
          onChange={(e) => onFeedbackChange(hook.id, e.target.value)}
          placeholder="Optional feedback on this hook..."
          className="w-full bg-transparent border-b border-border text-[11px] font-mono text-foreground-secondary py-1 focus:border-foreground-secondary transition-colors placeholder:text-muted/50"
        />
      </div>
    </div>
  );
}
