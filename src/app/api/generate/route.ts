// POST /api/generate
// Pipeline: Perplexity (event lookup) → GPT-5 mini (structured plan) → Claude Sonnet 4.6 (emotional lines)
//
// Returns: { id: string, plan: Plan }
// The id is stored client-side in sessionStorage; the result page reads it back.

import { createRouteLogger } from '@/lib/route-logger';
import { searchEvent } from '@/lib/perplexity';
import { buildBriefingPrompt } from '@/lib/prompts/briefing';
import { buildClaudeRewritePrompt } from '@/lib/prompts/claude-rewrite';
import type { GenerateRequest, GenerateResponse, Plan, PlanEvent } from '@/lib/types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const log = createRouteLogger('generate');

// ---------------------------------------------------------------------------
// GPT-5 mini — structural plan generation
// ---------------------------------------------------------------------------
async function callGPT(
  activity: string,
  city: string,
  comfort_level: number,
  event: PlanEvent | null,
): Promise<Partial<Plan> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = buildBriefingPrompt(activity, city, comfort_level, event);

  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content ?? '';
  return JSON.parse(content) as Partial<Plan>;
}

// ---------------------------------------------------------------------------
// Claude Sonnet 4.6 — emotional line rewrite (comfort stat + script reassurance)
// Not a fallback. A deliberate second pass where tone is the differentiator.
// ---------------------------------------------------------------------------
async function callClaude(
  activity: string,
  comfort_level: number,
  gptComfortReassurance: string,
  gptScriptReassurance: string,
): Promise<{ comfort_reassurance: string; script_reassurance: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = buildClaudeRewritePrompt(
    activity,
    comfort_level,
    gptComfortReassurance,
    gptScriptReassurance,
  );

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return null;

  // Strip markdown code fences if model added them
  const cleaned = content.text.replace(/```(?:json)?\n?/g, '').trim();
  return JSON.parse(cleaned) as { comfort_reassurance: string; script_reassurance: string };
}

// ---------------------------------------------------------------------------
// Fallback plan — when APIs aren't configured (dev / missing keys)
// ---------------------------------------------------------------------------
function buildFallbackPlan(
  activity: string,
  city: string,
  comfort_level: number,
): Partial<Plan> {
  return {
    event: {
      name: `${city} ${activity.charAt(0).toUpperCase() + activity.slice(1)} Meetup`,
      date: 'Check meetup.com for upcoming dates',
      time: 'Varies',
      venue: 'TBD',
      address: `${city}`,
      url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(activity)}&location=${encodeURIComponent(city)}`,
      description: `A local ${activity} group in ${city}. Search meetup.com for the next event.`,
      source: 'fallback',
    },
    briefing: {
      headline: `What to expect at your first ${city} ${activity} meetup`,
      bullets: [
        'Most people arrive not knowing anyone — you are completely normal.',
        'The organizer usually gathers everyone for a quick intro at the start.',
        'You can leave whenever. Nobody tracks who shows up or who bounces early.',
      ],
      what_to_wear: 'Whatever you would normally wear for this activity. No dress code.',
      vibe: 'Relaxed, self-selecting crowd. People are there because they want to be.',
      comfort_stat: {
        percentage: 68,
        label: `of first-timers at ${activity} meetups came alone`,
        reassurance: 'Being alone at this is the default, not the exception.',
      },
    },
    script: {
      opener:
        comfort_level <= 2
          ? "You don't need an opener. Show up, observe, leave if you want."
          : `"Is this your first time here too?" — works in almost every ${activity} group.`,
      followups: [
        `"How long have you been doing ${activity}?"`,
        '"What made you try this group?"',
      ],
      exit: '"I have to head out — this was great though."',
      reassurance:
        'You do not have to be on the whole time. One conversation counts as a win.',
    },
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    // Parse and validate
    let body: GenerateRequest;
    try {
      body = (await req.json()) as GenerateRequest;
    } catch {
      return log.end(
        ctx,
        Response.json({ error: 'Invalid JSON' }, { status: 400 }),
      );
    }

    const { activity, city, comfort_level } = body;
    if (!activity?.trim() || !city?.trim() || !comfort_level) {
      return log.end(
        ctx,
        Response.json({ error: 'activity, city, and comfort_level are required' }, { status: 400 }),
      );
    }

    log.info(ctx.reqId, 'Generating plan', { activity, city, comfort_level });

    // Step 1: Perplexity — find a real event
    let event: PlanEvent | null = null;
    try {
      event = await searchEvent(activity.trim(), city.trim());
      log.info(ctx.reqId, event ? 'Event found via Perplexity' : 'No Perplexity event — fallback', {
        source: event?.source ?? 'none',
      });
    } catch (err) {
      log.warn(ctx.reqId, 'Perplexity error — continuing with fallback', { err: String(err) });
    }

    // Step 2: GPT-5 mini — structured plan
    let gptPlan: Partial<Plan> | null = null;
    try {
      gptPlan = await callGPT(activity.trim(), city.trim(), comfort_level, event);
      log.info(ctx.reqId, gptPlan ? 'GPT plan generated' : 'GPT not configured — using fallback');
    } catch (err) {
      log.warn(ctx.reqId, 'GPT error — using fallback', { err: String(err) });
    }

    // Use fallback when GPT not available
    const basePlan = gptPlan ?? buildFallbackPlan(activity.trim(), city.trim(), comfort_level);

    // Merge Perplexity event into GPT plan when GPT didn't use it
    // (GPT prompt includes event context, so this is mostly a safeguard)
    if (event && basePlan.event?.source !== 'perplexity') {
      basePlan.event = event;
    }

    // Step 3: Claude Sonnet 4.6 — rewrite emotional lines
    const gptComfortReassurance = basePlan.briefing?.comfort_stat?.reassurance ?? '';
    const gptScriptReassurance = basePlan.script?.reassurance ?? '';

    let claudeRewrite: { comfort_reassurance: string; script_reassurance: string } | null = null;
    try {
      claudeRewrite = await callClaude(
        activity.trim(),
        comfort_level,
        gptComfortReassurance,
        gptScriptReassurance,
      );
      log.info(ctx.reqId, claudeRewrite ? 'Claude rewrite complete' : 'Claude not configured — using GPT lines');
    } catch (err) {
      log.warn(ctx.reqId, 'Claude error — using GPT lines', { err: String(err) });
    }

    // Merge Claude rewrites (only the 2 emotional lines)
    if (claudeRewrite && basePlan.briefing?.comfort_stat) {
      basePlan.briefing.comfort_stat.reassurance = claudeRewrite.comfort_reassurance;
    }
    if (claudeRewrite && basePlan.script) {
      basePlan.script.reassurance = claudeRewrite.script_reassurance;
    }

    // Assemble final plan
    const id = crypto.randomUUID();
    const plan: Plan = {
      id,
      activity: activity.trim(),
      city: city.trim(),
      comfort_level,
      event: basePlan.event as Plan['event'],
      briefing: basePlan.briefing as Plan['briefing'],
      script: basePlan.script as Plan['script'],
    };

    const response: GenerateResponse = { id, plan };
    return log.end(ctx, Response.json(response), { id, activity, city });
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
