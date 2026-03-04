/**
 * Stripe Checkout Sessions — $9 one-time payment for GoAnyway plan.
 *
 * Accepts optional plan metadata in the POST body and stores it in the
 * Stripe session so /confirm can read it after redirect.
 *
 * Prerequisites:
 *   npm install stripe
 *   .env.local: STRIPE_SECRET_KEY, STRIPE_PRICE_ID
 */
import { createRouteLogger } from '@/lib/route-logger';
import Stripe from 'stripe';

const log = createRouteLogger('checkout');

interface CheckoutBody {
  plan_id?: string;
  activity?: string;
  city?: string;
  comfort_level?: number;
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!secretKey || !priceId) {
      log.warn(ctx.reqId, 'Stripe not configured');
      return log.end(
        ctx,
        Response.json({ error: 'Payment service unavailable' }, { status: 503 }),
      );
    }

    // Read optional plan metadata from body
    let body: CheckoutBody = {};
    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      // Body is optional — no-op if absent or unparseable
    }

    const stripe = new Stripe(secretKey);

    // Build success URL — /confirm reads session_id to retrieve plan metadata
    const origin = new URL(req.url).origin;
    const basePath = '/tools/goanyway';
    const successUrl = `${origin}${basePath}/confirm?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${basePath}/result`;

    // Strip undefined values — Stripe metadata values must be strings
    const metadata: Record<string, string> = {};
    if (body.plan_id) metadata.plan_id = body.plan_id;
    if (body.activity) metadata.activity = body.activity;
    if (body.city) metadata.city = body.city;
    if (body.comfort_level !== undefined) metadata.comfort_level = String(body.comfort_level);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    log.info(ctx.reqId, 'Checkout session created', { sessionId: session.id });
    return log.end(ctx, Response.json({ url: session.url }));
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
