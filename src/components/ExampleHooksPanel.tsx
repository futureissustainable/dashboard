"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Trash,
  FloppyDisk,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import type { ExampleHook, Platform } from "@/lib/types";

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: "reddit", label: "Reddit", color: "#FF4500" },
  { value: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { value: "instagram", label: "Instagram", color: "#E1306C" },
];

type PlatformExamples = {
  platform: Platform;
  examples: ExampleHook[];
  sha: string | null;
};

let nextId = 1;
function genId() {
  return `ex${Date.now()}-${nextId++}`;
}

export default function ExampleHooksPanel({
  onBack,
}: {
  onBack: () => void;
}) {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [data, setData] = useState<Record<Platform, PlatformExamples>>({
    reddit: { platform: "reddit", examples: [], sha: null },
    linkedin: { platform: "linkedin", examples: [], sha: null },
    instagram: { platform: "instagram", examples: [], sha: null },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automations/hooks/examples");
      const json = await res.json();
      const map: Record<Platform, PlatformExamples> = {
        reddit: { platform: "reddit", examples: [], sha: null },
        linkedin: { platform: "linkedin", examples: [], sha: null },
        instagram: { platform: "instagram", examples: [], sha: null },
      };
      for (const entry of json.examples || []) {
        if (map[entry.platform as Platform]) {
          map[entry.platform as Platform] = {
            platform: entry.platform,
            examples: entry.examples || [],
            sha: entry.sha || null,
          };
        }
      }
      setData(map);
    } catch (e) {
      console.error("Failed to fetch example hooks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const examples = data[platform].examples;

  const addHook = () => {
    const newHook: ExampleHook = {
      id: genId(),
      hook_text: "",
      angle: "",
      psychological_lever: "",
      notes: "",
    };
    setData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        examples: [...prev[platform].examples, newHook],
      },
    }));
    setDirty(true);
  };

  const updateHook = (id: string, field: keyof ExampleHook, value: string) => {
    setData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        examples: prev[platform].examples.map((h) =>
          h.id === id ? { ...h, [field]: value } : h
        ),
      },
    }));
    setDirty(true);
  };

  const removeHook = (id: string) => {
    setData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        examples: prev[platform].examples.filter((h) => h.id !== id),
      },
    }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/automations/hooks/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          examples: examples.filter((h) => h.hook_text.trim()),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Failed to save example hooks:", e);
    } finally {
      setSaving(false);
    }
  };

  const platInfo = PLATFORMS.find((p) => p.value === platform)!;

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted hover:text-foreground p-1 transition-colors duration-100"
          >
            <ArrowLeft size={14} weight="bold" />
          </button>
          <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider">
            Example Hooks
          </h2>
          <span className="font-mono text-[10px] text-muted">
            Your inspiration for the AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider border px-3 py-1.5 transition-colors duration-100 ${
              saved
                ? "text-green-400 border-green-400/40"
                : dirty
                ? "text-foreground border-foreground hover:bg-foreground/5"
                : "text-muted border-border cursor-not-allowed"
            }`}
          >
            {saving ? (
              <CircleNotch size={12} weight="bold" className="animate-spin" />
            ) : saved ? (
              <Check size={12} weight="bold" />
            ) : (
              <FloppyDisk size={12} weight="bold" />
            )}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-6 lg:px-8 py-2 border-b border-border flex-shrink-0">
        {PLATFORMS.map((p) => {
          const count = data[p.value].examples.length;
          return (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors duration-100 flex items-center gap-2 ${
                platform === p.value
                  ? "text-foreground border-foreground"
                  : "text-muted border-border hover:text-foreground-secondary hover:border-foreground-secondary"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.label}
              {count > 0 && (
                <span className="text-[9px] tabular-nums text-muted">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <CircleNotch
              size={20}
              weight="bold"
              className="animate-spin text-muted"
            />
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-3xl mx-auto">
            <p className="text-[11px] text-muted leading-relaxed">
              Write high-quality hooks the AI should learn from. These get read
              before every Phase 1 generation as gold-standard examples.
            </p>

            {examples.map((hook, i) => (
              <div
                key={hook.id}
                className="border border-border bg-surface p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                    Example {i + 1}
                  </span>
                  <button
                    onClick={() => removeHook(hook.id)}
                    className="text-muted hover:text-red-400 p-1 transition-colors duration-100"
                    title="Remove"
                  >
                    <Trash size={12} weight="bold" />
                  </button>
                </div>

                {/* Hook text */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground-secondary mb-1">
                    Hook text
                    <span className="text-yellow-400 ml-1">(required)</span>
                  </label>
                  <textarea
                    value={hook.hook_text}
                    onChange={(e) =>
                      updateHook(hook.id, "hook_text", e.target.value)
                    }
                    placeholder="The opening line / title that hooks the reader..."
                    rows={2}
                    className="w-full bg-background border border-border p-2 text-[12px] font-mono leading-relaxed resize-none focus:border-foreground transition-colors"
                  />
                </div>

                {/* Angle */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground-secondary mb-1">
                    Angle
                  </label>
                  <input
                    type="text"
                    value={hook.angle || ""}
                    onChange={(e) =>
                      updateHook(hook.id, "angle", e.target.value)
                    }
                    placeholder="What direction would the full post take?"
                    className="w-full bg-background border border-border p-2 text-[12px] font-mono focus:border-foreground transition-colors"
                  />
                </div>

                {/* Two columns: lever + notes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground-secondary mb-1">
                      Psychological lever
                    </label>
                    <input
                      type="text"
                      value={hook.psychological_lever || ""}
                      onChange={(e) =>
                        updateHook(
                          hook.id,
                          "psychological_lever",
                          e.target.value
                        )
                      }
                      placeholder="e.g., cost savings, parental fear"
                      className="w-full bg-background border border-border p-2 text-[12px] font-mono focus:border-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground-secondary mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={hook.notes || ""}
                      onChange={(e) =>
                        updateHook(hook.id, "notes", e.target.value)
                      }
                      placeholder="Why is this hook good?"
                      className="w-full bg-background border border-border p-2 text-[12px] font-mono focus:border-foreground transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add hook button */}
            <button
              onClick={addHook}
              className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-foreground border border-dashed border-border hover:border-foreground p-4 transition-colors duration-100"
            >
              <Plus size={12} weight="bold" />
              Add example hook
            </button>

            {/* Platform hint */}
            <div className="text-[10px] text-muted font-mono leading-relaxed border-t border-border pt-4 mt-6">
              <span style={{ color: platInfo.color }}>
                {platInfo.label.toUpperCase()}
              </span>{" "}
              — These examples will be read by the{" "}
              {platInfo.label} hook generator before every run.
              Write hooks you wish the AI would come up with. The more specific
              and varied, the better.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
