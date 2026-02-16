const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || "futureissustainable/dashboard";
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
};

export async function getDirectoryListing(
  path: string
): Promise<GitHubFile[]> {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status} for ${path}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((f: Record<string, unknown>) => ({
    name: f.name as string,
    path: f.path as string,
    sha: f.sha as string,
    type: f.type as "file" | "dir",
  }));
}

export async function getFileContent(
  path: string
): Promise<{ content: string; sha: string }> {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} for ${path}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API_BASE}/${path}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API PUT error: ${res.status} — ${err}`);
  }
}
