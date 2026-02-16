"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
        setPassword("");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[280px]">
        <h1 className="font-mono text-[18px] font-bold tracking-[-0.03em] text-foreground mb-10 text-center">
          taskido
        </h1>

        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="password"
            autoFocus
            autoComplete="current-password"
            className={`w-full font-mono text-[13px] border-b py-2 transition-colors duration-100 ${
              error
                ? "border-red-500 text-red-400 placeholder:text-red-500/40"
                : "border-border focus:border-foreground"
            }`}
          />
          {error && (
            <p className="font-mono text-[11px] text-red-500 mt-2 tracking-wide">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full font-mono text-[11px] uppercase tracking-wider border border-border px-4 py-2.5 text-muted hover:text-foreground hover:border-foreground transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "enter"}
        </button>
      </form>
    </div>
  );
}
