import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || "futureissustainable/dashboard";

export const dynamic = "force-dynamic";

// GET: list workflows that support manual dispatch
export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const workflows = (data.workflows || [])
      .filter((w: Record<string, unknown>) => w.state === "active")
      .map((w: Record<string, unknown>) => ({
        id: w.id,
        name: w.name,
        path: w.path,
      }));

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Failed to list workflows:", error);
    return NextResponse.json(
      { error: "Failed to list workflows" },
      { status: 500 }
    );
  }
}

// POST: trigger a workflow via workflow_dispatch
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflow_id } = body;

    if (!workflow_id) {
      return NextResponse.json(
        { error: "Missing workflow_id" },
        { status: 400 }
      );
    }

    // Get default branch
    const repoRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || "main";

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflow_id}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: defaultBranch }),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ success: true });
    }

    const text = await res.text();
    return NextResponse.json(
      { error: `GitHub API error: ${res.status}`, detail: text },
      { status: res.status }
    );
  } catch (error) {
    console.error("Failed to trigger workflow:", error);
    return NextResponse.json(
      { error: "Failed to trigger workflow" },
      { status: 500 }
    );
  }
}
