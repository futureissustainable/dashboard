"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowClockwise, CaretDown, CaretUp, ChartBar, Check, X } from "@phosphor-icons/react";

export type PostEntry = {
  platform: "reddit" | "linkedin" | "instagram";
  date: string;
  slug: string;
  filePath: string;
  sha: string;
  frontmatter: Record<string, string>;
  body: string;
  feedback?: {
    status: "approved" | "denied";
    score: number;
    feedback: string;
    reviewedAt: string;
    engagement?: {
      recordedAt: string;
      metrics: Record<string, number>;
      notes?: string;
    };
  };
};

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
};

export default function PostCard({
  post,
  onReview,
  onAddResults,
  onReroll,
  compact = false,
}: {
  post: PostEntry;
  onReview: (post: PostEntry, status: "approved" | "denied") => void;
  onAddResults?: (post: PostEntry) => void;
  onReroll?: (post: PostEntry) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = PLATFORM_COLORS[post.platform];
  const pillar = post.frontmatter.pillar || "";

  // Platform-specific metadata
  const meta: string[] = [];
  if (post.platform === "reddit") {
    if (post.frontmatter.subreddit) meta.push(post.frontmatter.subreddit);
    if (post.frontmatter.persona) {
      const p = post.frontmatter.persona;
      meta.push(p.length > 60 ? p.slice(0, 57) + "..." : p);
    }
  } else if (post.platform === "linkedin") {
    if (post.frontmatter.persona) meta.push(post.frontmatter.persona);
    if (post.frontmatter.format) meta.push(`Format: ${post.frontmatter.format}`);
  } else if (post.platform === "instagram") {
    if (post.frontmatter.creative_file) meta.push(post.frontmatter.creative_file);
    if (post.frontmatter.format) meta.push(post.frontmatter.format);
    if (post.frontmatter.caption_length) meta.push(post.frontmatter.caption_length);
  }

  const previewLen = compact ? 100 : 200;
  const preview = post.body.slice(0, previewLen) + (post.body.length > previewLen ? "..." : "");
  const needsReview = !post.feedback;

  return (
    <div className={`border bg-surface transition-all duration-200 ${
      needsReview ? "border-border" : "border-border"
    } ${compact ? "p-[var(--space-3)]" : "p-[var(--space-4)]"}`}>
      {/* ── Header row ── */}
      <div className={`flex items-center gap-[var(--space-2)] ${compact ? "mb-[var(--space-2)]" : "mb-[var(--space-3)]"}`}>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border"
          style={{ color, borderColor: color }}
        >
          {post.platform}
        </span>
        <span className="font-mono text-[11px] text-muted tabular-nums">
          {post.date}
        </span>
        {pillar && (
          <>
            <span className="text-border text-[10px]">|</span>
            <span className={`font-mono text-muted ${compact ? "text-[10px] truncate" : "text-[11px]"}`}>
              {pillar}
            </span>
          </>
        )}
        {post.feedback && (
          <span
            className={`ml-auto font-mono text-[10px] uppercase tracking-widest px-[var(--space-2)] py-[var(--space-1)] border flex-shrink-0 ${
              post.feedback.status === "approved"
                ? "text-green-400 border-green-400/40"
                : "text-red-400 border-red-400/40"
            }`}
          >
            {post.feedback.status} {post.feedback.score}/100
          </span>
        )}
      </div>

      {/* ── Metadata (hidden in compact) ── */}
      {!compact && meta.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-2)] mb-[var(--space-3)]">
          {meta.map((m, i) => (
            <span
              key={i}
              className="text-[11px] text-foreground-secondary bg-surface-elevated px-[var(--space-2)] py-[var(--space-1)] font-mono"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* ── Title ── */}
      {post.frontmatter.title && (
        <p className={`text-foreground font-medium leading-relaxed ${
          compact ? "text-[var(--fs-p-sm)] mb-[var(--space-2)] line-clamp-2" : "text-[var(--fs-p-lg)] mb-[var(--space-2)]"
        }`}>
          &ldquo;{post.frontmatter.title}&rdquo;
        </p>
      )}

      {/* ── Body (accordion animated) ── */}
      <div className={`accordion-wrapper ${expanded ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className={`post-content text-[12px] text-foreground-secondary leading-relaxed overflow-y-auto pr-[var(--space-2)] ${
            compact ? "max-h-[200px] mb-[var(--space-2)]" : "max-h-[60vh] mb-[var(--space-3)]"
          }`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Preview text (shown when collapsed) */}
      {!expanded && (
        <p className={`text-muted leading-relaxed ${compact ? "text-[11px] mb-[var(--space-2)]" : "text-[12px] mb-[var(--space-3)]"}`}>
          {preview}
        </p>
      )}

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-100 mb-[var(--space-3)]"
      >
        {expanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
        {expanded ? "Collapse" : "Read more"}
      </button>

      {/* ══════════════════════════════════════════════════
          ACTION BAR — full-width, visually prominent
          ══════════════════════════════════════════════════ */}

      {/* Needs review: big approve/deny bar */}
      {needsReview && (
        <div className="flex gap-[var(--space-2)] pt-[var(--space-3)] border-t border-border">
          <button
            onClick={() => onReview(post, "approved")}
            className="flex-1 flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-green-400 hover:text-green-300 border border-green-400/30 hover:border-green-400 hover:bg-green-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <Check size={16} weight="bold" />
            Approve
          </button>
          <button
            onClick={() => onReview(post, "denied")}
            className="flex-1 flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 hover:bg-red-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <X size={16} weight="bold" />
            Deny
          </button>
        </div>
      )}

      {/* Approved, no engagement yet */}
      {post.feedback?.status === "approved" && !post.feedback.engagement && onAddResults && (
        <div className="pt-[var(--space-3)] border-t border-border">
          <button
            onClick={() => onAddResults(post)}
            className="w-full flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-blue-400 hover:text-blue-300 border border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <ChartBar size={16} weight="bold" />
            Add Results
          </button>
        </div>
      )}

      {/* Has engagement metrics */}
      {post.feedback?.engagement && (
        <div className="flex items-center gap-[var(--space-3)] pt-[var(--space-3)] border-t border-border">
          {Object.entries(post.feedback.engagement.metrics).map(([k, v]) => (
            <span key={k} className="font-mono text-[12px] text-blue-400 tabular-nums">
              {v} <span className="text-muted">{k}</span>
            </span>
          ))}
        </div>
      )}

      {/* Denied with hook_id: re-roll option */}
      {post.feedback?.status === "denied" && post.frontmatter.hook_id && onReroll && (
        <div className="pt-[var(--space-3)] border-t border-border">
          <button
            onClick={() => onReroll(post)}
            className="w-full flex items-center justify-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-yellow-400 hover:text-yellow-300 border border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/[0.06] py-[var(--space-3)] transition-all duration-200"
          >
            <ArrowClockwise size={16} weight="bold" />
            Re-roll
          </button>
        </div>
      )}

      {/* Feedback quote */}
      {post.feedback?.feedback && !post.feedback.engagement && !(post.feedback.status === "denied" && post.frontmatter.hook_id && onReroll) && (
        <p className="text-[11px] text-muted italic truncate pt-[var(--space-2)] border-t border-border mt-[var(--space-2)]">
          &ldquo;{post.feedback.feedback}&rdquo;
        </p>
      )}
    </div>
  );
}
