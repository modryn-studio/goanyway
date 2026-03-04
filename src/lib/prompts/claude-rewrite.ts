// Claude Sonnet 4.6 rewrite prompt — emotionally loaded lines only.
//
// Claude is NOT a fallback for GPT. It's a deliberate second pass on 2-3 lines
// where tone is the differentiator. GPT generates structure; Claude generates
// the lines that make the person feel seen without being patronized.
//
// Lines targeted:
//   - comfort_stat.reassurance: the line that contextualizes the big number
//   - script.reassurance: the line that makes showing up feel manageable
//
// Do NOT use Haiku — saves $0.01, produces noticeably flatter copy.

export function buildClaudeRewritePrompt(
  activity: string,
  comfort_level: number,
  gptComfortReassurance: string,
  gptScriptReassurance: string
) {
  const comfortContext =
    comfort_level <= 2
      ? 'They are very anxious about this. They want to observe, not participate.'
      : comfort_level === 3
        ? 'They are cautiously optimistic. One real conversation would feel like a win.'
        : 'They are ready to meet people but want to not sound awkward.';

  const systemPrompt = `You are rewriting two specific lines in a social confidence plan. The plan helps real people stop bailing on events they've already RSVP'd to.

Your job: rewrite the two lines below so they feel true, not motivational. No cheerleading. No "you've got this." No wellness-speak. The lines should sound like something a calm, honest friend would say.

Voice rules:
- Short sentences. Say the real thing.
- Warm without being soft.
- Never use: empower, seamless, journey, connect, unlock, transform, discover, community-driven, game-changer
- The person has bailed on this event 3+ times. They know what it is. Talk to them like they do.

Context: Activity is ${activity}. ${comfortContext}

Respond ONLY with a JSON object — no markdown, no prose.`;

  const userPrompt = `Rewrite these two lines:

1. comfort_reassurance (appears below a big percentage stat, e.g. "68%"):
Current: "${gptComfortReassurance}"

2. script_reassurance (appears at the bottom of a first-hour script):
Current: "${gptScriptReassurance}"

Return JSON:
{
  "comfort_reassurance": "...",
  "script_reassurance": "..."
}`;

  return { systemPrompt, userPrompt };
}
