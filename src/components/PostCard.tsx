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
}: {
  post: PostEntry;
  onReview: (post: PostEntry, status: "approved" | "denied") => void;
  onAddResults?: (post: PostEntry) => void;
  onReroll?: (post: PostEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = PLATFORM_COLORS[post.platform];
  const pillar = (post.frontmatter.pillar ) || "";

  // Platform-specific metadata
  const meta: string[] = [];
  if (post.platform === "reddit") {
    if (post.frontmatter.subreddit) meta.push(post.frontmatter.subreddit );
    if (post.frontmatter.persona) {
      const p = post.frontmatter.persona ;
      meta.push(p.length > 60 ? p.slice(0, 57) + "..." : p);
    }
  } else if (post.platform === "linkedin") {
    if (post.frontmatter.persona) meta.push(post.frontmatter.persona );
    if (post.frontmatter.format) meta.push(`Format: ${post.frontmatter.format}`);
  } else if (post.platform === "instagram") {
    if (post.frontmatter.creative_file) meta.push(post.frontmatter.creative_file );
    if (post.frontmatter.format) meta.push(post.frontmatter.format );
    if (post.frontmatter.caption_length) meta.push(post.frontmatter.caption_length );
  }

  const preview = post.body.slice(0, 200) + (post.body.length > 200 ? "..." : "");

  return (
    <div className="border border-border bg-surface p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border"
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
            <span className="font-mono text-[11px] text-muted">{pillar}</span>
          </>
        )}
        {post.feedback && (
          <span
            className={`ml-auto font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${
              post.feedback.status === "approved"
                ? "text-green-400 border-green-400/40"
                : "text-red-400 border-red-400/40"
            }`}
          >
            {post.feedback.status} · {post.feedback.score}/100
          </span>
        )}
      </div>

      {/* Metadata */}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {meta.map((m, i) => (
            <span
              key={i}
              className="text-[11px] text-foreground-secondary bg-surface-elevated px-2 py-0.5 font-mono"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Title from frontmatter */}
      {post.frontmatter.title && (
        <p className="text-[13px] text-foreground font-medium mb-2 leading-relaxed">
          &ldquo;{post.frontmatter.title}&rdquo;
        </p>
      )}

      {/* Body */}
      {expanded ? (
        <div className="post-content text-[12px] text-foreground-secondary leading-relaxed mb-3 max-h-[60vh] overflow-y-auto pr-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-[12px] text-muted leading-relaxed mb-3">
          {preview}
        </p>
      )}

      {/* Expand/collapse + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-100"
        >
          {expanded ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
          {expanded ? "Collapse" : "Read More"}
        </button>

        {!post.feedback && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReview(post, "approved")}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-green-400 hover:text-green-300 border border-green-400/30 hover:border-green-300 px-3 py-1.5 transition-colors duration-100"
            >
              <Check size={12} weight="bold" />
              Approve
            </button>
            <button
              onClick={() => onReview(post, "denied")}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-300 px-3 py-1.5 transition-colors duration-100"
            >
              <X size={12} weight="bold" />
              Deny
            </button>
          </div>
        )}

        {post.feedback && post.feedback.status === "approved" && !post.feedback.engagement && onAddResults && (
          <button
            onClick={() => onAddResults(post)}
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-blue-400 hover:text-blue-300 border border-blue-400/30 hover:border-blue-300 px-3 py-1.5 transition-colors duration-100"
          >
            <ChartBar size={12} weight="bold" />
            Add Results
          </button>
        )}

        {post.feedback?.engagement && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400 tabular-nums">
            {Object.entries(post.feedback.engagement.metrics).map(([k, v]) => (
              <span key={k}>{v} {k}</span>
            ))}
          </div>
        )}

        {post.feedback && post.feedback.status === "denied" && post.frontmatter.hook_id && onReroll && (
          <button
            onClick={() => onReroll(post)}
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-yellow-400 hover:text-yellow-300 border border-yellow-400/30 hover:border-yellow-300 px-3 py-1.5 transition-colors duration-100"
          >
            <ArrowClockwise size={12} weight="bold" />
            Re-roll
          </button>
        )}

        {post.feedback && post.feedback.feedback && !post.feedback.engagement && !(post.feedback.status === "denied" && post.frontmatter.hook_id && onReroll) && (
          <p className="text-[11px] text-muted italic max-w-[50%] truncate">
            &ldquo;{post.feedback.feedback}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
