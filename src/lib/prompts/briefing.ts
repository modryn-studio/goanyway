// GPT-5 mini prompt — generates structured briefing + script JSON.
//
// Comfort level shapes the output format:
//   1-2: lowest-friction format (drop-in, no talking required, observer framing)
//   3:   balanced — one opener, light participation
//   4-5: direct — meeting people is the explicit goal

import type { PlanEvent } from '@/lib/types';

export function buildBriefingPrompt(
  activity: string,
  city: string,
  comfort_level: number,
  event: PlanEvent | null,
) {
  const eventContext = event
    ? `Event found:\n- Name: ${event.name}\n- Date: ${event.date} at ${event.time}\n- Venue: ${event.venue}, ${event.address}\n- Description: ${event.description}`
    : `No specific event found. Generate a realistic placeholder event for a ${activity} group in ${city}.`;

  const comfortFrame =
    comfort_level <= 2
      ? 'The user is at comfort level 1-2: they want to observe and have zero social pressure. Frame everything as drop-in, no commitment, no talking required. Every bullet should lower the barrier to entry.'
      : comfort_level === 3
        ? 'The user is at comfort level 3: open to one opener but not looking to meet everyone. One natural conversation is success.'
        : 'The user is at comfort level 4-5: they want to meet people. The script should be direct and confident, not hedged.';

  const systemPrompt = `You are a social confidence coach. Generate a practical, specific plan for someone attending their first ${activity} group meetup.
${comfortFrame}
Voice: Short sentences. Direct. No fluff. Warm without being soft. Never use: empower, seamless, journey, connect, unlock, transform, discover, community-driven, game-changer.
Respond ONLY with a JSON object — no markdown, no prose, no code fences.`;

  const userPrompt = `${eventContext}

Activity: ${activity}
City: ${city}
Comfort level: ${comfort_level}/5

Return JSON with this exact shape:
{
  "event": {
    "name": "...",
    "date": "...",
    "time": "...",
    "venue": "...",
    "address": "...",
    "url": "...",
    "description": "..."
  },
  "briefing": {
    "headline": "What to expect at your first ${city} ${activity} meetup",
    "bullets": ["...", "...", "..."],
    "what_to_wear": "...",
    "vibe": "...",
    "comfort_stat": {
      "percentage": <integer 55-85 — realistic percentage of first-timers who came alone>,
      "label": "of first-timers at ${city} ${activity} meetups came alone",
      "reassurance": "<1 sentence — matter-of-fact, not cheerleader>"
    }
  },
  "script": {
    "opener": "<natural first line to say — specific to ${activity}, not generic>",
    "followups": ["...", "..."],
    "exit": "<graceful exit line if the conversation stalls>",
    "reassurance": "<1 sentence that makes showing up feel manageable — not motivational>"
  }
}`;

  return { systemPrompt, userPrompt };
}
