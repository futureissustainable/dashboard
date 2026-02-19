"use client";

import { useState } from "react";
import { ArrowClockwise, X } from "@phosphor-icons/react";
import type { PostEntry } from "./PostCard";

export default function RerollModal({
  post,
  onClose,
  onSubmit,
}: {
  post: PostEntry;
  onClose: () => void;
  onSubmit: (data: {
    platform: string;
    date: string;
    hook_id: string;
    feedback: string;
  }) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !submitting && feedback.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onSubmit({
      platform: post.platform,
      date: post.date,
      hook_id: post.frontmatter.hook_id || "",
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
            Re-roll Post
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
          {post.frontmatter.hook_id && (
            <span className="text-foreground-secondary ml-2">
              Hook: {post.frontmatter.hook_id}
            </span>
          )}
        </div>

        {/* Feedback */}
        <div className="mb-6">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground-secondary mb-2">
            What should change?
            <span className="text-yellow-400 ml-1">(required)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="The hook is good but the execution is too dry. More storytelling, less stats..."
            rows={4}
            className="w-full bg-surface border border-border p-3 text-[12px] font-mono leading-relaxed resize-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full font-mono text-[11px] uppercase tracking-wider border px-4 py-3 transition-colors duration-100 flex items-center justify-center gap-2 ${
            canSubmit
              ? "text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/10"
              : "text-muted border-border cursor-not-allowed"
          }`}
        >
          <ArrowClockwise size={12} weight="bold" />
          {submitting ? "Triggering..." : "Re-roll Post"}
        </button>
      </div>
    </div>
  );
}
