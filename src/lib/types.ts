// Shared types for the two-phase content generation system

export type Platform = "reddit" | "linkedin" | "instagram";

// --- Hooks (Phase 1) ---

export type Hook = {
  id: string; // "h01"..."h10"
  hook_text: string;
  angle: string;
  psychological_lever: string;
  target_audience: string;
  differentiation: string;
  platform_meta: Record<string, string>;
};

export type HookReview = {
  reviewed_at: string;
  approved_hook_ids: string[];
  hook_feedback: Record<string, { score: number; feedback?: string }>;
};

export type HooksFile = {
  platform: Platform;
  date: string;
  pillar: string;
  generated_at: string;
  status: "pending" | "reviewed";
  hooks: Hook[];
  review?: HookReview;
};

export type HookSet = HooksFile & {
  filePath: string;
  sha: string;
};

// --- Example Hooks (user-written inspiration for AI) ---

export type ExampleHook = {
  id: string;
  hook_text: string;
  angle?: string;
  psychological_lever?: string;
  notes?: string;
};

export type ExampleHooksFile = {
  platform: Platform;
  updated_at: string;
  examples: ExampleHook[];
};
