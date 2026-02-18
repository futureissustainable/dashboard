# Dashboard

## What this is

Two-panel Next.js dashboard for BioBuilds (biobuilds.com), a Passivhaus-certified modular home manufacturer in Romania delivering across Europe.

**Panel 1 — Taskido:** Kanban task board with drag-and-drop, project columns, priority sorting.

**Panel 2 — Automations:** AI-generated social media content with human approval workflow.

## AI Content System

Three GitHub Actions workflows run every weekday (Mon-Fri), staggered:
- **01:00 UTC** — Reddit post + 3 comment recommendations
- **01:30 UTC** — LinkedIn post (founder voice: Alin Muste)
- **02:00 UTC** — Instagram caption + creative matching

Each uses Claude Opus 4.6 via `claude-code-action`. Posts commit directly to `main`.

### How it works

1. Workflow reads 7-9 strategy docs before writing anything
2. Checks past posts to avoid duplication
3. Researches current data via WebSearch
4. Matches creatives from `Creatives/CATALOG.md` (Instagram/LinkedIn)
5. Generates one post, saves to `claude_automation/output/{platform}/`
6. Human reviews in dashboard: approve/deny with score (0-100) + feedback
7. Feedback saved to `claude_automation/feedback/{platform}/`
8. Next run reads feedback and adapts

### Content pillars (rotate weekly by ISO week)

Energy & Performance, Cost & Finance, Construction & Process, Materials & Sustainability, Regulations & Certification, Living Experience, Market Comparison, Lifestyle & Design

## Tech stack

- **App:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **State:** Zustand
- **Data:** GitHub Contents API (no external DB)
- **Deployment:** Vercel (smart build skip for automation-only pushes)
- **Content generation:** Claude Code Action in GitHub Actions
- **Auth:** GitHub OAuth

## Repo structure

```
src/                          # Next.js app
  app/page.tsx                # Main dashboard (tabs: taskido | automations)
  app/api/automations/        # Posts, feedback, docs, run endpoints
  components/                 # UI components
  store/useStore.ts           # Zustand state
  lib/github.ts               # GitHub API wrapper

.github/workflows/
  daily-reddit-posts.yml
  daily-linkedin-posts.yml
  daily-instagram-posts.yml
  catalog-creatives.yml       # Creative asset catalog check

claude_automation/
  CLAUDE.md                   # Rules for AI content generation
  ARCHITECTURE.md             # System architecture docs
  docs/company/               # Company overview, data sources
  docs/reddit/                # Reddit strategy (SOUL, PLAYBOOK, SEO, AI reports)
  docs/linkedin/              # LinkedIn strategy (SOUL, PLAYBOOK, past posts)
  docs/instagram/             # Instagram strategy (SOUL, PLAYBOOK, past posts)
  output/{platform}/          # Generated posts (YYYY-MM-DD_slug.md)
  feedback/{platform}/        # Human feedback JSON + SUMMARY.md
  Creatives/                  # Media assets + CATALOG.md
  .agents/skills/             # AI skills (post generators, SEO audit, etc.)
```

## Key commands

```bash
npm run dev          # Local dev server
npm run build        # Production build
```

## Rules

- BioBuilds builds HOMES (90% family homes, 7.5% tourism, 2.5% offices)
- All content in English, must resonate across DACH + Romania + International
- No AI writing tells (em dashes, "delve", "leverage", broetry)
- Content rules live in `claude_automation/CLAUDE.md` — that file governs the AI workflows
