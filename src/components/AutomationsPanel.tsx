"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowClockwise, CaretRight, Check, CircleNotch, FileText, Lightbulb, Lightning, WarningCircle } from "@phosphor-icons/react";
import PostCard, { type PostEntry } from "./PostCard";
import FeedbackModal from "./FeedbackModal";
import EngagementModal from "./EngagementModal";
import RerollModal from "./RerollModal";
import DocsEditor from "./DocsEditor";
import HooksReviewPanel from "./HooksReviewPanel";
import ExampleHooksPanel from "./ExampleHooksPanel";
import WorkflowColumn from "./WorkflowColumn";
import type { HookSet, Platform } from "@/lib/types";

type Filter = "all" | "reddit" | "linkedin" | "instagram";
type ColumnTab = "review" | "approved" | "tracked";

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
  const [view, setView] = useState<"feed" | "docs" | "hooks-review" | "examples">("feed");
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Hooks state
  const [hookSets, setHookSets] = useState<HookSet[]>([]);
  const [activeHookSet, setActiveHookSet] = useState<HookSet | null>(null);

  // Mobile column tab
  const [activeColumn, setActiveColumn] = useState<ColumnTab>("review");

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
        params.set("limit", "50");
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

  if (view === "examples") {
    return (
      <ExampleHooksPanel onBack={() => setView("feed")} />
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

  // ── Data categorization ──
  const pendingHooks = hookSets.filter((hs) => hs.status === "pending");
  const reviewedHooks = hookSets.filter(
    (hs) => hs.status === "reviewed" && hs.review && hs.review.approved_hook_ids.length > 0
  );

  const reviewPosts = posts.filter((p) => !p.feedback);
  const approvedPosts = posts.filter(
    (p) => p.feedback?.status === "approved" && !p.feedback.engagement
  );
  const trackedPosts = posts.filter(
    (p) => p.feedback?.status === "approved" && !!p.feedback.engagement
  );
  const deniedPosts = posts.filter((p) => p.feedback?.status === "denied");

  const reviewCount = pendingHooks.length + reviewPosts.length;
  const approvedCount = reviewedHooks.length + approvedPosts.length;
  const trackedCount = trackedPosts.length + deniedPosts.length;

  const COLUMN_TABS: { value: ColumnTab; label: string; count: number }[] = [
    { value: "review", label: "Review", count: reviewCount },
    { value: "approved", label: "Approved", count: approvedCount },
    { value: "tracked", label: "Tracked", count: trackedCount },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* ── Toolbar ── */}
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
          <span className="font-mono text-[11px] text-muted tabular-nums ml-3">
            {total} post{total !== 1 ? "s" : ""}
          </span>
          {pendingHooks.length > 0 && (
            <span className="font-mono text-[10px] text-yellow-400 tabular-nums ml-2">
              {pendingHooks.length} hook{pendingHooks.length !== 1 ? "s" : ""} pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("examples")}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 transition-colors duration-100"
          >
            <Lightbulb size={12} weight="bold" />
            <span className="hidden sm:inline">Examples</span>
          </button>
          <button
            onClick={() => setView("docs")}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 transition-colors duration-100"
          >
            <FileText size={12} weight="bold" />
            <span className="hidden sm:inline">Docs</span>
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

      {/* ── Mobile column tabs (visible below lg) ── */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-border lg:hidden flex-shrink-0">
        {COLUMN_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveColumn(tab.value)}
            className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors duration-100 ${
              activeColumn === tab.value
                ? "text-foreground border-foreground"
                : "text-muted border-border hover:text-foreground-secondary"
            }`}
          >
            {tab.value === "review" && pendingHooks.length > 0 && (
              <span className="w-1.5 h-1.5 bg-yellow-400 animate-pulse flex-shrink-0" />
            )}
            {tab.label}
            <span className="text-[9px] tabular-nums">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ── Columns ── */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <CircleNotch size={20} weight="bold" className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 flex-1 overflow-hidden">
          {/* ── Column 1: REVIEW ── */}
          <WorkflowColumn
            title="Review"
            accent="yellow"
            count={reviewCount}
            index={0}
            emptyMessage="All caught up"
            showPulse
            className={`${activeColumn === "review" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Pending hook sets */}
            {pendingHooks.map((hs) => {
              const color = PLATFORM_COLORS[hs.platform];
              return (
                <button
                  key={`hook-${hs.platform}-${hs.date}`}
                  onClick={() => {
                    setActiveHookSet(hs);
                    setView("hooks-review");
                  }}
                  className="card-enter w-full flex items-center gap-3 p-3 border border-border border-l-2 border-l-yellow-400/30 bg-surface hover:bg-hover transition-colors duration-100 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border"
                        style={{ color, borderColor: color }}
                      >
                        {hs.platform}
                      </span>
                      <span className="font-mono text-[10px] text-muted tabular-nums">
                        {hs.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-foreground-secondary truncate">
                        {hs.pillar}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted flex-shrink-0">
                        {hs.hooks.length} hooks
                      </span>
                      <CaretRight size={10} weight="bold" className="text-muted flex-shrink-0" />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Unreviewed posts */}
            {reviewPosts.map((post) => (
              <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                <PostCard
                  post={post}
                  onReview={handleReview}
                  onAddResults={setEngagementTarget}
                  onReroll={setRerollTarget}
                  compact
                />
              </div>
            ))}
          </WorkflowColumn>

          {/* ── Column 2: APPROVED ── */}
          <WorkflowColumn
            title="Approved"
            accent="green"
            count={approvedCount}
            index={1}
            emptyMessage="No approved content yet"
            className={`${activeColumn === "approved" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Reviewed hook sets with approved hooks */}
            {reviewedHooks.map((hs) => {
              const color = PLATFORM_COLORS[hs.platform];
              const approvedCount = hs.review?.approved_hook_ids.length || 0;
              return (
                <button
                  key={`reviewed-${hs.platform}-${hs.date}`}
                  onClick={() => {
                    setActiveHookSet(hs);
                    setView("hooks-review");
                  }}
                  className="card-enter w-full flex items-center gap-3 p-3 border border-border border-l-2 border-l-green-400/30 bg-surface hover:bg-hover transition-colors duration-100 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border"
                        style={{ color, borderColor: color }}
                      >
                        {hs.platform}
                      </span>
                      <span className="font-mono text-[10px] text-muted tabular-nums">
                        {hs.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-green-400">
                        {approvedCount} approved
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted flex-shrink-0">
                        Write Posts
                      </span>
                      <CaretRight size={10} weight="bold" className="text-muted flex-shrink-0" />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Approved posts (no engagement yet) */}
            {approvedPosts.map((post) => (
              <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                <PostCard
                  post={post}
                  onReview={handleReview}
                  onAddResults={setEngagementTarget}
                  onReroll={setRerollTarget}
                  compact
                />
              </div>
            ))}
          </WorkflowColumn>

          {/* ── Column 3: TRACKED ── */}
          <WorkflowColumn
            title="Tracked"
            accent="blue"
            count={trackedCount}
            index={2}
            emptyMessage="No tracked results yet"
            className={`${activeColumn === "tracked" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Posts with engagement metrics */}
            {trackedPosts.map((post) => (
              <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                <PostCard
                  post={post}
                  onReview={handleReview}
                  onAddResults={setEngagementTarget}
                  onReroll={setRerollTarget}
                  compact
                />
              </div>
            ))}

            {/* Denied posts separator */}
            {deniedPosts.length > 0 && trackedPosts.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="flex-1 border-t border-border" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                  Denied
                </span>
                <span className="flex-1 border-t border-border" />
              </div>
            )}

            {/* Denied posts (dimmed) */}
            {deniedPosts.map((post) => (
              <div key={`denied-${post.platform}-${post.date}-${post.slug}`} className="card-enter opacity-60">
                <PostCard
                  post={post}
                  onReview={handleReview}
                  onAddResults={setEngagementTarget}
                  onReroll={setRerollTarget}
                  compact
                />
              </div>
            ))}
          </WorkflowColumn>
        </div>
      )}

      {/* ── Load More (spans full width below columns) ── */}
      {hasMore && !loading && (
        <div className="flex justify-center py-3 border-t border-border flex-shrink-0">
          <button
            onClick={() => fetchPosts(posts.length, true)}
            disabled={loadingMore}
            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-6 py-2 transition-colors duration-100"
          >
            {loadingMore ? (
              <CircleNotch size={12} weight="bold" className="animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

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
