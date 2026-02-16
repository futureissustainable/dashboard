import { NextRequest, NextResponse } from "next/server";
import { getFileContent, createOrUpdateFile } from "@/lib/github";

const SYNC_PATH = "data/tasks.json";

export async function GET() {
  try {
    const { content, sha } = await getFileContent(SYNC_PATH);
    const data = JSON.parse(content);
    return NextResponse.json({ data, sha });
  } catch (err: unknown) {
    // File doesn't exist yet — first sync
    if (err instanceof Error && err.message.includes("404")) {
      return NextResponse.json({ data: null, sha: null });
    }
    console.error("Sync GET error:", err);
    return NextResponse.json(
      { error: "Failed to read sync data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projects, sortMode, lastModified } = body;

    if (!Array.isArray(projects) || typeof lastModified !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = JSON.stringify(
      { projects, sortMode, lastModified },
      null,
      2
    );

    // Get current sha if file exists (needed for updates)
    let sha: string | undefined;
    try {
      const existing = await getFileContent(SYNC_PATH);
      sha = existing.sha;
    } catch {
      // File doesn't exist yet — will create
    }

    await createOrUpdateFile(
      SYNC_PATH,
      payload,
      "sync: tasks updated",
      sha
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sync PUT error:", err);
    return NextResponse.json(
      { error: "Failed to write sync data" },
      { status: 500 }
    );
  }
}
