import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || "futureissustainable/dashboard";

const PHASE2_WORKFLOWS: Record<string, string> = {
  reddit: "posts-reddit.yml",
  linkedin: "posts-linkedin.yml",
  instagram: "posts-instagram.yml",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, date, hook_ids } = body;

    if (!platform || !date) {
      return NextResponse.json(
        { error: "Missing required fields (platform, date)" },
        { status: 400 }
      );
    }

    const workflow = PHASE2_WORKFLOWS[platform];
    if (!workflow) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            date,
            hook_ids: Array.isArray(hook_ids) ? hook_ids.join(",") : "",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Failed to trigger ${workflow}: ${res.status} — ${err}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      triggered: workflow,
      hookCount: Array.isArray(hook_ids) ? hook_ids.length : 0,
    });
  } catch (error) {
    console.error("Failed to trigger Phase 2:", error);
    return NextResponse.json(
      { error: "Failed to trigger Phase 2 workflow" },
      { status: 500 }
    );
  }
}
