"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, FloppyDisk, CircleNotch } from "@phosphor-icons/react";

type DocMeta = { id: string; label: string; group: string };
type DocFull = DocMeta & { content: string; sha: string };

const GROUPS = ["Reddit", "LinkedIn", "Instagram", "Company", "System"];

export default function DocsEditor({ onBack }: { onBack: () => void }) {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocFull | null>(null);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/automations/docs")
      .then((r) => r.json())
      .then((d) => setDocs(d.docs || []))
      .catch(console.error);
  }, []);

  const loadDoc = useCallback(
    async (id: string) => {
      if (dirty && !window.confirm("You have unsaved changes. Discard?"))
        return;
      setLoading(true);
      setDirty(false);
      setSaveMsg("");
      try {
        const res = await fetch(`/api/automations/docs?id=${id}`);
        const data = await res.json();
        setActiveDoc(data);
        setDraft(data.content);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [dirty]
  );

  const saveDoc = useCallback(async () => {
    if (!activeDoc || !dirty) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/automations/docs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeDoc.id,
          content: draft,
          sha: activeDoc.sha,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveDoc((prev) => (prev ? { ...prev, sha: data.sha, content: draft } : null));
        setDirty(false);
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg("Error: " + (data.error || "unknown"));
      }
    } catch (e) {
      setSaveMsg("Network error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [activeDoc, draft, dirty]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDoc();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDoc]);

  const grouped = GROUPS.map((g) => ({
    group: g,
    items: docs.filter((d) => d.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to Feed
        </button>
        {activeDoc && (
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className={`font-mono text-[11px] ${saveMsg === "Saved" ? "text-green-400" : "text-red-400"}`}>
                {saveMsg}
              </span>
            )}
            {dirty && (
              <span className="font-mono text-[10px] text-yellow-500 uppercase tracking-wider">
                Unsaved
              </span>
            )}
            <button
              onClick={saveDoc}
              disabled={!dirty || saving}
              className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider border px-3 py-1.5 transition-colors ${
                dirty && !saving
                  ? "text-foreground border-foreground hover:bg-foreground/10"
                  : "text-muted border-border cursor-not-allowed"
              }`}
            >
              {saving ? (
                <CircleNotch size={12} weight="bold" className="animate-spin" />
              ) : (
                <FloppyDisk size={12} weight="bold" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-border overflow-y-auto flex-shrink-0 py-3">
          {grouped.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted px-4 mb-2">
                {group}
              </div>
              {items.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => loadDoc(doc.id)}
                  className={`w-full text-left px-4 py-1.5 text-[12px] font-mono transition-colors ${
                    activeDoc?.id === doc.id
                      ? "text-foreground bg-hover"
                      : "text-muted hover:text-foreground-secondary hover:bg-surface"
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Editor pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <CircleNotch size={20} weight="bold" className="animate-spin text-muted" />
            </div>
          )}

          {!loading && !activeDoc && (
            <div className="flex items-center justify-center h-full text-[12px] text-muted font-mono">
              Select a document
            </div>
          )}

          {!loading && activeDoc && (
            <>
              <div className="px-4 py-2 border-b border-border-light flex-shrink-0">
                <span className="font-mono text-[12px] text-foreground-secondary">
                  {activeDoc.label}
                </span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setDirty(true);
                }}
                className="flex-1 w-full bg-transparent p-4 text-[12px] font-mono leading-relaxed resize-none text-foreground-secondary focus:text-foreground transition-colors"
                spellCheck={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
