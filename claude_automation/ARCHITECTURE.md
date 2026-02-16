# Architecture & Automation Flow

## System Overview

This repo runs **3 daily GitHub Actions workflows** (Mon-Fri at 01:00 UTC) that generate social media content across 3 platforms. Each produces **1 post per day in English** that must resonate across all 3 markets (DACH, Romania, International) simultaneously.

**Daily output: 3 posts** (1 per platform, each serving all markets)

Content is written by Claude (Opus 4.6) and committed directly to `main` in platform-specific output folders. Each platform has its own voice, rules, and strategy docs.

| Platform | Voice | Output Folder |
|----------|-------|---------------|
| Reddit | Third-party personas (homeowners, architects, expats) | `output/reddit/` |
| LinkedIn | Founder voice (Alin Muste) / company page | `output/linkedin/` |
| Instagram | Brand voice with contrast-driven captions | `output/instagram/` |

---

## Data Sources

All data lives in the repository. No external database or API.

### Shared across all platforms

| File | Role |
|---|---|
| `docs/company/biobuilds-company-overview.md` | Company data, products, certifications, milestones |
| `docs/company/SOURCES.md` | Authoritative reference URLs |
| `.agents/skills/seo-audit/references/aeo-geo-patterns.md` | AEO/GEO content patterns |
| `.agents/skills/seo-audit/references/ai-writing-detection.md` | AI writing tells to avoid |

### Platform-specific

| Platform | Soul Doc | Playbook | Other |
|----------|----------|----------|-------|
| Reddit | `docs/reddit/REDDIT_SOUL.md` | `docs/reddit/REDDIT_PLAYBOOK.md` | `REDDIT_REPORT_SEO.md`, `REDDIT_REPORT_AI.md` |
| LinkedIn | `docs/linkedin/LINKEDIN_SOUL.md` | `docs/linkedin/LINKEDIN_PLAYBOOK.md` | `linkedin-past-posts.md` |
| Instagram | `docs/instagram/INSTAGRAM_SOUL.md` | `docs/instagram/INSTAGRAM_PLAYBOOK.md` | `instagram-past-posts.md` |

During generation, the system performs **live web searches** (`WebSearch` tool) to pull current data.

---

## Workflow Architecture

All three workflows share the same structure:

```
Cron (Mon-Fri 01:00 UTC) / manual trigger
│
├── 1. SETUP
│   ├── Checkout repo (full history)
│   ├── Calculate today's date (UTC)
│   ├── Determine content pillar (8 pillars rotating weekly by ISO week)
│   └── [Instagram only] List available creatives in Creatives/
│
├── 2. GENERATE POST (Claude Opus 4.6, max 35-45 turns)
│   ├── Read all strategy docs + soul doc + playbook
│   ├── Scan recent posts in output/PLATFORM/ → avoid duplication
│   ├── WebSearch for current data points across all 3 markets
│   ├── Write 1 English post that serves DACH + Romania + International
│   └── Save → output/PLATFORM/YYYY-MM-DD_[slug].md
│
└── 3. COMMIT & PUSH
    ├── Check if output/PLATFORM/ has new files
    ├── git add output/PLATFORM/
    ├── Commit: "PLATFORM: YYYY-MM-DD [Pillar Name]"
    └── Push to main
```

The core challenge is making a single English post resonate across DACH and Romania (primary markets) and broader Europe simultaneously.

### Workflow Files

| Workflow | File | Schedule |
|----------|------|----------|
| Reddit | `.github/workflows/daily-reddit-posts.yml` | `0 1 * * 1-5` |
| LinkedIn | `.github/workflows/daily-linkedin-posts.yml` | `0 1 * * 1-5` |
| Instagram | `.github/workflows/daily-instagram-posts.yml` | `0 1 * * 1-5` |

### Claude Code Action Configuration

Each generation step uses `anthropics/claude-code-action` with:
- **Model:** `claude-opus-4-6`
- **Max turns:** 35 (LinkedIn/Instagram), 45 (Reddit, due to comment recommendations)
- **Allowed tools:** `Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`
- **Excluded:** git commands, Bash (Claude writes files only; git runs in shell step)

### Authentication

- `CLAUDE_CODE_OAUTH_TOKEN` stored as GitHub Actions secret
- Permissions: `contents: write` + `id-token: write`

