import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || "futureissustainable/dashboard";

const WORKFLOWS = [
  "daily-reddit-posts.yml",
  "daily-linkedin-posts.yml",
  "daily-instagram-posts.yml",
];

export async function POST() {
  try {
    const results = await Promise.allSettled(
      WORKFLOWS.map(async (workflow) => {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflow}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({ ref: "main" }),
          }
        );

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`${workflow}: ${res.status} — ${err}`);
        }

        return workflow;
      })
    );

    const triggered: string[] = [];
    const failed: string[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") triggered.push(r.value);
      else failed.push(r.reason?.message || "Unknown error");
    }

    return NextResponse.json({ triggered, failed });
  } catch (error) {
    console.error("Failed to trigger workflows:", error);
    return NextResponse.json(
      { error: "Failed to trigger workflows" },
      { status: 500 }
    );
  }
}
