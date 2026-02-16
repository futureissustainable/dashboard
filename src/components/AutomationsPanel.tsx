"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowClockwise, CircleNotch, FileText } from "@phosphor-icons/react";
import PostCard, { type PostEntry } from "./PostCard";
import FeedbackModal from "./FeedbackModal";
import DocsEditor from "./DocsEditor";

type Filter = "all" | "reddit" | "linkedin" | "instagram";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reddit", label: "Reddit" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
];

export default function AutomationsPanel() {
  const [view, setView] = useState<"feed" | "docs">("feed");
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Feedback modal
  const [reviewTarget, setReviewTarget] = useState<{
    post: PostEntry;
    status: "approved" | "denied";
  } | null>(null);

  const fetchPosts = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("platform", filter);
        params.set("limit", "20");
        params.set("offset", String(offset));
        const res = await fetch(`/api/automations/posts?${params}`);
        const data = await res.json();
        if (append) {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        } else {
          setPosts(data.posts || []);
        }
        setHasMore(data.hasMore || false);
        setTotal(data.total || 0);
      } catch (e) {
        console.error("Failed to fetch posts:", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (view === "feed") fetchPosts();
  }, [fetchPosts, view]);

  const handleReview = (post: PostEntry, status: "approved" | "denied") => {
    setReviewTarget({ post, status });
  };

  const handleFeedbackSubmit = async (data: {
    platform: string;
    date: string;
    postFile: string;
    status: string;
    score: number;
    feedback: string;
  }) => {
    try {
      const res = await fetch("/api/automations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        // Optimistically update the post in local state
        setPosts((prev) =>
          prev.map((p) =>
            p.platform === data.platform && p.date === data.date
              ? {
                  ...p,
                  feedback: {
                    status: data.status as "approved" | "denied",
                    score: data.score,
                    feedback: data.feedback,
                    reviewedAt: new Date().toISOString(),
                  },
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error("Failed to save feedback:", e);
    } finally {
      setReviewTarget(null);
    }
  };

  if (view === "docs") {
    return (
      <div className="h-[calc(100vh-72px)]">
        <DocsEditor onBack={() => setView("feed")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Sub-nav */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors duration-100 ${
                filter === f.value
                  ? "text-foreground border-foreground"
                  : "text-muted border-border hover:text-foreground-secondary hover:border-foreground-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {total} post{total !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setView("docs")}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 transition-colors duration-100"
          >
            <FileText size={12} weight="bold" />
            Docs
          </button>
          <button
            onClick={() => fetchPosts()}
            disabled={loading}
            className="text-muted hover:text-foreground p-1.5 transition-colors duration-100"
            title="Refresh"
          >
            <ArrowClockwise
              size={14}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch size={20} weight="bold" className="animate-spin text-muted" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-[12px] font-mono text-muted">
              No posts found
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 space-y-3 max-w-4xl mx-auto">
            {posts.map((post) => (
              <PostCard
                key={`${post.platform}-${post.date}-${post.slug}`}
                post={post}
                onReview={handleReview}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => fetchPosts(posts.length, true)}
                  disabled={loadingMore}
                  className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-6 py-2.5 transition-colors duration-100"
                >
                  {loadingMore ? (
                    <CircleNotch size={12} weight="bold" className="animate-spin" />
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {reviewTarget && (
        <FeedbackModal
          post={reviewTarget.post}
          status={reviewTarget.status}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}
