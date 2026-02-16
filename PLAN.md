# Automations Panel — Implementation Plan

## Overview

Add a second panel to the dashboard that surfaces all 3 BioBuilds automation outputs (Reddit, LinkedIn, Instagram), lets the user approve/deny each post with a score (0-100) and feedback, and supports editing the strategy markdown files directly. All data flows through the GitHub Contents API via Next.js API routes. No Anthropic API. Generation stays in GitHub Actions with the OAuth token.

---

## Phase 0 — Infrastructure

### 0.1 Install dependencies

```
npm install gray-matter react-markdown remark-gfm
```

- `gray-matter` — parse YAML frontmatter from output files
- `react-markdown` + `remark-gfm` — render post content (tables, links, etc.)

### 0.2 Environment variables

Create `.env.local` (gitignored) and configure on Vercel:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPO=futureissustainable/dashboard
```

A GitHub PAT (classic) with `repo` scope. This stays server-side in API routes — never exposed to the client.

### 0.3 Vercel Ignored Build Step

Create `vercel.json` at project root:

```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- src/ package.json next.config.ts public/ tsconfig.json postcss.config.mjs eslint.config.mjs"
}
```

Effect: When GitHub Actions pushes to `claude_automation/output/` or `claude_automation/feedback/`, Vercel sees no changes in the listed paths → exits 0 → skips build. Dashboard only redeploys when actual app code changes.

### 0.4 GitHub API utility

New file: `src/lib/github.ts`

Server-only module (used by API routes). Wraps GitHub Contents API:

```typescript
// Core functions:
async function getFileContent(path: string): Promise<{ content: string; sha: string }>
async function getDirectoryListing(path: string): Promise<{ name: string; path: string; sha: string }[]>
async function createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<void>
```

All calls go to `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}` with the PAT in the Authorization header. Content comes back base64-encoded — decode on read, encode on write.

### 0.5 Add source usage rule to SOURCES.md

Append to the top of `claude_automation/docs/company/SOURCES.md`, right after the Purpose line:

```
**Usage Rule:** ONLY USE IF NECESSARY FOR YOUR POINT/NARRATIVE. DON'T QUOTE A LOT OF SOURCES JUST FOR THE SAKE OF IT.
```

### 0.6 Create feedback directory

Create `claude_automation/feedback/` with a `.gitkeep`. This is where approval/denial data lands.

### 0.7 Update automation CLAUDE.md

Add a section to `claude_automation/CLAUDE.md` telling the AI workflows to read from `feedback/` on each run:

```markdown
## Feedback Loop

Before generating a new post, check `feedback/` for past feedback on your platform:
- `feedback/{platform}/YYYY-MM-DD.json` — contains approval status, score, and user reasoning
- Learn from denied posts: read the `reason` field and avoid repeating the same mistakes
- Learn from low-scoring approved posts: the `feedback` field contains improvement notes
- Prioritize patterns from high-scoring (80+) posts
```

---

## Phase 1 — Tab Navigation

### 1.1 Modify `src/app/page.tsx` header

Add a tab switcher to the left side of the header, replacing the static "taskido" title:

```
[ taskido ]  [ automations ]     stats...                    + New Project
```

- Two tabs: `taskido` and `automations`
- Active tab gets `border-b border-foreground` underline, inactive is `text-muted`
- Tabs styled as `font-mono text-[13px] uppercase tracking-wider` to match existing design
- State: `const [activeTab, setActiveTab] = useState<'taskido' | 'automations'>('taskido')`
- The stats bar (projects count, tasks count, sort toggle) only shows when `activeTab === 'taskido'`
- The `+ New Project` button only shows when `activeTab === 'taskido'`
- When `automations` is active, show platform filter pills + refresh button in the stats area instead

### 1.2 Conditional main content

```tsx
<main>
  {activeTab === 'taskido' ? (
    // existing DndProvider + ProjectColumn layout
  ) : (
    <AutomationsPanel />
  )}
