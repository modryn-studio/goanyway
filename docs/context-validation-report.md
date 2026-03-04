## 1. Docs read

Brand and context docs are the context. Everything that follows is informed by them.

---

## 2. Concept validation

**The core problem is real and worsening.**

- Single-person households in the US have nearly doubled over 50 years. In some Scandinavian cities, 60% of households are one person. This trend is structural, not cyclical.
- Harvard's 80-year study: warm relationships are the single strongest predictor of long-term health and happiness. Social isolation mortality risk is comparable to smoking 15 cigarettes/day (Holt-Lunstad, 2015).
- People who specifically pursue _social_ strategies to improve their lives report measurably higher life satisfaction one year later. People who pursue non-social strategies (better job, more money) do not. The problem is intent-to-action failure, not awareness failure.

**Biggest validation signal: Meetup's 2026 product roadmap.**

Their three 2026 initiatives:

1. Modern mobile app
2. Easier organizing
3. **"Give members greater confidence to show up and connect"**

Their own words: _"Meeting new people can be exciting, but it can also feel daunting."_ They're building richer member profiles and "experimental connection tools…to ease social anxiety." The largest event platform in the world is building toward the exact same problem GoAnyway solves. They'll ship something corporate, slow, and generic. GoAnyway can ship something specific, human, and fast.

**The demand is there. The incumbent is slow.**

---

## 3. The reframe — here's what to challenge

**You're building an information product for a behavioral problem.**

The current framing: _give someone a plan and they'll go_. The implicit model is that the barrier is knowledge — knowing what to expect, what to say. But the RSVP-and-bail cycle isn't caused by ignorance. It's caused by avoidance. And information doesn't reliably break avoidance loops.

Consider what actually changes behavior in these scenarios:

- **Commitment devices.** The $9 payment is the most behaviorally powerful element in the entire product — not the script. A person who paid $9 has crossed a threshold. They have skin in the game. The friction is the feature. This is not currently reflected in how the product talks about itself or what it treats as valuable. You're selling the script. You should be selling the commitment.

- **The comfort stat is the real unlock, not the script.** "68% of people at their first hiking club event came alone" does more psychological work than every conversation starter combined. It removes the fear of being visibly weird. That's the specific terror that causes bailing — not "I don't know what to say," but "I'll be the only one there who doesn't know anyone." The script is downstream of that fear being resolved.

- **Comfort level 1-5 is underused.** Right now it's just used to calibrate copy tone. But a comfort 1 person and a comfort 4 person need totally different outputs. Comfort 1: suggest the smallest possible version of the activity (a class where you don't have to talk, a run where you just show up and move). Comfort 4: give them the script and get out of the way. The comfort level is actually the most important input and it's being treated as a style toggle.

- **The SMS "Did you go?" is the product's real soul.** All the AI generation is table stakes. The T+3hr follow-up is what makes this a tool that takes you seriously instead of just generating text. It's also your core data — if X% of people who got the plan and paid actually went, that number is everything. Build the SMS loop first, not last.

**The bigger challenge:** you're solving for Marcus — motivated, 26, knows what he's missing, has money. He's a great v1 user but not the largest segment. The harder, bigger user is someone stuck in managed isolation — they have _some_ social life, they're not in crisis, but they've slowly stopped trying. They're not searching r/lonely. They're not typing "how do I make friends" into Google. They're searching for specific activities. The pSEO play hits them — "hiking clubs Denver for adults" — because the intent is activity-first, not loneliness-first. That user converts better and is less likely to admit they need this, which means the copy has to not say they need it.

---

## 4. Tech and implementation landscape — current best choices

**Event discovery: Perplexity Search API (not the chat sonar model)**

Perplexity released a dedicated Search API in 2025 — it returns ranked web results with URLs directly, not wrapped in chat inference. For event lookup, this is cleaner and cheaper than the sonar chat model. Query: `"hiking club events [city] [month] site:eventbrite.com OR site:meetup.com OR site:lu.ma"`. Returns structured results you can parse without hallucination risk.

**Generation: GPT-5 mini for structure, Claude Sonnet 4.6 for emotional copy**

`gpt-5-mini` ($0.25/$2 per 1M tokens) with structured output (`response_format: { type: "json_schema" }`) is the right call for the event card + briefing JSON — fast, cheap, predictable schema. ~$0.003 per `/api/generate` call.

`claude-sonnet-4-6` ($3/$15 per 1M tokens) for the comfort stat copy and the first-hour script reassurance lines — the 2-3 emotionally loaded lines where tone is the differentiator. ~$0.015 per call.

Total cost per paid user: ~$0.02. On a $9 product, don't optimize this further. Do not use Haiku (4.5) to save $0.01 — it produces noticeably flatter copy and the brand voice is the product's only real differentiator. Do not use Sonnet for the full structured output — waste of money on schema generation.

**Stripe: Payment Link is wrong for this use case**

Payment Links don't support passing metadata to the success redirect. You lose `activity`, `city`, and `comfort_level` at the `/confirm` page. You can work around it with query params on the success URL (encode the data, decode on `/confirm`), but that data will be in the URL and visible. A proper Checkout Session (`/api/checkout`) costs a few more lines but keeps the data clean, lets you attach metadata to the payment, and lets you handle the webhook properly for the "Did you go?" follow-up trigger. Use the Checkout Session route.

**SMS: Telnyx is right, but the timing is the product**

The T-1hr reminder is a utility. The T+3hr "Did you go?" is a product differentiation. Add a third message: if they reply "no," respond with _"No worries. Same time next week?"_ and send a new event suggestion. That closes the loop and turns a bail into a re-engagement, not a lost user.

**Resend + email capture timing**

The context doc notes this risk: _"if Stripe redirects to /confirm and the user closes the tab immediately, you lose the capture."_ The fix is already called out — capture email at the PayGate wall itself, before payment. Resend's double opt-in is off by default for transactional flows; keep it off and treat the capture as a plan-save request, not a newsletter signup. The framing matters: "Email me my plan" converts better than "Sign up for updates."

**pSEO: build the template now, populate later**

The dynamic route `/tools/goanyway/[activity]/[city]` should call Perplexity at request time with ISR (revalidate: 86400) — not at build time. This means the route works immediately for any combination without a build step. Add `generateStaticParams` only for the top 20 combinations once you have traffic data. Don't pre-generate what you don't know will be searched.

---

**Bottom line on the concept:** The market need is validated and growing. The largest incumbent is building toward the same problem slowly. The positioning is correctly differentiated — GoAnyway is opinionated, specific, and honest rather than generic and inspirational. The main thing to pressure-test is whether an information product is sufficient, or whether the behavioral/commitment angle needs to be more central to the product design and the copy. The $9 price point isn't just monetization — it might be the most important UX decision in the whole product.
