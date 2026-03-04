# Project Context

## Product

An AI tool that turns the anxiety of attending your first social group into a clear, actionable plan.
Input your activity, city, and comfort level — get one real event, a full "what to expect" briefing, and a first-hour script so you actually walk through the door.

## Target User

(Theoretical) Marcus, 26, moved to a new city 8 months ago. He has a full-time remote job, a few online friends, and zero local ones. He's RSVPd to three Meetup events and bailed on all three. He doesn't need help finding groups — he needs someone to tell him exactly what will happen when he walks in, what to say, and that it's normal to feel this way.

## URL

https://modrynstudio.com/tools/goanyway

## Stack Additions

- **Resend** — email list capture, studio-wide broadcast, future nurture
- **Telnyx** — SMS: event reminder (T-1hr) + "Did you go?" follow-up (T+3hrs post-event). Opt-in framed as a feature: "Text me a reminder before my event." Never promotional.
- **Telnyx Webhooks** — inbound SMS handler for "Did you go?" reply logging
- **Stripe Payment Link** — $9 one-time PayGate for full script + city-specific event data
- **OpenAI GPT-5 mini** — primary model for briefing + script generation (fast, cheap, structured output)
- **Anthropic Claude Sonnet 4.6** — secondary/fallback for emotionally-calibrated script copy if needed
- **Perplexity** — Event lookup engine. It searches the live web, finds Luma, Eventbrite, Meetup, Facebook Events. No dead endpoints, no API approval required.

## Project Structure Additions

- `/content/tools/goanyway.json` — tool metadata for modryn-studio-v2 landing page
- `/lib/prompts/` — prompt templates for briefing generation (briefing.ts, script.ts)
- `/lib/perplexity.ts` — Perplexity event lookup wrapper + fallback logic (no-results fallback: Google search link)
- `/app/tools/goanyway/[activity]/[city]/page.tsx` — pSEO dynamic route template
- `/content/pseo/combinations.json` — master list of activity + city combinations to generate (populate month 2-3)
- `/app/api/sms/webhook/route.ts` — Telnyx inbound SMS webhook handler

## Route Map

- `/` → Hero + input form (activity type, city, comfort level 1–5). Submits to generate flow.
- `/result` → AI-generated output: one event card, "what to expect" briefing (free), + PayGate wall before full first-hour script and comfort stats
- `/confirm` → Post-PayGate: full script unlocked. Email capture prompt: "Save your plan + we'll check in to see how it went" (Right now /confirm is both the "payment success" page AND the SMS/email capture. That's fine for the 48-hour build — just know that if Stripe redirects to /confirm and the user closes the tab immediately, you lose the capture. Consider making the email capture happen at the PayGate wall itself (before payment), not after. Lower risk, higher capture rate.)
- `/api/generate` → POST: takes form inputs, calls GPT-5 mini + Perplexity, returns structured briefing JSON
- `/api/email` → POST: Resend — adds email to list, triggers T+3 follow-up sequence ("Did you go?")
- `/tools/goanyway/[activity]/[city]` → pSEO page. Same Perplexity data call as the main tool, rendered as a static-ish page per activity + city combination. Template built at launch, pages generated and submitted month 2-3.
- `/api/sms` → POST: Telnyx — registers phone number, schedules event reminder (T-1hr) + "Did you go?" follow-up (T+3hrs post-event)
- `/api/sms/webhook` → POST: Telnyx inbound webhook — receives "Did you go?" reply, logs yes/no to analytics, triggers optional follow-up

## Monetization

`one-time-payment` — $9 Stripe Payment Link (fast path, no server code).

Free tier: activity + city → one real event card + 3-line "what to expect" summary.
Paywall: full first-hour script, conversation starters, comfort stats ("X% of people came alone"), and city-specific event details.

PayGate trigger: wall renders immediately below the free event card on /result. No usage limit — the split is content-based, not usage-based. Free = event + 3-line briefing. Paid = full script + stats + conversation starters.

The emotional hook (you're not alone, here's the event) is always free. The practical toolkit that gets you through the door costs $9.

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
