"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import type { PostEntry } from "./PostCard";

export default function FeedbackModal({
  post,
  status,
  onClose,
  onSubmit,
}: {
  post: PostEntry;
  status: "approved" | "denied";
  onClose: () => void;
  onSubmit: (data: {
    platform: string;
    date: string;
    postFile: string;
    status: string;
    score: number;
    feedback: string;
  }) => void;
}) {
  const [score, setScore] = useState(status === "approved" ? 75 : 30);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !submitting && (status === "approved" || feedback.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onSubmit({
      platform: post.platform,
      date: post.date,
      postFile: post.filePath.split("/").pop() || "",
      status,
      score,
      feedback: feedback.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content bg-background border border-border w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-[14px] font-bold uppercase tracking-wider">
            {status === "approved" ? "Approve" : "Deny"} Post
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground p-1"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Post reference */}
        <div className="text-[11px] font-mono text-muted mb-5 border-b border-border pb-4">
          {post.platform.toUpperCase()} · {post.date} · {post.slug}
        </div>

        {/* Score */}
        <div className="mb-5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground-secondary mb-2">
            Score
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
              className="score-slider flex-1"
            />
            <span className="font-mono text-[16px] font-bold tabular-nums w-10 text-right">
              {score}
            </span>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-6">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground-secondary mb-2">
            Feedback{status === "denied" && (
              <span className="text-red-400 ml-1">(required)</span>
            )}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              status === "approved"
                ? "Optional notes for future generations..."
                : "Why is this post being denied? The AI will learn from this."
            }
            rows={4}
            className="w-full bg-surface border border-border p-3 text-[12px] font-mono leading-relaxed resize-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full font-mono text-[11px] uppercase tracking-wider border px-4 py-3 transition-colors duration-100 ${
            canSubmit
              ? status === "approved"
                ? "text-green-400 border-green-400/40 hover:bg-green-400/10"
                : "text-red-400 border-red-400/40 hover:bg-red-400/10"
              : "text-muted border-border cursor-not-allowed"
          }`}
        >
          {submitting ? "Saving..." : `Submit ${status === "approved" ? "Approval" : "Denial"}`}
        </button>
      </div>
    </div>
  );
}
