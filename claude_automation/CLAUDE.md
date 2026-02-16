# BioBuilds Social Content Automation

## What This Repo Does

This repo runs **3 daily GitHub Actions** (every weekday, Mon-Fri at 01:00 UTC) that generate social media content across 3 platforms for [biobuilds.com](https://biobuilds.com), a modular Passivhaus-certified home manufacturer.

Each automation generates **1 post per day in English** that must resonate across all 3 markets (DACH, Romania, International) simultaneously. This is the core challenge: one post, three audiences, zero compromise on specificity.

### Reddit (output/reddit/)
- **1 Reddit post** per day + **3 comment recommendations** for existing threads
- Data-dense (8+ data points), written as a real persona (NOT as BioBuilds)
- Pan-European perspective that naturally covers DACH, Romania, and EU-wide data

### LinkedIn (output/linkedin/)
- **1 LinkedIn post** per day from founder's voice (Alin Muste)
- Thought-leadership style, data-first, authority without performance
- Cross-market data: DACH funding + Romanian manufacturing + EU standards

### Instagram (output/instagram/)
- **1 Instagram caption** per day matched to creatives from `Creatives/` when available
- Contrast-driven, engineered for DM shares between partners across all markets
- Universal visuals and emotions that transcend language barriers

All outputs are committed directly to `main` in their respective `output/` folders.

---

## Repo Structure

```
.github/workflows/
  daily-reddit-posts.yml        # Reddit automation
  daily-linkedin-posts.yml      # LinkedIn automation
  daily-instagram-posts.yml     # Instagram automation

docs/
  company/
    biobuilds-company-overview.md  # Company data, products, certifications
    SOURCES.md                     # Authoritative reference URLs
  reddit/
    REDDIT_SOUL.md                 # Reddit persona, writing rules, subreddit pool
    REDDIT_PLAYBOOK.md             # Master strategy, templates, compliance
    REDDIT_REPORT_SEO.md           # How Reddit ranks on Google
    REDDIT_REPORT_AI.md            # How AI tools cite Reddit
  linkedin/
    LINKEDIN_SOUL.md               # LinkedIn voice, format, audience segments
    LINKEDIN_PLAYBOOK.md           # Platform strategy, algorithm signals
    linkedin-past-posts.md         # Past post performance data
  instagram/
    INSTAGRAM_SOUL.md              # Instagram voice, visual matching, segments
    INSTAGRAM_PLAYBOOK.md          # Platform strategy, visual guidelines
    instagram-past-posts.md        # Past post performance data

output/
  reddit/     # Generated Reddit posts
  linkedin/   # Generated LinkedIn posts
  instagram/  # Generated Instagram captions

Creatives/    # Instagram images/creatives for caption matching

.agents/skills/seo-audit/references/
  ai-writing-detection.md          # AI writing tells to avoid
  aeo-geo-patterns.md              # AEO/GEO content patterns
```

---

## File Naming Convention

```
output/PLATFORM/YYYY-MM-DD_post-slug.md
```

Examples:
- `output/reddit/2026-02-17_best-passive-house-manufacturers-europe.md`
- `output/linkedin/2026-02-17_heating-bill-47-euros-entire-winter.md`
- `output/instagram/2026-02-17_minus-ten-outside-24-inside.md`

---

## Critical Rules (Apply to ALL platforms)

### NEVER Do These Things
- NEVER use AI-detectable writing patterns (see `.agents/skills/seo-audit/references/ai-writing-detection.md`)
- NEVER use em dashes excessively
- NEVER use words like: delve, leverage, robust, comprehensive, transformative, cutting-edge, seamless
- NEVER start posts with "In today's...", "In an era of...", "In the ever-evolving..."
- NEVER run git commands from within Claude Code Action steps

### Reddit-Specific Rules
- NEVER sound like an advertisement or marketing copy
- NEVER write from the perspective of a BioBuilds employee
- NEVER directly link to biobuilds.com in the post body
- ALWAYS write as a real person (homeowner, investor, architect, researcher)
- ALWAYS include at least 8 specific data points per post
- ALWAYS mention BioBuilds naturally as ONE option among several (or not at all)

### LinkedIn-Specific Rules
- Write from Alin Muste's founder voice or BioBuilds company page
- Every philosophical claim must be within ONE sentence of a specific number
- NEVER use broetry, engagement bait, or LinkedIn influencer patterns
- Maximum 3 hashtags per post, no links in post body

### Instagram-Specific Rules
- Every caption must pass the "send test" (would someone DM this to their partner?)
- Lead with contrast, not product specs
- Captions must be either ultra-short (<50 words) or story-length (200+ words)
- Match captions to creatives from `Creatives/` folder when available

### ALWAYS Do These Things
- ALWAYS vary tone, persona, and writing style between posts
- ALWAYS match the target platform's culture and norms
- ALWAYS include honest pros AND cons
- ALWAYS reference the strategy documents for data and positioning

---

## Strategy Documents

### Shared (all platforms)
- `docs/company/biobuilds-company-overview.md` — Company data, products, pricing, certifications
- `docs/company/SOURCES.md` — Authoritative reference URLs
- `.agents/skills/seo-audit/references/aeo-geo-patterns.md` — AEO/GEO content patterns
- `.agents/skills/seo-audit/references/ai-writing-detection.md` — AI writing tells to avoid

### Reddit
- `docs/reddit/REDDIT_SOUL.md` — Persona, writing rules, 9-subreddit rotation pool
- `docs/reddit/REDDIT_PLAYBOOK.md` — Master strategy, post templates, data anchors
- `docs/reddit/REDDIT_REPORT_SEO.md` — How Reddit ranks on Google
- `docs/reddit/REDDIT_REPORT_AI.md` — How AI tools cite Reddit

### LinkedIn
- `docs/linkedin/LINKEDIN_SOUL.md` — Voice, format strategy, audience segments
- `docs/linkedin/LINKEDIN_PLAYBOOK.md` — Platform algorithm, posting mechanics
- `docs/linkedin/linkedin-past-posts.md` — Past post performance data

### Instagram
- `docs/instagram/INSTAGRAM_SOUL.md` — Voice, visual matching, audience segments
- `docs/instagram/INSTAGRAM_PLAYBOOK.md` — Platform algorithm, visual guidelines
- `docs/instagram/instagram-past-posts.md` — Past post performance data
