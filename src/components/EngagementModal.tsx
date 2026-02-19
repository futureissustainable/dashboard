"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import type { PostEntry } from "./PostCard";

const PLATFORM_METRICS: Record<string, string[]> = {
  linkedin: ["reactions", "comments", "reposts"],
  instagram: ["likes", "comments", "shares", "saves", "reach", "follows"],
  reddit: ["upvotes", "comments"],
};

export default function EngagementModal({
  post,
  onClose,
  onSubmit,
}: {
  post: PostEntry;
  onClose: () => void;
  onSubmit: (data: {
    platform: string;
    date: string;
    postFile: string;
    engagement: {
      metrics: Record<string, number>;
      notes: string;
    };
  }) => void;
}) {
  const metricKeys = PLATFORM_METRICS[post.platform] || [];
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasAnyMetric = Object.values(metrics).some((v) => v.trim() !== "");

  const handleSubmit = async () => {
    if (!hasAnyMetric || submitting) return;
    setSubmitting(true);

    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(metrics)) {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 0) parsed[k] = n;
    }

    onSubmit({
      platform: post.platform,
      date: post.date,
      postFile: post.filePath.split("/").pop() || "",
      engagement: { metrics: parsed, notes: notes.trim() },
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
            Add Results
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

        {/* Metric inputs */}
        <div className="space-y-3 mb-5">
          {metricKeys.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <label className="font-mono text-[11px] uppercase tracking-wider text-foreground-secondary w-20 text-right">
                {key}
              </label>
              <input
                type="number"
                min={0}
                value={metrics[key] || ""}
                onChange={(e) =>
                  setMetrics((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder="0"
                className="flex-1 bg-surface border border-border px-3 py-2 text-[12px] font-mono tabular-nums focus:border-foreground transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-foreground-secondary mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked? What pattern drove engagement?"
            rows={3}
            className="w-full bg-surface border border-border p-3 text-[12px] font-mono leading-relaxed resize-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!hasAnyMetric || submitting}
          className={`w-full font-mono text-[11px] uppercase tracking-wider border px-4 py-3 transition-colors duration-100 ${
            hasAnyMetric && !submitting
              ? "text-blue-400 border-blue-400/40 hover:bg-blue-400/10"
              : "text-muted border-border cursor-not-allowed"
          }`}
        >
          {submitting ? "Saving..." : "Save Results"}
        </button>
      </div>
    </div>
  );
}
