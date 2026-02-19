"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowClockwise, Check, CircleNotch, FileText, Lightbulb, Lightning, WarningCircle } from "@phosphor-icons/react";
import PostCard, { type PostEntry } from "./PostCard";
import FeedbackModal from "./FeedbackModal";
import EngagementModal from "./EngagementModal";
import RerollModal from "./RerollModal";
import DocsEditor from "./DocsEditor";
import HooksReviewPanel from "./HooksReviewPanel";
import type { HookSet, Platform } from "@/lib/types";

type Filter = "all" | "reddit" | "linkedin" | "instagram";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reddit", label: "Reddit" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
];

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
};

export default function AutomationsPanel() {
  const [view, setView] = useState<"feed" | "docs" | "hooks-review">("feed");
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Hooks state
  const [hookSets, setHookSets] = useState<HookSet[]>([]);
  const [activeHookSet, setActiveHookSet] = useState<HookSet | null>(null);

  // Run all workflows
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runMessage, setRunMessage] = useState("");

  const triggerAll = async () => {
    setRunStatus("running");
    setRunMessage("");
    try {
      const res = await fetch("/api/automations/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setRunStatus("error");
        setRunMessage(data.error || "Request failed");
      } else if (data.failed?.length) {
        setRunStatus("error");
        setRunMessage(`${data.triggered.length}/3 triggered`);
      } else {
        setRunStatus("success");
        setRunMessage(`${data.triggered.length} workflows queued`);
      }
    } catch (e) {
      setRunStatus("error");
      setRunMessage("Network error");
      console.error("Failed to trigger workflows:", e);
    }
    setTimeout(() => {
      setRunStatus("idle");
      setRunMessage("");
    }, 4000);
  };

  // Feedback modal
  const [reviewTarget, setReviewTarget] = useState<{
    post: PostEntry;
    status: "approved" | "denied";
  } | null>(null);

  // Engagement modal
  const [engagementTarget, setEngagementTarget] = useState<PostEntry | null>(null);

  // Reroll modal
  const [rerollTarget, setRerollTarget] = useState<PostEntry | null>(null);

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

  const fetchHooks = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "all" });
      if (filter !== "all") params.set("platform", filter);
      const res = await fetch(`/api/automations/hooks?${params}`);
      const data = await res.json();
      setHookSets(data.hookSets || []);
    } catch (e) {
      console.error("Failed to fetch hooks:", e);
    }
  }, [filter]);

  useEffect(() => {
    if (view === "feed") {
      fetchPosts();
      fetchHooks();
    }
  }, [fetchPosts, fetchHooks, view]);

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
        const postFileName = data.postFile;
        setPosts((prev) =>
          prev.map((p) => {
            const pFileName = p.filePath.split("/").pop() || "";
            return p.platform === data.platform && pFileName === postFileName
              ? {
                  ...p,
                  feedback: {
                    status: data.status as "approved" | "denied",
                    score: data.score,
                    feedback: data.feedback,
                    reviewedAt: new Date().toISOString(),
                  },
                }
              : p;
          })
        );
      }
    } catch (e) {
      console.error("Failed to save feedback:", e);
    } finally {
      setReviewTarget(null);
    }
  };

  const handleEngagementSubmit = async (data: {
    platform: string;
    date: string;
    postFile: string;
    engagement: {
      metrics: Record<string, number>;
      notes: string;
    };
  }) => {
    try {
      const res = await fetch("/api/automations/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setPosts((prev) =>
          prev.map((p) => {
            const pFileName = p.filePath.split("/").pop() || "";
            return p.platform === data.platform && pFileName === data.postFile
              ? {
                  ...p,
                  feedback: p.feedback
                    ? {
                        ...p.feedback,
                        engagement: {
                          recordedAt: new Date().toISOString(),
                          metrics: data.engagement.metrics,
                          notes: data.engagement.notes,
                        },
                      }
                    : p.feedback,
                }
              : p;
          })
        );
      }
    } catch (e) {
      console.error("Failed to save engagement:", e);
    } finally {
      setEngagementTarget(null);
    }
  };

  const handleHookReviewSubmit = async (data: {
    platform: string;
    date: string;
    approved_hook_ids: string[];
    hook_feedback: Record<string, { score: number; feedback?: string }>;
  }) => {
    const res = await fetch("/api/automations/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error("Failed to submit hook review");

    // Update local state
    setHookSets((prev) =>
      prev.map((hs) =>
        hs.platform === data.platform && hs.date === data.date
          ? {
              ...hs,
              status: "reviewed" as const,
              review: {
                reviewed_at: new Date().toISOString(),
                approved_hook_ids: data.approved_hook_ids,
                hook_feedback: data.hook_feedback,
              },
            }
          : hs
      )
    );

    if (activeHookSet) {
      setActiveHookSet((prev) =>
        prev
          ? {
              ...prev,
              status: "reviewed" as const,
              review: {
                reviewed_at: new Date().toISOString(),
                approved_hook_ids: data.approved_hook_ids,
                hook_feedback: data.hook_feedback,
              },
            }
          : null
      );
    }
  };

  const handleTriggerPhase2 = async (platform: Platform, date: string, hookIds: string[]) => {
    const res = await fetch("/api/automations/run/phase2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, date, hook_ids: hookIds }),
    });
    const result = await res.json();
    if (!result.triggered) throw new Error(result.error || "Failed to trigger");
  };

  const handleRerollSubmit = async (data: {
    platform: string;
    date: string;
    hook_id: string;
    feedback: string;
  }) => {
    try {
      const res = await fetch("/api/automations/run/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.triggered) {
        console.error("Failed to trigger re-roll:", result.error);
      }
    } catch (e) {
      console.error("Failed to trigger re-roll:", e);
    } finally {
      setRerollTarget(null);
    }
  };

  if (view === "docs") {
    return (
      <div className="h-[calc(100vh-72px)]">
        <DocsEditor onBack={() => setView("feed")} />
      </div>
    );
  }

  if (view === "hooks-review" && activeHookSet) {
    return (
      <HooksReviewPanel
        hookSet={activeHookSet}
        onBack={() => {
          setView("feed");
          setActiveHookSet(null);
          fetchHooks();
        }}
        onSubmitReview={handleHookReviewSubmit}
        onTriggerPhase2={handleTriggerPhase2}
      />
    );
  }

  const pendingHooks = hookSets.filter((hs) => hs.status === "pending");
  const reviewedHooksToday = hookSets.filter((hs) => hs.status === "reviewed");

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
          {pendingHooks.length > 0 && (
            <span className="font-mono text-[10px] text-yellow-400 tabular-nums">
              {pendingHooks.length} hook{pendingHooks.length !== 1 ? "s" : ""} pending
            </span>
          )}
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
            onClick={() => { fetchPosts(); fetchHooks(); }}
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerAll}
              disabled={runStatus === "running"}
              className={`p-1.5 transition-colors duration-100 ${
                runStatus === "success"
                  ? "text-green-400"
                  : runStatus === "error"
                  ? "text-red-400"
                  : "text-muted hover:text-foreground"
              }`}
              title="Generate hooks (Phase 1)"
            >
              {runStatus === "running" ? (
                <CircleNotch size={14} weight="bold" className="animate-spin" />
              ) : runStatus === "success" ? (
                <Check size={14} weight="bold" />
              ) : runStatus === "error" ? (
                <WarningCircle size={14} weight="bold" />
              ) : (
                <Lightning size={14} weight="bold" />
              )}
            </button>
            {runMessage && (
              <span className={`font-mono text-[10px] transition-opacity duration-200 ${
                runStatus === "success" ? "text-green-400" : runStatus === "error" ? "text-red-400" : "text-muted"
              }`}>
                {runMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch size={20} weight="bold" className="animate-spin text-muted" />
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 space-y-3 max-w-4xl mx-auto">
            {/* Hooks Pending Review */}
            {pendingHooks.length > 0 && (
              <div className="border border-yellow-400/30 bg-yellow-400/5 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} weight="bold" className="text-yellow-400" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                    Hooks Pending Review
                  </span>
                </div>
                {pendingHooks.map((hs) => {
                  const color = PLATFORM_COLORS[hs.platform];
                  return (
                    <button
                      key={`${hs.platform}-${hs.date}`}
                      onClick={() => {
                        setActiveHookSet(hs);
                        setView("hooks-review");
                      }}
                      className="w-full flex items-center gap-3 p-2 border border-border hover:border-foreground-secondary bg-surface transition-colors duration-100"
                    >
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border"
                        style={{ color, borderColor: color }}
                      >
                        {hs.platform}
                      </span>
                      <span className="font-mono text-[11px] text-muted tabular-nums">
                        {hs.date}
                      </span>
                      <span className="text-[11px] text-foreground-secondary">
                        {hs.pillar}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted">
                        {hs.hooks.length} hooks
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Recently Reviewed Hooks (with Write Posts option) */}
            {reviewedHooksToday.filter((hs) => hs.review && hs.review.approved_hook_ids.length > 0).length > 0 && (
              <div className="border border-border bg-surface p-4 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Reviewed Hooks
                </span>
                {reviewedHooksToday.map((hs) => {
                  const color = PLATFORM_COLORS[hs.platform];
                  const approvedCount = hs.review?.approved_hook_ids.length || 0;
                  return (
                    <button
                      key={`reviewed-${hs.platform}-${hs.date}`}
                      onClick={() => {
                        setActiveHookSet(hs);
                        setView("hooks-review");
                      }}
                      className="w-full flex items-center gap-3 p-2 border border-border hover:border-foreground-secondary transition-colors duration-100"
                    >
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border"
                        style={{ color, borderColor: color }}
                      >
                        {hs.platform}
                      </span>
                      <span className="font-mono text-[11px] text-muted tabular-nums">
                        {hs.date}
                      </span>
                      <span className="font-mono text-[10px] text-green-400">
                        {approvedCount} approved
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Posts */}
            {posts.length === 0 && pendingHooks.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-[12px] font-mono text-muted">
                  No posts found
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={`${post.platform}-${post.date}-${post.slug}`}
                  post={post}
                  onReview={handleReview}
                  onAddResults={setEngagementTarget}
                  onReroll={setRerollTarget}
                />
              ))
            )}

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

      {/* Engagement Modal */}
      {engagementTarget && (
        <EngagementModal
          post={engagementTarget}
          onClose={() => setEngagementTarget(null)}
          onSubmit={handleEngagementSubmit}
        />
      )}

      {/* Reroll Modal */}
      {rerollTarget && (
        <RerollModal
          post={rerollTarget}
          onClose={() => setRerollTarget(null)}
          onSubmit={handleRerollSubmit}
        />
      )}
    </div>
  );
}
