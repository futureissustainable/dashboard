import { NextResponse } from "next/server";
import { getDirectoryListing, getFileContent } from "@/lib/github";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

const PLATFORMS = ["reddit", "linkedin", "instagram"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get("platform");
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const platforms = platformFilter
      ? [platformFilter as (typeof PLATFORMS)[number]]
      : [...PLATFORMS];

    // Fetch directory listings for all platforms in parallel
    const [listings, feedbackListings] = await Promise.all([
      Promise.all(
        platforms.map(async (p) => {
          const files = await getDirectoryListing(
            `claude_automation/output/${p}`
          );
          return files
            .filter((f) => f.name.endsWith(".md") && f.name !== ".gitkeep")
            .map((f) => ({ ...f, platform: p }));
        })
      ),
      Promise.all(
        platforms.map(async (p) => {
          const files = await getDirectoryListing(
            `claude_automation/feedback/${p}`
          );
          return { platform: p, files };
        })
      ),
    ]);

    // Build feedback lookup
    const feedbackMap = new Map<string, string>();
    for (const { platform, files } of feedbackListings) {
      for (const f of files) {
        if (f.name.endsWith(".json")) {
          feedbackMap.set(`${platform}/${f.name}`, f.path);
        }
      }
    }

    // Flatten and sort by filename (date prefix) descending
    const allFiles = listings
      .flat()
      .sort((a, b) => b.name.localeCompare(a.name));

    // Paginate
    const paginated = allFiles.slice(offset, offset + limit);

    // Fetch content for each file in parallel (batched)
    const posts = await Promise.all(
      paginated.map(async (file) => {
        const { content, sha } = await getFileContent(file.path);
        const { data: frontmatter, content: body } = matter(content);
        const date = file.name.slice(0, 10);
        const slug = file.name.slice(11).replace(/\.md$/, "");

        // Check for feedback
        let feedback = undefined;
        const feedbackKey = `${file.platform}/${date}.json`;
        const feedbackPath = feedbackMap.get(feedbackKey);
        if (feedbackPath) {
          try {
            const fb = await getFileContent(feedbackPath);
            feedback = JSON.parse(fb.content);
          } catch {
            // feedback file may be malformed, skip
          }
        }

        return {
          platform: file.platform,
          date,
          slug,
          filePath: file.path,
          sha,
          frontmatter,
          body: body.trim(),
          feedback,
        };
      })
    );

    return NextResponse.json({
      posts,
      total: allFiles.length,
      hasMore: offset + limit < allFiles.length,
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
