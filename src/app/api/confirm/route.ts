// GET /api/confirm?session_id=...
//
// Validates a Stripe Checkout Session server-side and returns payment status
// + plan metadata. Called by /confirm page before showing any paid content —
// prevents fake session_id params from bypassing the gate.
//
// Returns:
//   { paid: true, plan_id, activity, city, comfort_level }  — payment verified
//   { paid: false }                                          — not paid / wrong status
//   { error: string }                                        — bad request or server error

import { createRouteLogger } from '@/lib/route-logger';
import Stripe from 'stripe';

const log = createRouteLogger('confirm');

export async function GET(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return log.end(
        ctx,
        Response.json({ error: 'session_id required' }, { status: 400 }),
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      log.warn(ctx.reqId, 'Stripe not configured');
      return log.end(
        ctx,
        Response.json({ error: 'Payment service unavailable' }, { status: 503 }),
      );
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      log.warn(ctx.reqId, 'Session not paid', { sessionId, status: session.payment_status });
      return log.end(ctx, Response.json({ paid: false }, { status: 402 }));
    }

    const result = {
      paid: true,
      plan_id: session.metadata?.plan_id ?? null,
      activity: session.metadata?.activity ?? null,
      city: session.metadata?.city ?? null,
      comfort_level: session.metadata?.comfort_level
        ? Number(session.metadata.comfort_level)
        : null,
    };

    log.info(ctx.reqId, 'Payment verified', { sessionId, plan_id: result.plan_id });
    return log.end(ctx, Response.json(result));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
