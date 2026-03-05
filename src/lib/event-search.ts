// Claude Sonnet 4.6 web search — finds a real upcoming event.
//
// Uses the built-in web_search_20250305 tool with user_location set to the
// submitted city. No domain restriction — prompt instructs Claude to prefer
// meetup.com, eventbrite.com, and lu.ma. max_uses: 1 keeps latency ~10s.
//
// Replaces the Perplexity wrapper. Same function signature — drop-in swap.
// Returns null if ANTHROPIC_API_KEY is not set or no event is found.

import Anthropic from '@anthropic-ai/sdk';
import type { PlanEvent } from '@/lib/types';

export async function searchEvent(activity: string, city: string): Promise<PlanEvent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          // 1 search max — keeps latency under ~10s. Claude loops otherwise.
          max_uses: 1,
          // No allowed_domains — the restriction causes Claude to find only stale
          // indexed events. Instead the prompt instructs it to prefer event sites.
          user_location: {
            type: 'approximate',
            city,
            country: 'US',
          },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Search for one real upcoming ${activity} group event in ${city} happening soon — prefer the soonest event on or after today. Prefer results from meetup.com, eventbrite.com, or lu.ma but accept any legitimate event listing site.

Return the BEST event you find — even if some details are approximate. Do not return not_found unless there are truly zero results.

Return ONLY a JSON object — no markdown, no prose, no code fences:
{
  "name": "event name",
  "date": "Day, Month DD, YYYY",
  "time": "HH:MM AM/PM or TBD",
  "venue": "venue name",
  "address": "full address or city/neighborhood if full address unavailable",
  "url": "direct event URL",
  "description": "1-2 sentence description of the event"
}

If there are truly zero results for this activity in this city, return exactly: {"not_found": true}`,
        },
      ],
    });

    // The response has multiple content blocks: server_tool_use (search calls),
    // web_search_tool_result (raw results), and text (Claude's final answer).
    // The JSON we want is always in the last text block.
    const textBlocks = message.content.filter((b) => b.type === 'text');
    const lastText = textBlocks[textBlocks.length - 1];
    if (!lastText || lastText.type !== 'text') {
      console.warn('[event-search] no text block in response');
      return null;
    }

    // Strip code fences in case Claude wraps output despite instructions
    const stripped = lastText.text.replace(/```(?:json)?\s*/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[event-search] no JSON found in text block');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0].trim()) as Record<string, unknown>;
    if (parsed.not_found) {
      console.warn('[event-search] Claude returned not_found');
      return null;
    }

    return {
      name: String(parsed.name ?? ''),
      date: String(parsed.date ?? ''),
      time: String(parsed.time ?? ''),
      venue: String(parsed.venue ?? ''),
      address: String(parsed.address ?? ''),
      url: String(parsed.url ?? ''),
      description: String(parsed.description ?? ''),
      source: 'claude',
    };
  } catch (err) {
    // Network error, JSON parse error, API error — log and fall through to null
    console.error('[event-search] error:', String(err));
    return null;
  }
}
