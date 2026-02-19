"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowClockwise,
  Check,
  CircleNotch,
  FileText,
  Lightbulb,
  Lightning,
  WarningCircle,
  Sparkle,
  Article,
} from "@phosphor-icons/react";
import PostCard, { type PostEntry } from "./PostCard";
import FeedbackModal from "./FeedbackModal";
import EngagementModal from "./EngagementModal";
import RerollModal from "./RerollModal";
import DocsEditor from "./DocsEditor";
import ExampleHooksPanel from "./ExampleHooksPanel";
import WorkflowColumn, { ColumnSection } from "./WorkflowColumn";
import HookSetCard from "./HookSetCard";
import type { HookSet, Platform } from "@/lib/types";

type Filter = "all" | "reddit" | "linkedin" | "instagram";
type MobileTab = "hooks" | "posts";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reddit", label: "Reddit" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
];

export default function AutomationsPanel() {
  const [view, setView] = useState<"feed" | "docs" | "examples">("feed");
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Hooks state
  const [hookSets, setHookSets] = useState<HookSet[]>([]);

  // Mobile tab (visible below lg breakpoint)
  const [mobileTab, setMobileTab] = useState<MobileTab>("hooks");

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

  // Hook review — handled inline by HookSetCard
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

    // Update local state so the card moves from pending → reviewed
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

  // ── Full-takeover views ──

  if (view === "docs") {
    return (
      <div className="h-[calc(100vh-72px)]">
        <DocsEditor onBack={() => setView("feed")} />
      </div>
    );
  }

  if (view === "examples") {
    return <ExampleHooksPanel onBack={() => setView("feed")} />;
  }

  // ── Data categorization ──

  // Hooks
  const pendingHooks = hookSets.filter((hs) => hs.status === "pending");
  const reviewedHooks = hookSets.filter(
    (hs) => hs.status === "reviewed" && hs.review && hs.review.approved_hook_ids.length > 0
  );
  const totalHooks = pendingHooks.length + reviewedHooks.length;

  // Posts by status
  const pendingPosts = posts.filter((p) => !p.feedback);
  const approvedPosts = posts.filter(
    (p) => p.feedback?.status === "approved" && !p.feedback.engagement
  );
  const completedPosts = posts.filter(
    (p) => p.feedback?.status === "approved" && !!p.feedback.engagement
  );
  const deniedPosts = posts.filter((p) => p.feedback?.status === "denied");
  const totalPosts = posts.length;

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-[var(--space-4)] sm:px-[var(--space-6)] lg:px-[var(--space-12)] py-[var(--space-3)] border-b border-border flex-shrink-0">
        <div className="flex items-center gap-[var(--space-1)]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`font-mono text-[var(--fs-p-sm)] uppercase tracking-wider px-[var(--space-3)] py-[var(--space-2)] border transition-colors duration-100 ${
                filter === f.value
                  ? "text-foreground border-foreground"
                  : "text-muted border-border hover:text-foreground-secondary hover:border-foreground-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="font-mono text-[11px] text-muted tabular-nums ml-[var(--space-3)]">
            {total} post{total !== 1 ? "s" : ""}
          </span>
          {pendingHooks.length > 0 && (
            <span className="flex items-center gap-[var(--space-2)] ml-[var(--space-2)]">
              <span className="w-1.5 h-1.5 bg-yellow-400 animate-pulse flex-shrink-0" />
              <span className="font-mono text-[11px] text-yellow-400 tabular-nums">
                {pendingHooks.length} hook{pendingHooks.length !== 1 ? "s" : ""} pending
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-[var(--space-2)]">
          <button
            onClick={() => setView("examples")}
            className="flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-[var(--space-3)] py-[var(--space-2)] transition-colors duration-100"
          >
            <Lightbulb size={14} weight="bold" />
            <span className="hidden sm:inline">Examples</span>
          </button>
          <button
            onClick={() => setView("docs")}
            className="flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-[var(--space-3)] py-[var(--space-2)] transition-colors duration-100"
          >
            <FileText size={14} weight="bold" />
            <span className="hidden sm:inline">Docs</span>
          </button>
          <button
            onClick={() => {
              fetchPosts();
              fetchHooks();
            }}
            disabled={loading}
            className="text-muted hover:text-foreground p-[var(--space-2)] transition-colors duration-100"
            title="Refresh"
          >
            <ArrowClockwise
              size={14}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
          </button>
          <div className="flex items-center gap-[var(--space-2)]">
            <button
              onClick={triggerAll}
              disabled={runStatus === "running"}
              className={`p-[var(--space-2)] transition-colors duration-100 ${
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
              <span
                className={`font-mono text-[11px] transition-opacity duration-200 ${
                  runStatus === "success"
                    ? "text-green-400"
                    : runStatus === "error"
                    ? "text-red-400"
                    : "text-muted"
                }`}
              >
                {runMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile tab switcher (below lg) ── */}
      <div className="flex items-center gap-[var(--space-1)] px-[var(--space-4)] sm:px-[var(--space-6)] py-[var(--space-2)] border-b border-border lg:hidden flex-shrink-0">
        <button
          onClick={() => setMobileTab("hooks")}
          className={`flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider px-[var(--space-3)] py-[var(--space-2)] border transition-colors duration-100 ${
            mobileTab === "hooks"
              ? "text-foreground border-foreground"
              : "text-muted border-border hover:text-foreground-secondary"
          }`}
        >
          <Sparkle size={12} weight="bold" />
          Hooks
          {pendingHooks.length > 0 && (
            <span className="w-1.5 h-1.5 bg-yellow-400 animate-pulse flex-shrink-0" />
          )}
        </button>
        <button
          onClick={() => setMobileTab("posts")}
          className={`flex items-center gap-[var(--space-2)] font-mono text-[var(--fs-p-sm)] uppercase tracking-wider px-[var(--space-3)] py-[var(--space-2)] border transition-colors duration-100 ${
            mobileTab === "posts"
              ? "text-foreground border-foreground"
              : "text-muted border-border hover:text-foreground-secondary"
          }`}
        >
          <Article size={12} weight="bold" />
          Posts
          {pendingPosts.length > 0 && (
            <span className="font-mono text-[10px] tabular-nums text-yellow-400 ml-[var(--space-1)]">
              ({pendingPosts.length})
            </span>
          )}
        </button>
      </div>

      {/* ── Two-column layout ── */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <CircleNotch size={20} weight="bold" className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-[var(--space-3)] sm:gap-[var(--space-4)] p-[var(--space-3)] sm:p-[var(--space-4)] lg:p-[var(--space-6)] flex-1 overflow-hidden">
          {/* ════════════════════════════════════════════════
              COLUMN 1: HOOKS — Content angles & ideas
              Expands inline — no page navigation
              ════════════════════════════════════════════════ */}
          <WorkflowColumn
            title="Hooks"
            icon={<Sparkle size={14} weight="bold" className="text-yellow-400" />}
            count={totalHooks}
            index={0}
            emptyMessage="No hooks generated yet"
            className={`${mobileTab === "hooks" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Pending: needs review */}
            {pendingHooks.length > 0 && (
              <>
                <div className="flex items-center gap-[var(--space-2)] pb-[var(--space-1)]">
                  <span className="w-1.5 h-1.5 bg-yellow-400 animate-pulse flex-shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-yellow-400">
                    Needs review
                  </span>
                </div>
                {pendingHooks.map((hs) => (
                  <HookSetCard
                    key={`pending-${hs.platform}-${hs.date}`}
                    hookSet={hs}
                    onSubmitReview={handleHookReviewSubmit}
                    onTriggerPhase2={handleTriggerPhase2}
                  />
                ))}
              </>
            )}

            {/* Reviewed: can write posts */}
            {reviewedHooks.length > 0 && (
              <>
                {pendingHooks.length > 0 ? (
                  <ColumnSection label="Reviewed" count={reviewedHooks.length} />
                ) : (
                  <div className="flex items-center gap-[var(--space-2)] pb-[var(--space-1)]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-green-400">
                      Reviewed
                    </span>
                  </div>
                )}
                {reviewedHooks.map((hs) => (
                  <HookSetCard
                    key={`reviewed-${hs.platform}-${hs.date}`}
                    hookSet={hs}
                    onSubmitReview={handleHookReviewSubmit}
                    onTriggerPhase2={handleTriggerPhase2}
                  />
                ))}
              </>
            )}
          </WorkflowColumn>

          {/* ════════════════════════════════════════════════
              COLUMN 2: POSTS — Written content
              ════════════════════════════════════════════════ */}
          <WorkflowColumn
            title="Posts"
            icon={<Article size={14} weight="bold" className="text-foreground-secondary" />}
            count={totalPosts}
            index={1}
            emptyMessage="No posts yet — review hooks to generate posts"
            className={`${mobileTab === "posts" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Pending review */}
            {pendingPosts.length > 0 && (
              <>
                <div className="flex items-center gap-[var(--space-2)] pb-[var(--space-1)]">
                  <span className="w-1.5 h-1.5 bg-yellow-400 animate-pulse flex-shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-yellow-400">
                    Needs review ({pendingPosts.length})
                  </span>
                </div>
                {pendingPosts.map((post) => (
                  <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                    <PostCard
                      post={post}
                      onReview={handleReview}
                      compact
                    />
                  </div>
                ))}
              </>
            )}

            {/* Approved, awaiting engagement */}
            {approvedPosts.length > 0 && (
              <>
                <ColumnSection label="Approved" count={approvedPosts.length} />
                {approvedPosts.map((post) => (
                  <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                    <PostCard
                      post={post}
                      onReview={handleReview}
                      onAddResults={setEngagementTarget}
                      compact
                    />
                  </div>
                ))}
              </>
            )}

            {/* Completed: has engagement data */}
            {completedPosts.length > 0 && (
              <>
                <ColumnSection label="Results tracked" count={completedPosts.length} />
                {completedPosts.map((post) => (
                  <div key={`${post.platform}-${post.date}-${post.slug}`} className="card-enter">
                    <PostCard
                      post={post}
                      onReview={handleReview}
                      onAddResults={setEngagementTarget}
                      compact
                    />
                  </div>
                ))}
              </>
            )}

            {/* Denied */}
            {deniedPosts.length > 0 && (
              <>
                <ColumnSection label="Denied" count={deniedPosts.length} muted />
                {deniedPosts.map((post) => (
                  <div
                    key={`denied-${post.platform}-${post.date}-${post.slug}`}
                    className="card-enter opacity-60"
                  >
                    <PostCard
                      post={post}
                      onReview={handleReview}
                      onReroll={setRerollTarget}
                      compact
                    />
                  </div>
                ))}
              </>
            )}
          </WorkflowColumn>
        </div>
      )}

      {/* ── Load More ── */}
      {hasMore && !loading && (
        <div className="flex justify-center py-[var(--space-3)] border-t border-border flex-shrink-0">
          <button
            onClick={() => fetchPosts(posts.length, true)}
            disabled={loadingMore}
            className="font-mono text-[var(--fs-p-sm)] uppercase tracking-wider text-muted hover:text-foreground border border-border hover:border-foreground px-[var(--space-6)] py-[var(--space-2)] transition-colors duration-100"
          >
            {loadingMore ? (
              <CircleNotch size={14} weight="bold" className="animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {reviewTarget && (
        <FeedbackModal
          post={reviewTarget.post}
          status={reviewTarget.status}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
      {engagementTarget && (
        <EngagementModal
          post={engagementTarget}
          onClose={() => setEngagementTarget(null)}
          onSubmit={handleEngagementSubmit}
        />
      )}
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
