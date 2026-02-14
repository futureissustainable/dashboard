**ONLY USE IF CALLED FOR**

# MATEUS Build Guidelines

Use these guidelines for non-BIOBUILDS projects following the Mateus build system.

## Tech Stack

| Purpose | Technology |
|---------|------------|
| Repository | GitHub |
| Framework | Next.js |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Hosting | Vercel |
| Analytics | PostHog |
| Database/Storage | Supabase (Postgres) |
| State Management | Zustand |
| Icons | Phosphor Icons |

### Optional
| Purpose | Technology |
|---------|------------|
| Payments | Stripe |
| API Rate Limiting | Upstash |

## PostHog Configuration

```javascript
posthog.register({
  app: '[app name]',
  app_domain: window.location.hostname,
  app_version: '0.1.0',
});
```

**Environment Variables:**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Typography

### Fonts
| Usage | Font |
|-------|------|
| Headlines | PP Mondwest |
| Paragraphs | Albert Sans |

### Font Sizes

| Variable | Size | Class | Usage |
|----------|------|-------|-------|
| `--fs-p-sm` | 14px | `.fs-p-sm` | UI text, labels, buttons, metadata |
| `--fs-p-lg` | 16px | `.fs-p-lg` | Body text, descriptions |
| `--fs-p-xl` | 20px | `.fs-p-xl` | Body text, descriptions |
| `--fs-p-xxl` | 24px | `.fs-p-xxl` | Body text, descriptions |
| `--fs-h-sm` | 24px | `.fs-h-sm` | Section titles, card headers |
| `--fs-h-lg` | 32px | `.fs-h-lg` | Page titles, major headings |
| `--fs-h-xl` | 52px | `.fs-h-xl` | Hero headlines only |
| `--fs-h-xxl` | 76px | `.fs-h-xxl` | Hero headlines only |

## Spacing System

Built on an **8px grid** for consistency.

| Variable | Size |
|----------|------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |
| `--space-32` | 128px |

## Containers

| Class | Max Width | Usage |
|-------|-----------|-------|
| `.container-page` | 1400px | Most sections |
| `.container-narrow` | 720px | Niche sections |

## Responsive Side Padding

| Breakpoint | Padding | Variable |
|------------|---------|----------|
| Mobile (<640px) | 16px | `--space-4` |
| Tablet (640-767px) | 24px | `--space-6` |
| Tablet (768-1023px) | 40px | `--space-10` |
| Desktop (≥1024px) | 48px | `--space-12` |

## Animations

### Easing Functions
| Variable | Value | Usage |
|----------|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exiting |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General |

### Durations
| Variable | Duration | Usage |
|----------|----------|-------|
| `--duration-instant` | 100ms | Hover states, micro interactions |
| `--duration-fast` | 200ms | Buttons, toggles |
| `--duration-normal` | 300ms | Modals, page transitions |
| `--duration-slow` | 500ms | Dramatic reveals |
