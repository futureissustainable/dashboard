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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, date, postFile, status, score, feedback } = body;

    if (!platform || !date || !status || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const feedbackData = {
      platform,
      date,
      postFile,
      status,
      score,
      feedback: feedback || "",
      reviewedAt: new Date().toISOString(),
    };

    const path = `claude_automation/feedback/${platform}/${date}.json`;
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
