"use client";

import { useState } from "react";
import {
  CaretDown,
  CaretUp,
  CheckCircle,
  CircleNotch,
  Lightning,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { Hook, HookSet, Platform } from "@/lib/types";

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
};

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

/**
 * Inline accordion card for a hook set.
 * Clicking the header expands to show all individual hooks with checkboxes,
 * scores, and submit/write-posts actions — no page navigation needed.
 */
export default function HookSetCard({
  hookSet,
  onSubmitReview,
  onTriggerPhase2,
}: {
  hookSet: HookSet;
  onSubmitReview: (data: {
    platform: string;
    date: string;
    approved_hook_ids: string[];
    hook_feedback: Record<string, { score: number; feedback?: string }>;
  }) => Promise<void>;
  onTriggerPhase2: (platform: Platform, date: string, hookIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const isReviewed = hookSet.status === "reviewed";
  const isPending = !isReviewed;
  const color = PLATFORM_COLORS[hookSet.platform];

  // Review state (local to this card)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (hookSet.review) return new Set(hookSet.review.approved_hook_ids);
    return new Set();
  });
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const h of hookSet.hooks) {
      init[h.id] = hookSet.review?.hook_feedback[h.id]?.score ?? 50;
    }
    return init;
  });
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const h of hookSet.hooks) {
      init[h.id] = hookSet.review?.hook_feedback[h.id]?.feedback ?? "";
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isReviewed);
  const [triggeringPhase2, setTriggeringPhase2] = useState(false);
  const [phase2Triggered, setPhase2Triggered] = useState(false);

  const approvedCount = submitted
    ? (hookSet.review?.approved_hook_ids.length ?? selectedIds.size)
    : selectedIds.size;

  const toggleSelect = (id: string) => {
    if (submitted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    if (selectedIds.size === 0) {
      const confirmed = window.confirm(
        "No hooks selected. No posts will be generated. Continue?"
      );
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const hookFeedback: Record<string, { score: number; feedback?: string }> = {};
      for (const h of hookSet.hooks) {
        const entry: { score: number; feedback?: string } = { score: scores[h.id] };
        if (feedbacks[h.id]?.trim()) entry.feedback = feedbacks[h.id].trim();
        hookFeedback[h.id] = entry;
      }
      await onSubmitReview({
        platform: hookSet.platform,
        date: hookSet.date,
        approved_hook_ids: Array.from(selectedIds),
        hook_feedback: hookFeedback,
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to submit hook review:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWritePosts = async () => {
    if (triggeringPhase2) return;
    setTriggeringPhase2(true);
    try {
      const ids = hookSet.review?.approved_hook_ids ?? Array.from(selectedIds);
      await onTriggerPhase2(hookSet.platform as Platform, hookSet.date, ids);
      setPhase2Triggered(true);
    } catch (e) {
      console.error("Failed to trigger Phase 2:", e);
    } finally {
      setTriggeringPhase2(false);
    }
  };

  return (
    <div
      className={`card-enter transition-colors duration-200 ${
        isPending
          ? "border border-dashed border-yellow-400/40 bg-yellow-400/[0.03]"
          : "border border-dashed border-green-400/30 bg-green-400/[0.02]"
      }`}
    >
      {/* ── Clickable header ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-[var(--space-3)] group"
      >
        {/* Top row */}
        <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-1)]">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border"
            style={{ color, borderColor: color }}
          >
            {hookSet.platform}
          </span>
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {hookSet.date}
          </span>
          <span className="text-[11px] text-foreground-secondary truncate">
            {hookSet.pillar}
          </span>
          <span className="ml-auto flex items-center gap-[var(--space-2)] flex-shrink-0">
            {isPending ? (
              <span className="font-mono text-[11px] text-yellow-400 tabular-nums">
                {hookSet.hooks.length} hooks
              </span>
            ) : (
              <span className="font-mono text-[11px] text-green-400 tabular-nums flex items-center gap-1">
                <CheckCircle size={12} weight="bold" />
                {approvedCount} approved
              </span>
            )}
            {open ? (
              <CaretUp size={12} weight="bold" className="text-muted" />
            ) : (
              <CaretDown size={12} weight="bold" className="text-muted" />
            )}
          </span>
        </div>
      </button>

      {/* ── Accordion body (CSS grid animation) ── */}
      <div className={`accordion-wrapper ${open ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="px-[var(--space-3)] pb-[var(--space-3)] space-y-[var(--space-2)]">
            {/* Instruction text */}
            {isPending && !submitted && (
              <p className="text-[var(--fs-p-sm)] text-muted pb-[var(--space-1)]">
                Select hooks to develop into posts. Score all to train the AI.
              </p>
            )}

            {/* Individual hooks */}
            {hookSet.hooks.map((hook) => (
              <InlineHook
                key={hook.id}
                hook={hook}
                selected={selectedIds.has(hook.id)}
                score={scores[hook.id]}
                feedbackText={feedbacks[hook.id]}
                readOnly={submitted}
                onToggleSelect={toggleSelect}
                onScoreChange={(id, s) => setScores((p) => ({ ...p, [id]: s }))}
                onFeedbackChange={(id, f) => setFeedbacks((p) => ({ ...p, [id]: f }))}
              />
            ))}

            {/* ── Footer: selection count + action buttons ── */}
            <div className="flex items-center justify-between pt-[var(--space-2)] border-t border-border/50">
              <span className="font-mono text-[11px] text-muted tabular-nums">
                {selectedIds.size} selected
              </span>

              <div className="flex items-center gap-[var(--space-2)]">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider border px-[var(--space-4)] py-[var(--space-2)] transition-all duration-200 ${
                      submitting
                        ? "text-muted border-border cursor-not-allowed"
                        : "text-green-400 border-green-400/40 hover:bg-green-400/10 hover:border-green-400"
                    }`}
                  >
                    {submitting ? (
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                    ) : (
                      <PaperPlaneTilt size={14} weight="bold" />
                    )}
                    Submit Review
                  </button>
                ) : (
                  <>
                    <span className="font-mono text-[11px] text-green-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={12} weight="bold" />
                      Reviewed
                    </span>
                    {approvedCount > 0 && !phase2Triggered && (
                      <button
                        onClick={handleWritePosts}
                        disabled={triggeringPhase2}
                        className={`flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider border px-[var(--space-4)] py-[var(--space-2)] transition-all duration-200 ${
                          triggeringPhase2
                            ? "text-muted border-border cursor-not-allowed"
                            : "text-foreground border-foreground/40 hover:bg-foreground/10 hover:border-foreground"
                        }`}
                      >
                        {triggeringPhase2 ? (
                          <CircleNotch size={14} weight="bold" className="animate-spin" />
                        ) : (
                          <Lightning size={14} weight="bold" />
                        )}
                        Write Posts ({approvedCount})
                      </button>
                    )}
                    {phase2Triggered && (
                      <span className="font-mono text-[11px] text-foreground-secondary uppercase tracking-wider">
                        Queued
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single hook row inside the accordion.
 * Compact: checkbox + hook text + lever badge + expandable score/feedback.
 */
function InlineHook({
  hook,
  selected,
  score,
  feedbackText,
  readOnly,
  onToggleSelect,
  onScoreChange,
  onFeedbackChange,
}: {
  hook: Hook;
  selected: boolean;
  score: number;
  feedbackText: string;
  readOnly: boolean;
  onToggleSelect: (id: string) => void;
  onScoreChange: (id: string, score: number) => void;
  onFeedbackChange: (id: string, feedback: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const leverColor = getLeverColor(hook.psychological_lever);

  return (
    <div
      className={`border p-[var(--space-3)] transition-all duration-200 ${
        selected
          ? "border-green-400/50 bg-green-400/[0.04]"
          : "border-border bg-surface"
      }`}
    >
      {/* Row 1: checkbox + hook text */}
      <div className="flex items-start gap-[var(--space-3)]">
        <button
          onClick={() => onToggleSelect(hook.id)}
          disabled={readOnly}
          className={`mt-[2px] flex-shrink-0 w-[var(--space-5)] h-[var(--space-5)] border flex items-center justify-center transition-all duration-200 ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${
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
          <p className="text-[var(--fs-p-sm)] text-foreground leading-relaxed">
            &ldquo;{hook.hook_text}&rdquo;
          </p>

          {/* Lever + audience */}
          <div className="flex flex-wrap items-center gap-[var(--space-2)] mt-[var(--space-2)]">
            <span
              className="font-mono text-[10px] uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border"
              style={{ color: leverColor, borderColor: `${leverColor}40` }}
            >
              {hook.psychological_lever}
            </span>
            <span className="text-[12px] text-muted truncate">
              {hook.target_audience}
            </span>
          </div>

          {/* Angle */}
          <p className="text-[12px] text-foreground-secondary mt-[var(--space-1)] leading-relaxed">
            {hook.angle}
          </p>
        </div>
      </div>

      {/* Expand toggle for score/detail */}
      <div className="flex items-center mt-[var(--space-2)] pl-[var(--space-8)]">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-100"
        >
          {showDetail ? (
            <CaretUp size={10} weight="bold" />
          ) : (
            <CaretDown size={10} weight="bold" />
          )}
          {showDetail ? "Less" : "Score & details"}
        </button>
      </div>

      {/* Expanded detail (nested accordion) */}
      <div className={`accordion-wrapper ${showDetail ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="mt-[var(--space-3)] pl-[var(--space-8)] space-y-[var(--space-3)]">
            {/* Differentiation */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Differentiation
              </span>
              <p className="text-[12px] text-foreground-secondary mt-[var(--space-1)]">
                {hook.differentiation}
              </p>
            </div>

            {/* Platform meta */}
            {Object.keys(hook.platform_meta).length > 0 && (
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {Object.entries(hook.platform_meta).map(([k, v]) => (
                  <span
                    key={k}
                    className="text-[11px] text-foreground-secondary bg-surface-elevated px-[var(--space-2)] py-[var(--space-1)] font-mono"
                  >
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}

            {/* Score slider */}
            <div className="flex items-center gap-[var(--space-3)]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Score
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => onScoreChange(hook.id, parseInt(e.target.value, 10))}
                disabled={readOnly}
                className="score-slider w-24"
              />
              <span className="font-mono text-[13px] font-bold tabular-nums w-7 text-right">
                {score}
              </span>
            </div>

            {/* Feedback input */}
            {!readOnly && (
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => onFeedbackChange(hook.id, e.target.value)}
                placeholder="Optional feedback on this hook..."
                className="w-full bg-transparent border-b border-border text-[12px] font-mono text-foreground-secondary py-[var(--space-1)] focus:border-foreground-secondary transition-colors placeholder:text-muted/50"
              />
            )}
            {readOnly && feedbackText && (
              <p className="text-[12px] text-muted italic">
                &ldquo;{feedbackText}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
