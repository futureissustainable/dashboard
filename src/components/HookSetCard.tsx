"use client";

import { useState } from "react";
import {
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  CircleNotch,
  Lightning,
  PaperPlaneTilt,
  X,
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

type HookDecision = "approved" | "denied" | null;

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
  const color = PLATFORM_COLORS[hookSet.platform];

  // Per-hook decisions: approved / denied / null (undecided)
  const [decisions, setDecisions] = useState<Record<string, HookDecision>>(() => {
    const init: Record<string, HookDecision> = {};
    for (const h of hookSet.hooks) {
      if (hookSet.review) {
        init[h.id] = hookSet.review.approved_hook_ids.includes(h.id) ? "approved" : "denied";
      } else {
        init[h.id] = null;
      }
    }
    return init;
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

  const approvedIds = Object.entries(decisions).filter(([, d]) => d === "approved").map(([id]) => id);
  const deniedIds = Object.entries(decisions).filter(([, d]) => d === "denied").map(([id]) => id);
  const decidedCount = approvedIds.length + deniedIds.length;
  const allDecided = decidedCount === hookSet.hooks.length;

  const setDecision = (id: string, decision: HookDecision) => {
    if (submitted) return;
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    if (approvedIds.length === 0) {
      const confirmed = window.confirm(
        "No hooks approved. No posts will be generated. Continue?"
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
        approved_hook_ids: approvedIds,
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
      const ids = hookSet.review?.approved_hook_ids ?? approvedIds;
      await onTriggerPhase2(hookSet.platform as Platform, hookSet.date, ids);
      setPhase2Triggered(true);
    } catch (e) {
      console.error("Failed to trigger Phase 2:", e);
    } finally {
      setTriggeringPhase2(false);
    }
  };

  return (
    <div className="card-enter border border-border bg-surface transition-all duration-200">
      {/* ── Clickable header — same style as PostCard header ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-[var(--space-3)] group"
      >
        <div className="flex items-center gap-[var(--space-2)]">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border"
            style={{ color, borderColor: color }}
          >
            {hookSet.platform}
          </span>
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {hookSet.date}
          </span>
          <span className="text-border text-[10px]">|</span>
          <span className="text-[11px] text-muted truncate">
            {hookSet.pillar}
          </span>
          <span className="ml-auto flex items-center gap-[var(--space-2)] flex-shrink-0">
            {submitted ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-green-400 px-[var(--space-2)] py-[var(--space-1)] border border-green-400/40">
                {approvedIds.length} approved
              </span>
            ) : decidedCount > 0 ? (
              <span className="font-mono text-[10px] text-muted tabular-nums">
                {decidedCount}/{hookSet.hooks.length} reviewed
              </span>
            ) : (
              <span className="font-mono text-[10px] text-muted tabular-nums">
                {hookSet.hooks.length} hooks
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

      {/* ── Accordion body ── */}
      <div className={`accordion-wrapper ${open ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="px-[var(--space-3)] pb-[var(--space-3)] space-y-[var(--space-2)]">
            {/* Individual hooks — each card mirrors PostCard style */}
            {hookSet.hooks.map((hook) => (
              <InlineHookCard
                key={hook.id}
                hook={hook}
                decision={decisions[hook.id]}
                score={scores[hook.id]}
                feedbackText={feedbacks[hook.id]}
                readOnly={submitted}
                onDecide={(d) => setDecision(hook.id, d)}
                onScoreChange={(id, s) => setScores((p) => ({ ...p, [id]: s }))}
                onFeedbackChange={(id, f) => setFeedbacks((p) => ({ ...p, [id]: f }))}
              />
            ))}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between pt-[var(--space-2)] border-t border-border/50">
              <span className="font-mono text-[11px] text-muted tabular-nums">
                {approvedIds.length > 0 && (
                  <span className="text-green-400">{approvedIds.length} approved</span>
                )}
                {approvedIds.length > 0 && deniedIds.length > 0 && (
                  <span className="text-border mx-1">|</span>
                )}
                {deniedIds.length > 0 && (
                  <span className="text-red-400">{deniedIds.length} denied</span>
                )}
                {decidedCount === 0 && "No decisions yet"}
              </span>

              <div className="flex items-center gap-[var(--space-2)]">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !allDecided}
                    className={`flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider border px-[var(--space-4)] py-[var(--space-2)] transition-all duration-200 ${
                      submitting || !allDecided
                        ? "text-muted border-border cursor-not-allowed"
                        : "text-green-400 border-green-400/40 hover:bg-green-400/10 hover:border-green-400"
                    }`}
                    title={allDecided ? "" : "Approve or deny all hooks to submit"}
                  >
                    {submitting ? (
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                    ) : (
                      <PaperPlaneTilt size={14} weight="bold" />
                    )}
                    Submit
                  </button>
                ) : (
                  <>
                    <span className="font-mono text-[11px] text-green-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle size={12} weight="bold" />
                      Submitted
                    </span>
                    {approvedIds.length > 0 && !phase2Triggered && (
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
                        Write Posts ({approvedIds.length})
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
 * Single hook card — mirrors PostCard visual structure exactly:
 * Header (lever badge + audience) → Body (hook text + angle) → Action bar (approve/deny)
 * After decision: status badge + score slider + feedback
 */
function InlineHookCard({
  hook,
  decision,
  score,
  feedbackText,
  readOnly,
  onDecide,
  onScoreChange,
  onFeedbackChange,
}: {
  hook: Hook;
  decision: HookDecision;
  score: number;
  feedbackText: string;
  readOnly: boolean;
  onDecide: (d: HookDecision) => void;
  onScoreChange: (id: string, score: number) => void;
  onFeedbackChange: (id: string, feedback: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const leverColor = getLeverColor(hook.psychological_lever);
  const hasDecision = decision !== null;

  return (
    <div className="border border-border bg-surface p-[var(--space-3)] transition-all duration-200">
      {/* ── Header — lever badge + audience (mirrors PostCard: platform + date + pillar) ── */}
      <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
        <span
          className="font-mono text-[10px] uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border"
          style={{ color: leverColor, borderColor: `${leverColor}40` }}
        >
          {hook.psychological_lever}
        </span>
        <span className="text-[11px] text-muted truncate">
          {hook.target_audience}
        </span>
        {hasDecision && (
          <span
            className={`ml-auto font-mono text-[10px] uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border flex-shrink-0 ${
              decision === "approved"
                ? "text-green-400 border-green-400/40"
                : "text-red-400 border-red-400/40"
            }`}
          >
            {decision} {score}/100
          </span>
        )}
      </div>

      {/* ── Body — hook text (like title) + angle (like preview) ── */}
      <p className="text-[var(--fs-p-sm)] text-foreground font-medium leading-relaxed mb-[var(--space-2)] line-clamp-2">
        &ldquo;{hook.hook_text}&rdquo;
      </p>
      <p className="text-[11px] text-muted leading-relaxed mb-[var(--space-2)]">
        {hook.angle}
      </p>

      {/* ── Expand for details ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-100 mb-[var(--space-3)]"
      >
        {expanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
        {expanded ? "Collapse" : "Details"}
      </button>

      <div className={`accordion-wrapper ${expanded ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="space-y-[var(--space-2)] mb-[var(--space-3)]">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Differentiation
              </span>
              <p className="text-[12px] text-foreground-secondary mt-[var(--space-1)] leading-relaxed">
                {hook.differentiation}
              </p>
            </div>
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
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ACTION BAR — identical to PostCard pattern
          ══════════════════════════════════════════════════ */}

      {/* No decision yet: approve/deny bar */}
      {!hasDecision && !readOnly && (
        <div className="flex gap-[var(--space-2)] pt-[var(--space-3)] border-t border-border">
          <button
            onClick={() => onDecide("approved")}
            className="flex-1 flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-green-400 hover:text-green-300 border border-green-400/30 hover:border-green-400 hover:bg-green-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <Check size={16} weight="bold" />
            Approve
          </button>
          <button
            onClick={() => onDecide("denied")}
            className="flex-1 flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 hover:bg-red-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <X size={16} weight="bold" />
            Deny
          </button>
        </div>
      )}

      {/* After decision: score + feedback (accordion reveal) */}
      {hasDecision && (
        <div className="pt-[var(--space-3)] border-t border-border space-y-[var(--space-3)]">
          {/* Change decision (unless submitted) */}
          {!readOnly && (
            <div className="flex gap-[var(--space-2)]">
              <button
                onClick={() => onDecide("approved")}
                className={`flex-1 flex items-center justify-center gap-[var(--space-1)] font-mono text-[11px] uppercase tracking-wider py-[var(--space-2)] border transition-all duration-200 ${
                  decision === "approved"
                    ? "text-green-400 border-green-400/40 bg-green-400/[0.06]"
                    : "text-muted border-border hover:text-green-400 hover:border-green-400/30"
                }`}
              >
                <Check size={12} weight="bold" />
                Approved
              </button>
              <button
                onClick={() => onDecide("denied")}
                className={`flex-1 flex items-center justify-center gap-[var(--space-1)] font-mono text-[11px] uppercase tracking-wider py-[var(--space-2)] border transition-all duration-200 ${
                  decision === "denied"
                    ? "text-red-400 border-red-400/40 bg-red-400/[0.06]"
                    : "text-muted border-border hover:text-red-400 hover:border-red-400/30"
                }`}
              >
                <X size={12} weight="bold" />
                Denied
              </button>
            </div>
          )}

          {/* Score slider */}
          <div className="flex items-center gap-[var(--space-3)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted w-10">
              Score
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => onScoreChange(hook.id, parseInt(e.target.value, 10))}
              disabled={readOnly}
              className="score-slider flex-1"
            />
            <span className="font-mono text-[13px] font-bold tabular-nums w-8 text-right">
              {score}
            </span>
          </div>

          {/* Feedback input */}
          {!readOnly && (
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => onFeedbackChange(hook.id, e.target.value)}
              placeholder="Optional feedback..."
              className="w-full bg-transparent border-b border-border text-[12px] font-mono text-foreground-secondary py-[var(--space-1)] focus:border-foreground-secondary outline-none transition-colors placeholder:text-muted/50"
            />
          )}
          {readOnly && feedbackText && (
            <p className="text-[11px] text-muted italic truncate">
              &ldquo;{feedbackText}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
