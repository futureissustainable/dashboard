import { NextResponse } from "next/server";
import { getFileContent, createOrUpdateFile } from "@/lib/github";
import type { ExampleHooksFile, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLATFORMS: Platform[] = ["reddit", "linkedin", "instagram"];

function examplesPath(platform: Platform) {
  return `claude_automation/hooks/${platform}/examples.json`;
}

// GET ?platform=... — return example hooks for one or all platforms
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get("platform") as Platform | null;

  const platforms =
    platformFilter && PLATFORMS.includes(platformFilter)
      ? [platformFilter]
      : PLATFORMS;

  try {
    const results = await Promise.all(
      platforms.map(async (p) => {
        try {
          const { content, sha } = await getFileContent(examplesPath(p));
          const data: ExampleHooksFile = JSON.parse(content);
          return { ...data, sha };
        } catch {
          return { platform: p, updated_at: "", examples: [], sha: null };
        }
      })
    );

    return NextResponse.json({ examples: results });
  } catch (error) {
    console.error("Failed to fetch example hooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch example hooks" },
      { status: 500 }
    );
  }
}

// POST — save example hooks for a platform
// Body: { platform, examples: ExampleHook[] }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, examples } = body;

    if (!platform || !PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid or missing platform" },
        { status: 400 }
      );
    }

    if (!Array.isArray(examples)) {
      return NextResponse.json(
        { error: "examples must be an array" },
        { status: 400 }
      );
    }

    const path = examplesPath(platform);
    let sha: string | undefined;
    try {
      const existing = await getFileContent(path);
      sha = existing.sha;
    } catch {
      // File doesn't exist yet — will create
    }

    const data: ExampleHooksFile = {
      platform,
      updated_at: new Date().toISOString(),
      examples,
    };

    const content = JSON.stringify(data, null, 2);
    const message = `hooks: ${platform} examples updated (${examples.length} hooks)`;

    await createOrUpdateFile(path, content, message, sha);

    return NextResponse.json({ success: true, count: examples.length });
  } catch (error) {
    console.error("Failed to save example hooks:", error);
    return NextResponse.json(
      { error: "Failed to save example hooks" },
      { status: 500 }
    );
  }
}
