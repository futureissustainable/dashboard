import { NextResponse } from "next/server";
import {
  getDirectoryListing,
  getFileContent,
  createOrUpdateFile,
} from "@/lib/github";
import type { HooksFile, HookSet } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLATFORMS = ["reddit", "linkedin", "instagram"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get("platform");
  const statusFilter = searchParams.get("status") || "pending";

  try {
    const platforms =
      platformFilter && PLATFORMS.includes(platformFilter as (typeof PLATFORMS)[number])
        ? [platformFilter as (typeof PLATFORMS)[number]]
        : [...PLATFORMS];

    const results = await Promise.all(
      platforms.map(async (p) => {
        const files = await getDirectoryListing(`claude_automation/hooks/${p}`);
        const jsonFiles = files.filter(
          (f) => f.name.endsWith(".json") && f.name !== ".gitkeep"
        );

        const hookSets: HookSet[] = [];
        for (const f of jsonFiles) {
          try {
            const { content, sha } = await getFileContent(f.path);
            const data: HooksFile = JSON.parse(content);
            if (statusFilter === "all" || data.status === statusFilter) {
              hookSets.push({ ...data, filePath: f.path, sha });
            }
          } catch {
            // skip malformed
          }
        }
        return hookSets;
      })
    );

    const hookSets = results
      .flat()
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ hookSets });
  } catch (error) {
    console.error("Failed to fetch hooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch hooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, date, approved_hook_ids, hook_feedback } = body;

    if (!platform || !date) {
      return NextResponse.json(
        { error: "Missing required fields (platform, date)" },
        { status: 400 }
      );
    }

    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    if (!Array.isArray(approved_hook_ids)) {
      return NextResponse.json(
        { error: "approved_hook_ids must be an array" },
        { status: 400 }
      );
    }

    // Read existing hooks file
    const path = `claude_automation/hooks/${platform}/${date}.json`;
    let existing;
    try {
      existing = await getFileContent(path);
    } catch {
      return NextResponse.json(
        { error: `No hooks found for ${platform} on ${date}` },
        { status: 404 }
      );
    }

    const hooksData: HooksFile = JSON.parse(existing.content);

    // Update with review
    hooksData.status = "reviewed";
    hooksData.review = {
      reviewed_at: new Date().toISOString(),
      approved_hook_ids: approved_hook_ids,
      hook_feedback: hook_feedback || {},
    };

    const content = JSON.stringify(hooksData, null, 2);
    const approvedCount = approved_hook_ids.length;
    const message = `hooks: ${platform} ${date} — ${approvedCount} approved`;

    await createOrUpdateFile(path, content, message, existing.sha);

    return NextResponse.json({
      success: true,
      path,
      approvedCount,
    });
  } catch (error) {
    console.error("Failed to save hook review:", error);
    return NextResponse.json(
      { error: "Failed to save hook review" },
      { status: 500 }
    );
  }
}