---

## Platform-Specific Details

### Reddit

**Identity:** Third-party personas (NOT BioBuilds). Homeowners, architects, expats, investors.

**Anti-spam mechanics:**
- 9-subreddit rotation pool (shared across all markets)
- 3-week blocked list: no subreddit reuse within 3 weeks
- Persona variation: different persona every post
- 90/10 rule: 90% genuine value, 10% max brand mention

**Unique feature:** Each post includes 3 comment recommendations for existing Reddit threads (trust-building, no BioBuilds mentions).

**Post requirements:** 8+ data points, TL;DR with numeric anchors, YAML frontmatter.

### LinkedIn

**Identity:** Alin Muste (founder) or BIOBUILDS company page. Thought leadership.

**Algorithm signals targeted:**
- Dwell time (carousels get 2-3 minutes vs 15-30 seconds for text)
- Comment depth (substantive debate > generic reactions)
- Topical authority (consistent passive construction topic)

**Post requirements:** Hook in first 210 characters, 3-5 data points, max 3 hashtags, no links in body, one audience segment targeted.

**Formats:** Text (800-1,200 chars), carousel (8-10 slides as PDF), video concept.

### Instagram

**Identity:** BIOBUILDS brand voice. Contrast-driven, engineered for DM shares.

**Algorithm signals targeted:**
- Sends (DM shares, weighted 3-5x higher than likes)
- Watch time / dwell time
- Likes-per-reach ratio

**Unique feature:** Creative matching from `Creatives/` folder. Each caption includes a `creative_brief` or `creative_file` reference.

**Post requirements:** First 125 chars must hook, "send test" must pass, ultra-short OR story-length (no medium), 2-3 data points.

**Formats:** Static (4:5), carousel (4:5, 8-10 slides), Reel concept (9:16, 7-15 seconds).

---

## Content Pillar Rotation

8 pillars rotate weekly (based on ISO week number):

1. **Energy & Performance** — Heating bills, Passivhaus metrics, U-values
2. **Cost & Finance** — Pricing, KfW funding, ROI, financing
3. **Construction & Process** — Timelines, factory vs site, delivery
4. **Materials & Sustainability** — Organic materials, carbon footprint, lifecycle
5. **Regulations & Certification** — Permits, Passivhaus cert, KfW/QNG
6. **Living Experience** — Daily life, comfort, air quality, maintenance
7. **Market Comparison** — Manufacturer comparisons, price tables
8. **Lifestyle & Design** — Interiors, design philosophy, spaces

All platforms share the same weekly pillar but adapt it to their audience and format.

---

## Output Formats

### Reddit
```yaml
---
date: "YYYY-MM-DD"
market: "EN" | "DE" | "RO"
pillar: "Content pillar name"
subreddit: "r/SubredditName"
title: "The exact Reddit post title"
persona: "Brief persona description"
photo_prompt: "Ideal accompanying image"
mentions_biobuilds: true | false
---
[Post body + comment recommendations]
```

### LinkedIn
```yaml
---
date: "YYYY-MM-DD"
platform: "linkedin"
pillar: "Content pillar name"
primary_market: "DACH" | "Romania" | "Europe-wide"
title: "The hook / first line"
format: "text" | "carousel" | "video"
persona: "Alin Muste (personal)" | "BIOBUILDS (company page)"
carousel_prompt: "Carousel slides description"
photo_prompt: "Ideal visual"
---
[LinkedIn post text]
```

### Instagram
```yaml
---
date: "YYYY-MM-DD"
platform: "instagram"
pillar: "Content pillar name"
primary_market: "DACH" | "Romania" | "Europe-wide"
format: "static" | "carousel" | "reel"
creative_brief: "Visual description"
creative_file: "Creatives/filename.jpg"
caption_length: "short" | "long"
hashtags: ["#Tag1", "#Tag2"]
---
[Instagram caption]
```

---

## Key Dependencies

- **GitHub Actions** for scheduling and orchestration
- **Claude Code Action** (`anthropics/claude-code-action`) for content generation
- **Claude Opus 4.6** as the generation model
- **WebSearch** for live data enrichment
- **Git** for version control and direct-to-main publishing

No external services, databases, or content management systems. The entire pipeline is self-contained.
