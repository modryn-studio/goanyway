// Telnyx client singleton.
// Import this wherever you need to send or schedule SMS messages.

import Telnyx from 'telnyx';

let _client: Telnyx | null = null;

export function getTelnyxClient(): Telnyx {
  if (!_client) {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) throw new Error('TELNYX_API_KEY env var is not set');
    _client = new Telnyx({ apiKey });
  }
  return _client;
}

// The number we send FROM — set in env as E.164 (e.g. +18005551234)
export const TELNYX_FROM = process.env.TELNYX_FROM_NUMBER ?? '';

// ---------------------------------------------------------------------------
// parseEventDate
// Converts human-readable event date/time strings like:
//   dateStr:  "Saturday, March 14"  or  "March 14"
//   timeStr:  "10:00 AM"
// into a Date object. Returns null if parsing fails or date is not in the
// future. If the parsed date fell last year, tries next year.
// ---------------------------------------------------------------------------
export function parseEventDate(dateStr: string, timeStr: string): Date | null {
  try {
    const year = new Date().getFullYear();
    const attempt = (y: number) => {
      const d = new Date(`${dateStr}, ${y} ${timeStr}`);
      return isNaN(d.getTime()) ? null : d;
    };

    let d = attempt(year);
    if (!d) return null;

    // If it resolved to the past, assume next year
    if (d < new Date()) {
      d = attempt(year + 1) ?? d;
    }

    return d > new Date() ? d : null;
  } catch {
    return null;
  }
}
