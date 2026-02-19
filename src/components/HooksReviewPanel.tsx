"use client";

import { useState } from "react";
import { ArrowLeft, CircleNotch, Lightning, PaperPlaneTilt } from "@phosphor-icons/react";
import HookCard from "./HookCard";
import type { HookSet, Platform } from "@/lib/types";

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
};

export default function HooksReviewPanel({
  hookSet,
  onBack,
  onSubmitReview,
  onTriggerPhase2,
}: {
  hookSet: HookSet;
  onBack: () => void;
  onSubmitReview: (data: {
    platform: string;
    date: string;
    approved_hook_ids: string[];
    hook_feedback: Record<string, { score: number; feedback?: string }>;
  }) => Promise<void>;
  onTriggerPhase2: (platform: Platform, date: string, hookIds: string[]) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const h of hookSet.hooks) {
      init[h.id] = 50;
    }
    return init;
  });
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hookSet.status === "reviewed");
  const [triggeringPhase2, setTriggeringPhase2] = useState(false);
  const [phase2Triggered, setPhase2Triggered] = useState(false);

  const color = PLATFORM_COLORS[hookSet.platform];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Confirm if 0 hooks selected
    if (selectedIds.size === 0) {
      const confirmed = window.confirm(
        "No hooks selected. No posts will be generated for this date. Continue?"
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const hookFeedback: Record<string, { score: number; feedback?: string }> = {};
      for (const h of hookSet.hooks) {
        const entry: { score: number; feedback?: string } = { score: scores[h.id] };
        if (feedbacks[h.id]?.trim()) {
          entry.feedback = feedbacks[h.id].trim();
        }
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

  const handleTriggerPhase2 = async () => {
    if (triggeringPhase2) return;
    setTriggeringPhase2(true);
    try {
      await onTriggerPhase2(
        hookSet.platform as Platform,
        hookSet.date,
        Array.from(selectedIds)
      );
      setPhase2Triggered(true);
    } catch (e) {
      console.error("Failed to trigger Phase 2:", e);
    } finally {
      setTriggeringPhase2(false);
    }
  };

  // If already reviewed, pre-populate selections from review data
  const displaySelectedIds = submitted && hookSet.review
    ? new Set(hookSet.review.approved_hook_ids)
    : selectedIds;

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted hover:text-foreground p-1 transition-colors duration-100"
          >
            <ArrowLeft size={14} weight="bold" />
          </button>
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border"
            style={{ color, borderColor: color }}
          >
            {hookSet.platform}
          </span>
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {hookSet.date}
          </span>
          <span className="text-border text-[10px]">|</span>
          <span className="font-mono text-[11px] text-muted">
            {hookSet.pillar}
          </span>
          <span className="text-border text-[10px]">|</span>
          <span className="font-mono text-[11px] text-muted">
            {hookSet.hooks.length} hooks
          </span>
        </div>
      </div>

      {/* Hooks list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-2 max-w-4xl mx-auto">
          <p className="text-[12px] text-muted mb-4">
            Select the hooks you want developed into full posts. Score all hooks to help the AI learn.
          </p>
          {hookSet.hooks.map((hook) => (
            <HookCard
              key={hook.id}
              hook={hook}
              selected={displaySelectedIds.has(hook.id)}
              score={
                hookSet.review?.hook_feedback[hook.id]?.score ?? scores[hook.id] ?? 50
              }
              feedbackText={
                hookSet.review?.hook_feedback[hook.id]?.feedback ?? feedbacks[hook.id] ?? ""
              }
              onToggleSelect={submitted ? () => {} : toggleSelect}
              onScoreChange={
                submitted
                  ? () => {}
                  : (id, s) => setScores((prev) => ({ ...prev, [id]: s }))
              }
              onFeedbackChange={
                submitted
                  ? () => {}
                  : (id, f) => setFeedbacks((prev) => ({ ...prev, [id]: f }))
              }
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-t border-border flex-shrink-0 bg-background">
        <span className="font-mono text-[11px] text-muted tabular-nums">
          {displaySelectedIds.size} selected
        </span>

        <div className="flex items-center gap-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider border px-4 py-2 transition-colors duration-100 ${
                submitting
                  ? "text-muted border-border cursor-not-allowed"
                  : "text-green-400 border-green-400/40 hover:bg-green-400/10"
              }`}
            >
              {submitting ? (
                <CircleNotch size={12} weight="bold" className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={12} weight="bold" />
              )}
              Submit Review
            </button>
          ) : (
            <>
              <span className="font-mono text-[10px] text-green-400 uppercase tracking-wider">
                Reviewed
              </span>
              {displaySelectedIds.size > 0 && !phase2Triggered && (
                <button
                  onClick={handleTriggerPhase2}
                  disabled={triggeringPhase2}
                  className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider border px-4 py-2 transition-colors duration-100 ${
                    triggeringPhase2
                      ? "text-muted border-border cursor-not-allowed"
                      : "text-foreground border-foreground/40 hover:bg-foreground/10"
                  }`}
                >
                  {triggeringPhase2 ? (
                    <CircleNotch size={12} weight="bold" className="animate-spin" />
                  ) : (
                    <Lightning size={12} weight="bold" />
                  )}
                  Write Posts ({displaySelectedIds.size})
                </button>
              )}
              {phase2Triggered && (
                <span className="font-mono text-[10px] text-foreground-secondary uppercase tracking-wider">
                  Workflows queued
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
