# Project Context

## Product

An AI tool that turns the anxiety of attending your first social group into a clear, actionable plan.
Input your activity, city, and comfort level — get one real event, a full "what to expect" briefing, and a first-hour script so you actually walk through the door.

**The problem is intent-to-action failure, not awareness failure.** People know what they want. They RSVP and bail. The $9 payment and the comfort stat ("68% came alone") are the real behavioral levers — not the script. The script is downstream of the fear being resolved.

## Target User

**Type 1 — Marcus (v1 user):** 26, moved to a new city 8 months ago. Full-time remote job, a few online friends, zero local ones. RSVPd to three Meetup events and bailed on all three. He doesn't need help finding groups — he needs someone to tell him exactly what will happen when he walks in, what to say, and that it's normal to feel this way. He will search r/lonely or r/socialskills. He'll find this product and immediately recognize it.

**Type 2 — Managed isolation user (larger segment, higher conversion):** Has some social life, not in crisis, but slowly stopped trying. Doesn't identify as lonely. Will never type "how do I make friends" into Google. Searches for specific activities: "hiking clubs Denver for adults", "book clubs Austin". The pSEO play hits this user at intent. The copy must not name their loneliness — it should be activity-first, outcome-focused. They convert because the product is practical, not because it named their pain.

## Deployment

mode: modryn-app
url:  https://modrynstudio.com/tools/goanyway
basePath: /tools/goanyway

## Stack Additions

- **Resend** — email list capture, studio-wide broadcast, future nurture. Double opt-in is OFF for this flow — treat the capture as a plan-save request, not a newsletter signup. "Email me my plan" converts better than "Sign up for updates." Capture happens at the PayGate wall before payment — not on /confirm.
- **Telnyx** — SMS loop: (1) T-1hr event reminder, (2) T+3hr "Did you go?" follow-up (the product's core data point), (3) if reply is "no" → "No worries. Same time next week?" + new event suggestion. That third message turns a bail into a re-engagement. Opt-in framed as a feature: "Text me a reminder before my event." Never promotional.
- **Telnyx Webhooks** — inbound SMS handler for "Did you go?" reply logging
- **Stripe Checkout Session** — $9 one-time charge for full script. Use `/api/checkout` to create a session with `activity`, `city`, `comfort_level` in metadata. Session metadata survives the redirect to `/confirm` and is available in the webhook for the "Did you go?" trigger. The $9 is also a commitment device — a person who paid is materially more likely to attend than a person who didn't.
- **OpenAI GPT-5 mini** — primary model for briefing + script generation (fast, cheap, structured output)
- **Anthropic Claude Sonnet 4.6** (`claude-sonnet-4-6`) — used specifically for the 2-3 emotionally loaded lines per plan: the comfort stat framing and the first-hour script reassurance. Not a fallback — a deliberate second pass where tone is the differentiator. Do not swap for Haiku (4.5) to save $0.01 — it produces noticeably flatter copy and the voice is the product's only real differentiator.
- **Perplexity Search API** — Returns ranked live web results for events. Use the Search API (not the sonar chat model) — it gives clean URLs and source metadata directly, no inference layer, no hallucination risk. Query format: `"[activity] events [city] [month year] site:eventbrite.com OR site:meetup.com OR site:lu.ma"`. No API approval required.

## Project Structure Additions

- `/content/tools/goanyway.json` — tool metadata for modryn-studio-v2 landing page
- `/lib/prompts/` — prompt templates for briefing generation (briefing.ts, script.ts)
- `/lib/perplexity.ts` — Perplexity event lookup wrapper + fallback logic (no-results fallback: Google search link)
- `/app/tools/goanyway/[activity]/[city]/page.tsx` — pSEO dynamic route template
- `/content/pseo/combinations.json` — master list of activity + city combinations to generate (populate month 2-3)
- `/app/api/sms/webhook/route.ts` — Telnyx inbound SMS webhook handler

## Route Map

- `/` → Hero + input form (activity type, city, comfort level 1–5). Submits to generate flow.
- `/result` → AI-generated output: one event card, "what to expect" briefing (free), + PayGate wall. **Email capture lives here, before payment** — "Email me my plan" framing, posts to `/api/email`. This is the highest-capture point: user is engaged, hasn't committed yet. Full first-hour script and comfort stats behind the gate.
- `/confirm` → Post-payment: full script unlocked. **SMS opt-in only** — email was captured at the PayGate wall. "Text me a reminder before my event." → posts to `/api/sms`. Reads plan data from Stripe session metadata (via `?session_id=` param) — not sessionStorage, which is unreliable across redirects.
- `/api/generate` → POST: takes form inputs → (1) Perplexity Search API finds one real event, (2) GPT-5 mini (`gpt-5-mini`) generates structured JSON: briefing, script shell, starters list, comfort stat placeholder, (3) Claude Sonnet 4.6 (`claude-sonnet-4-6`) rewrites the 2-3 emotionally loaded lines (comfort stat framing, first-hour script reassurance). Comfort level drives output structure: 1-2 = suggest lowest-friction format (drop-in class, no talking required), 3 = balanced, 4-5 = direct script, get out of the way.
- `/api/email` → POST: Resend — adds email to list, triggers T+3 follow-up sequence ("Did you go?")
- `/tools/goanyway/[activity]/[city]` → pSEO page. Same Perplexity data call as the main tool. Use ISR (`revalidate: 86400`) — call Perplexity at request time, not build time. This means any activity/city combination works immediately, no build step. Add `generateStaticParams` only for top 20 combinations once there's traffic data. Template built at launch, pages indexed month 2-3.
- `/api/sms` → POST: Telnyx — registers phone number, schedules event reminder (T-1hr) + "Did you go?" follow-up (T+3hrs post-event)
- `/api/sms/webhook` → POST: Telnyx inbound webhook — receives "Did you go?" reply, logs yes/no to analytics, triggers optional follow-up

## Monetization

`one-time-payment` — $9 Stripe Checkout Session.

Free tier: activity + city → one real event card + 3-line "what to expect" summary.
Paywall: full first-hour script, conversation starters, comfort stats ("X% of people came alone"), and city-specific event details.

PayGate trigger: wall renders immediately below the free event card on /result. No usage limit — the split is content-based, not usage-based. Free = event + 3-line briefing. Paid = full script + stats + conversation starters.

The emotional hook (you're not alone, here's the event) is always free. The practical toolkit that gets you through the door costs $9.

**The $9 is a commitment device.** Someone who paid $9 is materially more likely to attend than someone who didn't. The price point isn't just revenue — it's behavior change by design. Don't make it free. Don't lower it.

## Distribution & Monetization

Follows studio standard strategy.md.
Launch sequence: Reddit day 1 → engage 48hrs → pSEO templates wired at build → Indie Hackers week 2.

## Analytics Events

- `plan_generated` — user hits /result (activity, city, comfort_level)
- `paygate_hit` — user sees the $9 wall
- `payment_complete` — Stripe PayGate cleared
- `sms_opted_in` — user gives phone number
- `did_you_go_yes` — inbound SMS reply logged as yes
- `did_you_go_no` — inbound SMS reply logged as no

## Target Subreddits

- r/socialskills
- r/lonely
- r/introverts
- r/MakeNewFriendsHere

## Social Profiles

- X/Twitter: https://x.com/lukehanner
- GitHub: https://github.com/modryn-studio/goanyway
- Dev.to: https://dev.to/lukehanner
- Ship or Die: https://shipordie.club/lukehanner
