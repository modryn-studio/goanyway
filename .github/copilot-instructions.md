# GoAnyway — Copilot Context

## Who I Am

Luke Hanner — solo builder, AI-assisted, shipping fast. GoAnyway turns the anxiety of attending your first social group into a clear, actionable plan. Input your activity, city, and comfort level — get one real event, a "what to expect" briefing, and a first-hour script.

Two user types: (1) **Aware** — RSVPd three times and bailed three times, actively searching for help, finds this via Reddit. (2) **Activity-first** — stuck in managed isolation, searches "hiking clubs Denver for adults", arrives via pSEO, never identifies as lonely. The pSEO copy must not name their loneliness — speak to the activity, not the need.

The problem is **intent-to-action failure**, not awareness failure. People know what they want. They RSVP and bail. The $9 payment and the comfort stat are the real behavioral levers — not the script. The script is downstream of the fear being resolved.

## Deployment

mode: modryn-app
url: https://modrynstudio.com/tools/goanyway
basePath: /tools/goanyway

Served via rewrites in modryn-studio-v2 — `basePath` must stay set in `next.config.ts`.
`BASE_PATH = '/tools/goanyway'` in `src/lib/base-path.ts` — all `fetch()` calls to API routes use it.
Telnyx webhook URL: `https://goanyway.vercel.app/tools/goanyway/api/sms/webhook`

The rewrite in modryn-studio-v2 is managed by running `/deploy` in that repo — never add or edit it from this repo. The root path `/tools/goanyway` is served by modryn-studio-v2's own static page; rewrites only match sub-paths. The "Try it" URL in `content/tools/goanyway.json` points to `https://goanyway.vercel.app/tools/goanyway` (direct Vercel URL) so GA4 events hit GoAnyway's own property, not modrynstudio's.

## Stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS for styling
- Vercel for deployment
- GA4 for custom event tracking (via `@/lib/analytics.ts` — never call `gtag()` directly)
- Vercel Analytics `<Analytics />` component in `layout.tsx` for pageviews only — do not use their `track()` API
- Resend — email list capture, studio-wide broadcast, future nurture. Double opt-in is OFF — treat the capture as a plan-save request, not a newsletter signup. "Email me my plan" converts better than "Sign up for updates." Capture happens at the PayGate wall before payment — not on `/confirm`.
- Stripe Checkout Session — $9 one-time PayGate via `/api/checkout`. Session metadata carries `activity`, `city`, `comfort_level` through the redirect to `/confirm`. The $9 is also a commitment device — a person who paid is materially more likely to attend.
- OpenAI GPT-5 mini (`gpt-5-mini`) — generates structured JSON: event card, briefing, script shell, starters. ~$0.003/call. Uses `max_completion_tokens` (not `max_tokens`) and no `temperature` — it's a reasoning model. `response_format: json_object` supported.
- Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`) — two roles: (1) event search via built-in `web_search_20250305` tool with `allowed_domains` locked to `meetup.com`, `eventbrite.com`, `lu.ma` and `user_location` set to the submitted city (~$0.01/search); (2) emotional copy rewrite — comfort stat framing + script reassurance (~$0.015/call). Not a fallback — deliberate passes where tone is the differentiator. Do not use Haiku — saves $0.01, produces noticeably flatter copy.
- Telnyx — SMS reminders + "Did you go?" follow-up. T-1hr event reminder → T+3hr "Did you go?" follow-up → if "no", re-engagement with new event suggestion. Opt-in framed as a feature: "Text me a reminder before my event."

## Project Structure

```
/app                    → Next.js App Router pages
/components             → Reusable UI components
/lib                    → Utilities, helpers, data fetching
/lib/prompts            → Prompt templates for briefing generation (briefing.ts, script.ts)
/lib/event-search.ts    → Claude Sonnet 4.6 web search wrapper + fallback logic
/content/tools          → Tool metadata JSON for modryn-studio-v2
/content/pseo           → pSEO activity + city combinations
/app/tools/goanyway     → pSEO dynamic route pages
```

## Route Map

- `/` → Hero + input form (activity type, city, comfort level 1–5)
- `/result` → AI-generated output: event card, briefing (free), **email capture before the PayGate wall** ("Email me my plan" — highest-capture point), then PayGate. Comfort stat surfaces first behind the gate.
- `/confirm` → Post-payment: full script unlocked, **SMS opt-in only** (email was already captured at the wall). Reads plan data from Stripe session metadata via `?session_id=` — not sessionStorage.
- `/privacy` → Privacy policy
- `/terms` → Terms of service
- `/tools/goanyway/[activity]/[city]` → pSEO page per activity + city combination
- `/api/generate` → POST: (1) Claude Sonnet 4.6 web search tool (`web_search_20250305`, domain-filtered to meetup/eventbrite/lu.ma) finds event, (2) GPT-5 mini generates structured JSON, (3) Claude Sonnet 4.6 rewrites comfort stat + script reassurance lines. Comfort level 1-2 = lowest-friction format (drop-in, no talking required), 3 = balanced, 4-5 = direct script only
- `/api/email` → POST: Resend — adds email to list, triggers "Did you go?" follow-up sequence
- `/api/checkout` → POST: Stripe Checkout Session with `activity`, `city`, `comfort_level` in metadata. Success URL: `/confirm?session_id={CHECKOUT_SESSION_ID}`
- `/api/feedback` → POST: feedback + newsletter signup handler
- `/api/sms` → POST: Telnyx — register phone, schedule reminder + follow-up
- `/api/sms/webhook` → POST: Telnyx inbound webhook — "Did you go?" reply logging

## Brand & Voice

- Short sentences. Direct. No fluff. Say the thing.
- Warm without being soft. This tool understands the fear — it doesn't cheerlead over it.
- Honest about what the tool is: a plan, not a guarantee. It gets you to the door. You walk through it.
- Never use: "empower, seamless, journey, connect, unlock, transform, discover, community-driven, game-changer, leverage"
- Dark mode base, system toggle available
- Background: `#1A1713` — warm near-black. Not cool-gray, not slate.
- Accent: `#F5A623` — warm amber for CTAs, event cards, key stats
- Fonts: Space Grotesk (headlines + UI) + DM Sans (body)
- Motion: Minimal. Single fade-in on result reveal. No looping animations.
- No stock photos of smiling friend groups. No fake testimonials. No confetti. No wellness-app gradients.
- **Comfort stat visual rule:** Render the percentage at 64–72px — big number first, supporting sentence below at normal body size. Not a paragraph. A number that stops the scroll.
- Emotional arc: Land → "Someone named the problem." Read → "This is specific enough to be real." Scroll → "I want to see my plan." Convert → "Nine dollars to stop bailing on myself. Fine." _(The $9 is a commitment device — design the PayGate to feel like a decision, not a transaction.)_
- **pSEO copy rule:** Activity-first users (Type 2) arrive not knowing they need this. Never mention loneliness, making friends, or feeling alone on pSEO pages. Speak to the activity: "Find a real upcoming event, know exactly what to say when you show up."
- **Comfort stat is the hero element**, not the script. "68% of people at their first hiking club came alone" removes the fear of being visibly weird — that's the specific terror that causes bailing. Surface it first behind the gate.
- **Comfort level selector:** 5 discrete labeled steps — not a range slider (clinical), not emoji or star ratings (wellness app). Each step has a short label. "1" must feel dignified, not shameful. The selector sets the emotional tone for the entire experience before the user sees any output.

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
