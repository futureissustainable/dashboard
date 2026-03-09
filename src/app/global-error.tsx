"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body style={{ background: "#000", color: "#fff", fontFamily: "monospace", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>
              Application Error
            </h2>
            <pre style={{
              fontSize: "11px",
              color: "#f87171",
              background: "#080808",
              border: "1px solid #222",
              padding: "16px",
              marginBottom: "24px",
              textAlign: "left",
              overflow: "auto",
              maxHeight: "200px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\n${error.stack}`}
            </pre>
            <button
              onClick={reset}
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "1px solid #222",
                padding: "10px 24px",
                color: "#666",
                background: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
