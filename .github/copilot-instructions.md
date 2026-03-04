# GoAnyway — Copilot Context

## Who I Am

Luke Hanner — solo builder, AI-assisted, shipping fast. GoAnyway turns the anxiety of attending your first social group into a clear, actionable plan. Input your activity, city, and comfort level — get one real event, a "what to expect" briefing, and a first-hour script. Built for people who've RSVPd three times and bailed three times. They don't need help finding groups — they need someone to tell them exactly what happens when they walk in.

## Stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS for styling
- Vercel for deployment
- GA4 for custom event tracking (via `@/lib/analytics.ts` — never call `gtag()` directly)
- Vercel Analytics `<Analytics />` component in `layout.tsx` for pageviews only — do not use their `track()` API
- Resend — email list capture, studio-wide broadcast, future nurture
- Stripe Payment Link — $9 one-time PayGate for full script + city-specific event data
- OpenAI GPT-5 mini — primary model for briefing + script generation (not yet installed)
- Anthropic Claude Sonnet 4.6 — secondary/fallback for emotionally-calibrated script copy (not yet installed)
- Perplexity — event lookup engine for live web search (not yet installed)
- Telnyx — SMS reminders + "Did you go?" follow-up (not yet installed)

## Project Structure

```
/app                    → Next.js App Router pages
/components             → Reusable UI components
/lib                    → Utilities, helpers, data fetching
/lib/prompts            → Prompt templates for briefing generation (briefing.ts, script.ts)
/lib/perplexity.ts      → Perplexity event lookup wrapper + fallback logic
/content/tools          → Tool metadata JSON for modryn-studio-v2
/content/pseo           → pSEO activity + city combinations
/app/tools/goanyway     → pSEO dynamic route pages
```

## Route Map

- `/` → Hero + input form (activity type, city, comfort level 1–5)
- `/result` → AI-generated output: event card, briefing (free) + PayGate wall before full script
- `/confirm` → Post-PayGate: full script unlocked, email/SMS capture
- `/privacy` → Privacy policy
- `/terms` → Terms of service
- `/tools/goanyway/[activity]/[city]` → pSEO page per activity + city combination
- `/api/generate` → POST: form inputs → GPT-5 mini + Perplexity → structured briefing JSON
- `/api/email` → POST: Resend — adds email to list, triggers follow-up sequence
- `/api/checkout` → POST: Stripe checkout session (fallback if not using Payment Links)
- `/api/feedback` → POST: feedback + newsletter signup handler
- `/api/sms` → POST: Telnyx — register phone, schedule reminder + follow-up
- `/api/sms/webhook` → POST: Telnyx inbound webhook — "Did you go?" reply logging

## Brand & Voice

- Short sentences. Direct. No fluff. Say the thing.
- Warm without being soft. This tool understands the fear — it doesn't cheerlead over it.
- Honest about what the tool is: a plan, not a guarantee. It gets you to the door. You walk through it.
- Never use: "empower, seamless, journey, connect, unlock, transform, discover, community-driven, game-changer, leverage"
- Dark mode base, system toggle available
- Accent: Warm amber #F59E0B — CTAs, event cards, key stats
- Fonts: Space Grotesk (headlines + UI) + Inter (body)
- Motion: Minimal. Single fade-in on result reveal. No looping animations.
- No stock photos of smiling friend groups. No fake testimonials. No confetti. No wellness-app gradients.
- Emotional arc: Land → "Someone named the problem." Read → "This is specific enough to be real." Scroll → "I want to see my plan." Convert → "Nine dollars to stop bailing on myself. Fine."

## README Standard

Every project README follows this exact structure — no more, no less:

```markdown
![Project Name](public/brand/banner.png)

# Project Name

One-line tagline. Outcome-focused — lead with what the user gets, not the technology.

→ [domain.com](https://domain.com)

---

Next.js · TypeScript · Tailwind CSS · Vercel
```

Rules:

- **Banner image** — always first. Path is `public/brand/banner.png`.
- **H1 title** — product name only, no subtitle.
- **Tagline** — one sentence. What the user gets. No buzzwords ("powerful", "seamless", "AI-powered").
- **Live link** — `→ [domain.com](https://domain.com)` format. Always present if live.
- **Divider** — `---` separator before the stack line.
- **Stack line** — `·`-separated list of core tech only. No version numbers, no descriptions.
- **Nothing else.** No install instructions, no contributing section, no architecture diagrams, no screenshots beyond the banner. Real docs go in `/docs` or on the live site.

When adding a badge row (optional, for open source tools/libraries only):

- Place it between the H1 and the tagline
- Use shields.io format: `[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)`
- Keep it to 3 badges max: typically license + CI status + live site
- Apps (not libraries) should skip badges entirely

## API Route Logging

Every new API route (`app/api/**/route.ts`) MUST use `createRouteLogger` from `@/lib/route-logger`.

```typescript
import { createRouteLogger } from '@/lib/route-logger';
const log = createRouteLogger('my-route');

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();
  try {
    log.info(ctx.reqId, 'Request received', {
      /* key fields */
    });
    // ... handler body ...
    return log.end(ctx, Response.json(result), {
      /* key result fields */
    });
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

- `begin()` prints the `─` separator + START line with a 5-char `reqId`
- `info()` / `warn()` log mid-request milestones
- `end()` logs ✅ with elapsed ms and returns the response
- `err()` logs ❌ with elapsed ms
- Never use raw `console.log` in routes — always go through the logger

## Analytics

All custom events MUST go through `analytics` from `@/lib/analytics.ts` — never call `gtag()` directly.

```typescript
import { analytics } from '@/lib/analytics';
analytics.track('event_name', { prop: value });
```

Add a named method to `analytics.ts` for each distinct user action. Named methods are typed and
discoverable — no magic strings scattered across 10 files.

GA4 measurement ID is loaded via `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `layout.tsx`.

## Dev Server

Start with `Ctrl+Shift+B` (default build task). This runs:

```
npm run dev -- --port 3000 2>&1 | Tee-Object -FilePath dev.log
```

Tell Copilot **"check logs"** at any point — it reads `dev.log` and flags errors or slow requests.

## Code Style

- Write as a senior engineer: minimal surface area, obvious naming, no abstractions before they're needed
- Comments explain WHY, not what
- One file = one responsibility
- Prefer early returns for error handling
- Never break existing functionality when adding new features
- Leave TODO comments for post-launch polish items

## Core Rules

- Every page earns its place — no pages for businesses not yet running
- Ship fast, stay honest — empty is better than fake
- Ugly is acceptable, broken is not — polish the core action ruthlessly
- Ship one killer feature, not ten mediocre ones
- Instrument analytics before features — data from day one
- Onboard users to value in under 2 minutes
