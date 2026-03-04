// POST /api/email
// Captures email at the PayGate wall — "Email me my plan" framing.
// Double opt-in is OFF — treat this as a plan-save request, not newsletter signup.
// Adds contact to Resend audience and triggers "Did you go?" follow-up sequence.

import { createRouteLogger } from '@/lib/route-logger';
import { Resend } from 'resend';

const log = createRouteLogger('email');

interface EmailRequest {
  email: string;
  activity?: string;
  city?: string;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const apiKey = process.env.RESEND_API_KEY;
    // RESEND_SEGMENT_ID is the audience ID — Resend's contacts API takes audienceId
    const audienceId = process.env.RESEND_SEGMENT_ID ?? process.env.RESEND_AUDIENCE_ID;

    if (!apiKey) {
      log.warn(ctx.reqId, 'RESEND_API_KEY not set');
      // Soft-fail — email capture shouldn't block the user from seeing their plan
      return log.end(ctx, Response.json({ ok: true }));
    }

    let body: EmailRequest;
    try {
      body = (await req.json()) as EmailRequest;
    } catch {
      return log.end(ctx, Response.json({ error: 'Invalid JSON' }, { status: 400 }));
    }

    const { email, activity, city } = body;
    if (!email?.trim() || !email.includes('@')) {
      return log.end(ctx, Response.json({ error: 'Valid email required' }, { status: 400 }));
    }

    const resend = new Resend(apiKey);

    // Add to segment (if configured).
    // Resend's current API: contacts.create() takes segments: [{ id }], not audienceId.
    // RESEND_SEGMENT_ID is a segment inside the shared Resend team — each project gets its own.
    if (audienceId) {
      await resend.contacts.create({
        email: email.trim().toLowerCase(),
        unsubscribed: false,
        segments: [{ id: audienceId }],
      });
      log.info(ctx.reqId, 'Contact added to segment', { segmentId: audienceId });
    }

    // Send plan confirmation email
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'GoAnyway <plans@goanyway.com>';
    const activityLabel = activity ?? 'your event';
    const cityLabel = city ? ` in ${city}` : '';

    const replyTo = process.env.FEEDBACK_TO ?? process.env.GMAIL_USER;

    await resend.emails.send({
      from: fromAddress,
      to: email.trim().toLowerCase(),
      ...(replyTo ? { replyTo } : {}),
      subject: `Your plan for ${activityLabel}${cityLabel}`,
      text: [
        `Here's your GoAnyway plan.`,
        ``,
        `You picked ${activityLabel}${cityLabel}. Good choice.`,
        ``,
        `Your full plan — including the comfort stat and first-hour script — is waiting at:`,
        `https://modrynstudio.com/tools/goanyway`,
        ``,
        `In a few days I'll email to ask: did you go?`,
        `No judgment if you didn't. But I'd like to know.`,
        ``,
        `— Luke`,
      ].join('\n'),
    });

    log.info(ctx.reqId, 'Plan email sent', { email: email.substring(0, 4) + '***' });
    return log.end(ctx, Response.json({ ok: true }));
  } catch (error) {
    log.err(ctx, error);
    // Soft-fail — email issues shouldn't error the user experience
    return Response.json({ ok: true });
  }
}
