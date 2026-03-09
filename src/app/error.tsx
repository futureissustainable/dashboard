"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="font-mono text-[16px] font-bold text-foreground mb-4">
          Something went wrong
        </h2>
        <pre className="text-[11px] font-mono text-red-400 bg-surface border border-border p-4 mb-6 text-left overflow-auto max-h-48 whitespace-pre-wrap break-words">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
          {error.stack && `\n\n${error.stack}`}
        </pre>
        <button
          onClick={reset}
          className="font-mono text-[11px] uppercase tracking-wider border border-border px-6 py-2.5 text-muted hover:text-foreground hover:border-foreground transition-colors duration-100"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