</main>
```

The DndProvider wraps only the taskido content (not the full page) to avoid unnecessary context when on automations tab.

---

## Phase 2 — API Routes

### 2.1 `GET /api/automations/posts`

File: `src/app/api/automations/posts/route.ts`

1. Fetch directory listings for all 3 platforms in parallel:
   - `claude_automation/output/reddit/`
   - `claude_automation/output/linkedin/`
   - `claude_automation/output/instagram/`
2. For each file, fetch its content (batch — can parallelize with Promise.all, but respect GitHub rate limits by batching in groups of 10)
3. Parse YAML frontmatter with `gray-matter`
4. Return JSON array sorted by date descending:

```typescript
type PostEntry = {
  platform: 'reddit' | 'linkedin' | 'instagram'
  date: string           // YYYY-MM-DD
  slug: string           // filename without date prefix
  filePath: string       // full path in repo
  sha: string            // for future edits
  frontmatter: Record<string, unknown>  // all YAML fields
  body: string           // markdown content
  feedback?: {           // if feedback file exists
    status: 'approved' | 'denied'
    score: number
    feedback: string
    reviewedAt: string
  }
}
```

Also check `claude_automation/feedback/{platform}/` for matching feedback files and merge them in.

Query params:
- `?platform=reddit` — filter by platform (optional)
- `?limit=20&offset=0` — pagination (default 20)

### 2.2 `POST /api/automations/feedback`

File: `src/app/api/automations/feedback/route.ts`

Request body:
```json
{
  "platform": "reddit",
  "date": "2026-02-16",
  "postFile": "2026-02-16_what-living-in-48m2-timber-modular-home-actually-looks-like.md",
  "status": "approved",
  "score": 85,
  "feedback": "Great data density but persona felt slightly too polished for r/TinyHouses",
  "reviewedAt": "2026-02-16T14:30:00Z"
}
```

Action:
1. JSON stringify the body
2. Base64 encode
3. PUT to `claude_automation/feedback/{platform}/{date}.json` via GitHub Contents API
4. Commit message: `feedback: {platform} {date} — {status} ({score}/100)`

If file already exists (re-reviewing), include the `sha` to update it.

### 2.3 `GET /api/automations/docs`

File: `src/app/api/automations/docs/route.ts`

Returns a listing of all editable strategy documents:

```typescript
const EDITABLE_DOCS = [
  { id: 'reddit-soul', label: 'Reddit Soul', path: 'claude_automation/docs/reddit/REDDIT_SOUL.md' },
  { id: 'reddit-playbook', label: 'Reddit Playbook', path: 'claude_automation/docs/reddit/REDDIT_PLAYBOOK.md' },
  { id: 'reddit-seo', label: 'Reddit SEO Report', path: 'claude_automation/docs/reddit/REDDIT_REPORT_SEO.md' },
  { id: 'reddit-ai', label: 'Reddit AI Report', path: 'claude_automation/docs/reddit/REDDIT_REPORT_AI.md' },
  { id: 'linkedin-soul', label: 'LinkedIn Soul', path: 'claude_automation/docs/linkedin/LINKEDIN_SOUL.md' },
  { id: 'linkedin-playbook', label: 'LinkedIn Playbook', path: 'claude_automation/docs/linkedin/LINKEDIN_PLAYBOOK.md' },
  { id: 'linkedin-past', label: 'LinkedIn Past Posts', path: 'claude_automation/docs/linkedin/linkedin-past-posts.md' },
  { id: 'instagram-soul', label: 'Instagram Soul', path: 'claude_automation/docs/instagram/INSTAGRAM_SOUL.md' },
  { id: 'instagram-playbook', label: 'Instagram Playbook', path: 'claude_automation/docs/instagram/INSTAGRAM_PLAYBOOK.md' },
  { id: 'instagram-past', label: 'Instagram Past Posts', path: 'claude_automation/docs/instagram/instagram-past-posts.md' },
  { id: 'company-overview', label: 'Company Overview', path: 'claude_automation/docs/company/biobuilds-company-overview.md' },
  { id: 'sources', label: 'Sources', path: 'claude_automation/docs/company/SOURCES.md' },
  { id: 'claude-md', label: 'CLAUDE.md', path: 'claude_automation/CLAUDE.md' },
  { id: 'architecture', label: 'Architecture', path: 'claude_automation/ARCHITECTURE.md' },
]
```

With `?id=reddit-soul` query param: fetch and return full file content + sha.

### 2.4 `PUT /api/automations/docs`

File: `src/app/api/automations/docs/route.ts`

Request body:
```json
{
  "id": "reddit-soul",
  "content": "...full markdown content...",
  "sha": "abc123..."
}
```

Action: PUT to GitHub Contents API with commit message `docs: update {label}`.

---

## Phase 3 — Automations Feed Panel

### 3.1 `AutomationsPanel` component

File: `src/components/AutomationsPanel.tsx`

Layout:
```
┌─────────────────────────────────────────────────────────┐
│ [All] [Reddit] [LinkedIn] [Instagram]  |  [Docs]  [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ PostCard ────────────────────────────────────────┐  │
│  │  REDDIT · 2026-02-16 · Lifestyle & Design         │  │
│  │  r/TinyHouses · persona: Dutch-German remote...   │  │
│  │                                                    │  │
│  │  "I downsized from a 78m2 Munich rental..."       │  │
│  │  [Read More]                                       │  │
│  │                                                    │  │
│  │  [ Approve ✓ ]  [ Deny ✗ ]       Score: ___/100  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ PostCard (reviewed) ─────────────────────────────┐  │
│  │  LINKEDIN · 2026-02-16 · Lifestyle & Design       │  │
│  │  ✓ Approved · 78/100                              │  │
│  │  "90% of your life happens indoors..."            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  [Load More]                                            │
└─────────────────────────────────────────────────────────┘
```

State management:
- `posts: PostEntry[]` — fetched from API
- `filter: 'all' | 'reddit' | 'linkedin' | 'instagram'`
- `view: 'feed' | 'docs'` — toggle between post feed and docs editor
- `loading: boolean`
- `page: number` — for pagination (load more)

On mount: `fetch('/api/automations/posts')` → populate posts array.

### 3.2 Platform filter pills

Styled as the existing sort mode toggle — `font-mono text-[11px] uppercase tracking-wider`. Active pill gets `text-foreground border-foreground`, inactive gets `text-muted border-border`.

### 3.3 `PostCard` component

File: `src/components/PostCard.tsx`

Shows:
- **Header bar:** Platform badge (colored: Reddit=orange, LinkedIn=blue, Instagram=pink) + date + pillar
- **Metadata line:** Platform-specific (subreddit + persona for Reddit, persona for LinkedIn, creative_file for Instagram)
- **Body preview:** First ~200 chars of body, expandable with "Read More" that reveals full markdown-rendered content
- **Feedback status:** If already reviewed, show approved/denied badge + score. If not reviewed, show approve/deny buttons.

Expanded view uses `<ReactMarkdown remarkPlugins={[remarkGfm]}>` for rendering tables, links, etc. Styled to match the brutalist dark theme (custom component overrides for headings, tables, links, code blocks).

### 3.4 `FeedbackModal` component

File: `src/components/FeedbackModal.tsx`

Triggered when user clicks Approve or Deny. Modal (reusing existing `.modal-backdrop` + `.modal-content` CSS animations):

```
┌──────────────────────────────────────┐
│  Approve Post                    [X] │
│                                      │
│  Score                               │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━] 85    │
│  0                              100  │
│                                      │
│  Feedback (optional for approve,     │
│  required for deny)                  │
│  ┌────────────────────────────────┐  │
│  │ Great data density but the     │  │
│  │ persona felt slightly off...   │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ Submit ]                          │
└──────────────────────────────────────┘
```

- Score: slider input 0-100, displayed as number
- Feedback: textarea, required when denying, optional when approving
- Submit: POST to `/api/automations/feedback`, update local state optimistically
- For denied posts: the feedback is framed as "reason why not" — this becomes AI memory

### 3.5 ReactMarkdown theme overrides

Add to `globals.css` or use component-level className overrides:

```css
/* Markdown content in automations panel */
.post-content h2 { font-family: 'Space Mono'; font-size: 13px; text-transform: uppercase; ... }
.post-content table { border: 1px solid var(--border); font-size: 12px; ... }
.post-content a { color: var(--foreground-secondary); text-decoration: underline; }
.post-content blockquote { border-left: 2px solid var(--border); padding-left: 12px; color: var(--muted); }
```

Keep it brutalist — monospace headings, thin borders, muted secondary text.

---

## Phase 4 — Markdown Editor

### 4.1 `DocsEditor` component

File: `src/components/DocsEditor.tsx`

Accessed via the `[Docs]` button in the automations sub-nav. Layout:

```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Feed                                           │
├───────────────┬──────────────────────────────────────────┤
│ DOCUMENTS     │  REDDIT_SOUL.md                     [Save]│
│               │                                          │
│ Reddit        │  ┌────────────────────────────────────┐  │
│  > Soul       │  │ # Reddit Soul Document             │  │
│  > Playbook   │  │                                    │  │
│  > SEO Report │  │ ## Voice & Persona                 │  │
│  > AI Report  │  │ Write as a real person...           │  │
│               │  │                                    │  │
│ LinkedIn      │  │ ...                                │  │
│  > Soul       │  │                                    │  │
│  > Playbook   │  └────────────────────────────────────┘  │
│  > Past Posts │                                          │
│               │  Last saved: 2 min ago                   │
│ Instagram     │                                          │
│  > Soul       │                                          │
│  > Playbook   │                                          │
│  > Past Posts │                                          │
│               │                                          │
│ Company       │                                          │
│  > Overview   │                                          │
│  > Sources    │                                          │
│               │                                          │
│ System        │                                          │
│  > CLAUDE.md  │                                          │
│  > Architecture│                                         │
└───────────────┴──────────────────────────────────────────┘
```

- Left sidebar: grouped document list (matches the `EDITABLE_DOCS` array from the API)
- Right pane: plain `<textarea>` with monospace font (Space Mono), full-height
- No fancy WYSIWYG — raw markdown editing, consistent with brutalist aesthetic
- Save button: PUT to `/api/automations/docs` with current content + sha
- Unsaved changes indicator: track `dirty` state, warn before switching docs
- `Ctrl+S` / `Cmd+S` keyboard shortcut to save

### 4.2 File sidebar grouping

Group by folder prefix:
- **Reddit**: reddit-soul, reddit-playbook, reddit-seo, reddit-ai
- **LinkedIn**: linkedin-soul, linkedin-playbook, linkedin-past
- **Instagram**: instagram-soul, instagram-playbook, instagram-past
- **Company**: company-overview, sources
- **System**: claude-md, architecture

Active doc highlighted with `text-foreground`, others `text-muted`.

---

## Phase 5 — Feedback Integration

### 5.1 Feedback file structure

Path: `claude_automation/feedback/{platform}/{YYYY-MM-DD}.json`

```json
{
  "platform": "reddit",
  "date": "2026-02-16",
  "postFile": "2026-02-16_what-living-in-48m2-timber-modular-home-actually-looks-like.md",
  "status": "approved",
  "score": 85,
  "feedback": "Great data but persona felt too polished for r/TinyHouses. More casual next time.",
  "reviewedAt": "2026-02-16T14:30:00Z"
}
```

### 5.2 Update GitHub Actions workflows

Add a step in each workflow (reddit, linkedin, instagram) before the Claude Code Action step that reads recent feedback:

```yaml
- name: Collect recent feedback
  id: feedback
  run: |
    FEEDBACK_DIR="claude_automation/feedback/${{ matrix.platform || 'reddit' }}"
    if [ -d "$FEEDBACK_DIR" ]; then
      # Get last 10 feedback files
      RECENT=$(ls -t "$FEEDBACK_DIR"/*.json 2>/dev/null | head -10)
      if [ -n "$RECENT" ]; then
        echo "FEEDBACK_FILES<<EOF" >> $GITHUB_OUTPUT
        cat $RECENT
        echo "EOF" >> $GITHUB_OUTPUT
      fi
    fi
```

Then pass into the Claude Code Action prompt:

```
## Recent Feedback from Human Review

The following feedback was provided by the content reviewer. Learn from it:

${{ steps.feedback.outputs.FEEDBACK_FILES }}

Pay special attention to denied posts and their reasoning. Do not repeat the same mistakes.
```

### 5.3 Commit message format for feedback

When the dashboard writes feedback: `feedback: reddit 2026-02-16 — approved (85/100)`

This makes it easy to scan git log for review activity.

---

## File Summary — New & Modified Files

### New Files
| File | Purpose |
|------|---------|
| `vercel.json` | Ignored build step config |
| `.env.local` | GitHub token (gitignored) |
| `src/lib/github.ts` | GitHub Contents API wrapper |
| `src/app/api/automations/posts/route.ts` | GET posts from output/ |
| `src/app/api/automations/feedback/route.ts` | GET/POST feedback |
| `src/app/api/automations/docs/route.ts` | GET/PUT strategy docs |
| `src/components/AutomationsPanel.tsx` | Main automations view |
| `src/components/PostCard.tsx` | Individual post card |
| `src/components/FeedbackModal.tsx` | Approve/deny modal |
| `src/components/DocsEditor.tsx` | Markdown file editor |
| `claude_automation/feedback/.gitkeep` | Feedback directory |

### Modified Files
| File | Change |
|------|--------|
| `src/app/page.tsx` | Add tab navigation, conditional rendering |
| `src/app/globals.css` | Add markdown content styles, slider styles |
| `claude_automation/docs/company/SOURCES.md` | Add source usage rule |
| `claude_automation/CLAUDE.md` | Add feedback loop section |
| `package.json` | Add gray-matter, react-markdown, remark-gfm |

### NOT Modified (remain as-is)
| File | Reason |
|------|--------|
| `src/store/useStore.ts` | Automations state is API-driven, not Zustand (no localStorage for this) |
| GitHub Actions workflows | Feedback reading added as extra step, existing logic untouched |

---

## Implementation Order

1. **Phase 0**: vercel.json, .env.local, github.ts utility, SOURCES.md update, feedback dir, CLAUDE.md update, npm install
2. **Phase 1**: Tab navigation in page.tsx
3. **Phase 2**: API routes (posts, feedback, docs)
4. **Phase 3**: AutomationsPanel + PostCard + FeedbackModal + CSS
5. **Phase 4**: DocsEditor
6. **Phase 5**: Workflow feedback integration (update CLAUDE.md instructions, not the YAML — the AI reads CLAUDE.md)

Everything stays in the existing Next.js app. No new services, no external DBs, no Anthropic API calls. GitHub is the database. The OAuth token continues to power the GitHub Actions generation. The GitHub PAT powers the dashboard's read/write access to the repo.
