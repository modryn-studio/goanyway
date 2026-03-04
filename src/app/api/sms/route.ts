import { createRouteLogger } from '@/lib/route-logger';
import { getTelnyxClient, TELNYX_FROM, parseEventDate } from '@/lib/telnyx';

const log = createRouteLogger('sms');

interface SmsBody {
  phone: string;
  activity: string;
  city: string;
  eventDate?: string; // e.g. "Saturday, March 14"
  eventTime?: string; // e.g. "10:00 AM"
}

// ---------------------------------------------------------------------------
// normalizePhone — accepts messy user input, returns E.164 or null.
// Handles: 5551234567, 15551234567, +15551234567, (555) 123-4567
// ---------------------------------------------------------------------------
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // International: if raw starts with + and digits-only is 7–15 chars
  const stripped = raw.replace(/[\s\-().]/g, '');
  if (/^\+\d{7,15}$/.test(stripped)) return stripped;
  return null;
}

// ---------------------------------------------------------------------------
// isoOffset — returns ISO 8601 string for Date now plus `ms` milliseconds.
// ---------------------------------------------------------------------------
function isoOffset(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();

  try {
    const body = (await req.json()) as SmsBody;
    log.info(ctx.reqId, 'Request received', { activity: body.activity, city: body.city });

    // --- Validate phone ---
    const phone = normalizePhone(body.phone ?? '');
    if (!phone) {
      log.warn(ctx.reqId, 'Invalid phone number', { raw: body.phone });
      return log.end(ctx, Response.json({ error: 'Invalid phone number' }, { status: 400 }));
    }

    // --- Graceful no-op in dev if Telnyx not configured ---
    if (!process.env.TELNYX_API_KEY || !TELNYX_FROM) {
      log.warn(ctx.reqId, 'Telnyx not configured — skipping SMS send (dev mode)', { phone });
      return log.end(ctx, Response.json({ success: true }));
    }

    const client = getTelnyxClient();
    const { activity, city } = body;

    // --- Parse event date/time for scheduling ---
    const eventDate =
      body.eventDate && body.eventTime ? parseEventDate(body.eventDate, body.eventTime) : null;

    // Reminder: 2h before event, or fallback to 7 days from now
    const reminderAt = eventDate
      ? new Date(eventDate.getTime() - 2 * 60 * 60 * 1000).toISOString()
      : isoOffset(7 * 24 * 60 * 60 * 1000);

    // Follow-up: 24h after event start, or fallback to 8 days from now
    const followUpAt = eventDate
      ? new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : isoOffset(8 * 24 * 60 * 60 * 1000);

    // --- 1. Confirmation — send immediately ---
    await client.messages.send({
      from: TELNYX_FROM,
      to: phone,
      text: `GoAnyway: You're set. We'll text you before your ${activity} event in ${city} and check in after. Reply STOP to opt out.`,
    });

    // --- 2. Reminder — scheduled 2h before event ---
    await client.messages.schedule({
      from: TELNYX_FROM,
      to: phone,
      text: `GoAnyway: Your ${activity} event in ${city} starts in ~2 hours. You already know what to say. Just show up.`,
      send_at: reminderAt,
    });

    // --- 3. Follow-up — scheduled 24h after event ---
    await client.messages.schedule({
      from: TELNYX_FROM,
      to: phone,
      text: `GoAnyway: Did you go? Reply Y or N — we're keeping track.`,
      send_at: followUpAt,
    });

    log.info(ctx.reqId, 'SMS scheduled', {
      phone,
      reminderAt,
      followUpAt,
    });

    return log.end(ctx, Response.json({ success: true }));
  } catch (error) {
    log.err(ctx, error);
    // Soft-fail — SMS is optional, don't break the confirm page
    return Response.json({ success: false }, { status: 200 });
  }
}
