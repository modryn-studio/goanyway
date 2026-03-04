// Perplexity Search API wrapper — finds a real upcoming event.
//
// Uses the sonar-pro model which executes live web searches.
// Query targets eventbrite, meetup, and lu.ma for specificity.
// Returns null if no event found or API key not configured.

import type { PlanEvent } from '@/lib/types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export async function searchEvent(
  activity: string,
  city: string,
): Promise<PlanEvent | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  // Month/year for recency — current server time in UTC
  const now = new Date();
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const query = `${activity} events ${city} ${monthYear} site:eventbrite.com OR site:meetup.com OR site:lu.ma`;

  const systemPrompt = `You are an event lookup assistant. Search the web and return ONE real upcoming event.
Respond ONLY with a JSON object — no markdown, no prose, no code fences.
JSON shape:
{
  "name": "event name",
  "date": "Day, Month DD",
  "time": "HH:MM AM/PM",
  "venue": "venue name",
  "address": "full address",
  "url": "direct event URL",
  "description": "1-2 sentence description of the event"
}
If no specific real event is found, return: {"not_found": true}`;

  try {
    const res = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.1, // deterministic — we need real data, not hallucination
        max_tokens: 400,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Strip markdown code fences if model added them anyway
    const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    if (parsed.not_found) return null;

    return {
      name: String(parsed.name ?? ''),
      date: String(parsed.date ?? ''),
      time: String(parsed.time ?? ''),
      venue: String(parsed.venue ?? ''),
      address: String(parsed.address ?? ''),
      url: String(parsed.url ?? ''),
      description: String(parsed.description ?? ''),
      source: 'perplexity',
    };
  } catch {
    // Network error, JSON parse error, etc. — fall through to null
    return null;
  }
}
