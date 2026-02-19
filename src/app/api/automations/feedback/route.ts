import { NextResponse } from "next/server";
import {
  createOrUpdateFile,
  getFileContent,
  getDirectoryListing,
} from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const platforms = ["reddit", "linkedin", "instagram"];
    const allFeedback: Record<string, unknown>[] = [];

    for (const platform of platforms) {
      const files = await getDirectoryListing(
        `claude_automation/feedback/${platform}`
      );
      for (const f of files) {
        if (f.name.endsWith(".json")) {
          try {
            const { content } = await getFileContent(f.path);
            allFeedback.push(JSON.parse(content));
          } catch {
            // skip malformed
          }
        }
      }
    }

    return NextResponse.json({ feedback: allFeedback });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

const VALID_PLATFORMS = ["reddit", "linkedin", "instagram"];
const VALID_STATUSES = ["approved", "denied"];

function feedbackPathForPost(platform: string, postFile: string): string {
  const slug = postFile.replace(/\.md$/, "");
  return `claude_automation/feedback/${platform}/${slug}.json`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, date, postFile, status, score, feedback } = body;

    if (!platform || !date || !postFile || !status || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (platform, date, postFile, status, score)" },
        { status: 400 }
      );
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status (must be approved or denied)" },
        { status: 400 }
      );
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Look up hook_id from post frontmatter, then lever from hooks file
    let hookId = "";
    let lever = "";
    try {
      const postPath = `claude_automation/output/${platform}/${postFile}`;
      const { content: postContent } = await getFileContent(postPath);
      const fmMatch = postContent.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const hookIdMatch = fmMatch[1].match(/hook_id:\s*"?([^"\n]+)"?/);
        if (hookIdMatch) {
          hookId = hookIdMatch[1].trim();
          // Find lever from hooks file
          const hooksPath = `claude_automation/hooks/${platform}/${date}.json`;
          try {
            const { content: hooksContent } = await getFileContent(hooksPath);
            const hooksData = JSON.parse(hooksContent);
            const hook = hooksData.hooks?.find((h: { id: string }) => h.id === hookId);
            if (hook) lever = hook.psychological_lever || "";
          } catch {
            // hooks file may not exist for older posts
          }
        }
      }
    } catch {
      // post file read failed, skip lever lookup
    }

    const feedbackData = {
      platform,
      date,
      postFile,
      status,
      score,
      feedback: feedback || "",
      reviewedAt: new Date().toISOString(),
      hook_id: hookId,
      psychological_lever: lever,
    };

    const path = feedbackPathForPost(platform, postFile);
    const content = JSON.stringify(feedbackData, null, 2);
    const message = `feedback: ${platform} ${date} — ${status} (${score}/100)`;

    // Check if file already exists (re-review)
    let existingSha: string | undefined;
    try {
      const existing = await getFileContent(path);
      existingSha = existing.sha;
    } catch {
      // file doesn't exist yet, that's fine
    }

    await createOrUpdateFile(path, content, message, existingSha);

    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { platform, date, engagement } = body;

    if (!platform || !date || !engagement) {
      return NextResponse.json(
        { error: "Missing required fields (platform, date, engagement)" },
        { status: 400 }
      );
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    if (!engagement.metrics || typeof engagement.metrics !== "object") {
      return NextResponse.json(
        { error: "engagement.metrics must be an object" },
        { status: 400 }
      );
    }

    if (!body.postFile) {
      return NextResponse.json(
        { error: "Missing required field: postFile" },
        { status: 400 }
      );
    }

    const path = feedbackPathForPost(platform, body.postFile);

    let existing;
    try {
      existing = await getFileContent(path);
    } catch {
      // Fall back to legacy date-based path
      try {
        existing = await getFileContent(`claude_automation/feedback/${platform}/${date}.json`);
      } catch {
        return NextResponse.json(
          { error: "No feedback found for this post. Approve/deny the post first." },
          { status: 404 }
        );
      }
    }

    const feedbackData = JSON.parse(existing.content);
    feedbackData.engagement = {
      recordedAt: new Date().toISOString(),
      metrics: engagement.metrics,
      notes: engagement.notes || "",
    };
    feedbackData.summarized = false;

    const content = JSON.stringify(feedbackData, null, 2);
    const metricSummary = Object.entries(engagement.metrics)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");
    const message = `engagement: ${platform} ${date} — ${metricSummary}`;

    await createOrUpdateFile(path, content, message, existing.sha);

    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Failed to save engagement:", error);
    return NextResponse.json(
      { error: "Failed to save engagement" },
      { status: 500 }
    );
  }
}
