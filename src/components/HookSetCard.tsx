"use client";

import { CaretRight, Lightning, CheckCircle } from "@phosphor-icons/react";
import type { HookSet } from "@/lib/types";

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
};

/**
 * A visually distinct card for hook sets.
 * Uses a dashed border + subtle gradient to look different from solid post cards.
 */
export default function HookSetCard({
  hookSet,
  onClick,
  variant = "pending",
}: {
  hookSet: HookSet;
  onClick: () => void;
  variant?: "pending" | "reviewed";
}) {
  const color = PLATFORM_COLORS[hookSet.platform];
  const approvedCount = hookSet.review?.approved_hook_ids.length || 0;
  const isPending = variant === "pending";

  return (
    <button
      onClick={onClick}
      className={`card-enter w-full text-left group transition-colors duration-100 ${
        isPending
          ? "border border-dashed border-yellow-400/40 bg-yellow-400/[0.03] hover:bg-yellow-400/[0.06] p-3"
          : "border border-dashed border-green-400/30 bg-green-400/[0.02] hover:bg-green-400/[0.04] p-3"
      }`}
    >
      {/* Top row: platform + date + hook count */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border"
          style={{ color, borderColor: color }}
        >
          {hookSet.platform}
        </span>
        <span className="font-mono text-[10px] text-muted tabular-nums">
          {hookSet.date}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {isPending ? (
            <>
              <Lightning size={10} weight="bold" className="text-yellow-400" />
              <span className="font-mono text-[10px] text-yellow-400 tabular-nums">
                {hookSet.hooks.length} hooks
              </span>
            </>
          ) : (
            <>
              <CheckCircle size={10} weight="bold" className="text-green-400" />
              <span className="font-mono text-[10px] text-green-400 tabular-nums">
                {approvedCount} approved
              </span>
            </>
          )}
        </span>
      </div>

      {/* Bottom row: pillar + CTA */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-foreground-secondary truncate flex-1">
          {hookSet.pillar}
        </span>
        <span className={`font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-colors duration-100 ${
          isPending
            ? "text-yellow-400/60 group-hover:text-yellow-400"
            : "text-green-400/60 group-hover:text-green-400"
        }`}>
          {isPending ? "Review" : "Write Posts"}
          <CaretRight size={10} weight="bold" />
        </span>
      </div>
    </button>
  );
}
