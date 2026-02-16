import { NextResponse } from "next/server";
import { getFileContent, createOrUpdateFile } from "@/lib/github";
import { EDITABLE_DOCS } from "@/lib/docs-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const docId = searchParams.get("id");

  if (!docId) {
    return NextResponse.json({
      docs: EDITABLE_DOCS.map((d) => ({
        id: d.id,
        label: d.label,
        group: d.group,
      })),
    });
  }

  const doc = EDITABLE_DOCS.find((d) => d.id === docId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const { content, sha } = await getFileContent(doc.path);
    return NextResponse.json({
      id: doc.id,
      label: doc.label,
      group: doc.group,
      content,
      sha,
    });
  } catch (error) {
    console.error("Failed to fetch doc:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, content, sha } = body;

    if (!id || !content || !sha) {
      return NextResponse.json(
        { error: "Missing required fields (id, content, sha)" },
        { status: 400 }
      );
    }

    const doc = EDITABLE_DOCS.find((d) => d.id === id);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const message = `docs: update ${doc.label}`;
    await createOrUpdateFile(doc.path, content, message, sha);

    // Fetch the new sha after update
    const updated = await getFileContent(doc.path);

    return NextResponse.json({ success: true, sha: updated.sha });
  } catch (error) {
    console.error("Failed to update doc:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
