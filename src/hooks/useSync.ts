"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";

async function pushToRemote(state: {
  projects: unknown[];
  sortMode: string;
  lastModified: number;
}) {
  await fetch("/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projects: state.projects,
      sortMode: state.sortMode,
      lastModified: state.lastModified,
    }),
  });
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const initialSyncDone = useRef(false);
  const skipNextPush = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial sync on mount
  useEffect(() => {
    let cancelled = false;

    async function initialSync() {
      setSyncing(true);
      try {
        const res = await fetch("/api/sync");
        if (!res.ok) throw new Error("Sync fetch failed");
        const { data } = await res.json();

        if (cancelled) return;

        const store = useStore.getState();
        const localModified = store.lastModified || 0;
        const localHasData = store.projects.length > 0;

        if (data && data.lastModified > localModified) {
          // Remote is newer — pull
          skipNextPush.current = true;
          store.setRemoteState(data.projects, data.sortMode, data.lastModified);
        } else if (localHasData && (!data || localModified > (data.lastModified || 0))) {
          // Local is newer or no remote — push
          await pushToRemote(store);
        }

        setLastSynced(Date.now());
      } catch (err) {
        console.error("Initial sync failed:", err);
      } finally {
        if (!cancelled) {
          setSyncing(false);
          initialSyncDone.current = true;
        }
      }
    }

    initialSync();
    return () => { cancelled = true; };
  }, []);

  // Subscribe to store changes and debounce push
  const debouncedPush = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const state = useStore.getState();
      setSyncing(true);
      try {
        await pushToRemote(state);
        setLastSynced(Date.now());
      } catch (err) {
        console.error("Sync push failed:", err);
      } finally {
        setSyncing(false);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (!initialSyncDone.current) return;

      // Skip the push triggered by pulling remote state
      if (skipNextPush.current) {
        skipNextPush.current = false;
        return;
      }

      // Only sync when data actually changed
      if (
        state.projects === prevState.projects &&
        state.sortMode === prevState.sortMode
      ) {
        return;
      }

      debouncedPush();
    });

    return () => {
      unsub();
      clearTimeout(debounceTimer.current);
    };
  }, [debouncedPush]);

  return { syncing, lastSynced };
}
