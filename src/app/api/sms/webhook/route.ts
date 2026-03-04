import { createRouteLogger } from '@/lib/route-logger';
import { analytics } from '@/lib/analytics';
import { TelnyxWebhook } from 'telnyx';

const log = createRouteLogger('sms-webhook');

// Expected Telnyx inbound event shape (simplified — only fields we use)
interface TelnyxInboundPayload {
  from: { phone_number: string };
  to: Array<{ phone_number: string }>;
  text: string;
  direction: string;
}

interface TelnyxEvent {
  data: {
    event_type: string;
    payload: TelnyxInboundPayload;
  };
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const rawBody = await req.text();

    // --- Signature verification (skip in dev if public key not set) ---
    const publicKey = process.env.TELNYX_PUBLIC_KEY;
    if (publicKey) {
      try {
        const webhook = new TelnyxWebhook(publicKey);
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
          headers[key] = value;
        });
        await webhook.verify(rawBody, headers);
      } catch (verifyError) {
        log.warn(ctx.reqId, 'Webhook signature verification failed', { verifyError });
        return log.end(ctx, Response.json({ error: 'Invalid signature' }, { status: 401 }));
      }
    } else {
      log.warn(ctx.reqId, 'TELNYX_PUBLIC_KEY not set — skipping signature verification');
    }

    const event = JSON.parse(rawBody) as TelnyxEvent;
    const { event_type, payload } = event.data;

    log.info(ctx.reqId, 'Webhook received', { event_type });

    // --- Handle inbound SMS replies ---
    if (event_type === 'message.received' && payload.direction === 'inbound') {
      const fromPhone = payload.from.phone_number;
      const text = (payload.text ?? '').trim().toUpperCase();

      log.info(ctx.reqId, 'Inbound reply', { from: fromPhone, text });

      // Track "did you go?" responses
      if (text === 'Y' || text === 'YES') {
        analytics.didYouGoYes();
        log.info(ctx.reqId, 'Did you go: YES', { from: fromPhone });
      } else if (text === 'N' || text === 'NO') {
        analytics.didYouGoNo();
        log.info(ctx.reqId, 'Did you go: NO', { from: fromPhone });
      }
      // STOP is handled automatically by Telnyx — no action needed here
    }

    // Always return 200 — Telnyx retries on non-2xx
    return log.end(ctx, Response.json({ received: true }));
  } catch (error) {
    log.err(ctx, error);
    // Still return 200 to prevent Telnyx retry storm on parsing errors
    return Response.json({ received: true }, { status: 200 });
  }
}
