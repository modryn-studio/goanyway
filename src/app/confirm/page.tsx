'use client';

// /confirm — post-payment page.
// Reads plan from sessionStorage (same browser session as /result).
// Sets payment_receipt in localStorage so /result's PayGate shows paid state.
// Shows: comfort stat + full script + SMS opt-in.
//
// Plan data comes from sessionStorage (written by PlanForm on /result).
// session_id in URL params confirms Stripe payment happened.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Plan } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { BASE_PATH } from '@/lib/base-path';

const RECEIPT_KEY = 'payment_receipt';

// ---------------------------------------------------------------------------
// SMS opt-in — schedules a reminder + "did you go?" follow-up.
// Optional: user skips, plan still works without it.
// ---------------------------------------------------------------------------
function SmsOptIn({ activity, city }: { activity: string; city: string }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [skipped, setSkipped] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${BASE_PATH}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), activity, city }),
      });
      analytics.smsOptedIn();
    } catch {
      // soft-fail
    }
    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <p className="text-muted font-mono text-sm">
        Done. You&apos;ll get a reminder before the event and a follow-up after.
      </p>
    );
  }

  if (skipped) {
    return (
      <p className="text-muted font-mono text-sm">
        No problem. Go back and check the briefing before you leave.
      </p>
    );
  }

  return (
    <div>
      <p className="font-heading text-xl font-bold">Want a reminder?</p>
      <p className="text-muted mt-2 text-sm">
        Text you before the event. Follow up after to ask if you went. Two messages total.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 flex gap-3">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="border-border bg-surface text-text placeholder-muted focus:border-accent min-w-0 flex-1 border px-4 py-3 text-sm focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-accent shrink-0 px-6 py-3 font-mono text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {sending ? 'Done...' : 'Yes →'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setSkipped(true)}
        className="text-muted hover:text-text mt-3 font-mono text-xs underline underline-offset-4"
      >
        No thanks
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm page
// ---------------------------------------------------------------------------
export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [notFound, setNotFound] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Must have a session_id — otherwise this is a direct navigation, not a paid redirect
    if (!sessionId) {
      setNotFound(true);
      return;
    }

    // Mark as paid in localStorage — unlocks PayGate on /result if user navigates back
    localStorage.setItem(RECEIPT_KEY, new Date().toISOString());
    analytics.paymentComplete();

    // Read plan from sessionStorage (written by PlanForm before redirect)
    const planId = sessionStorage.getItem('current_plan_id');
    if (!planId) {
      // Session was cleared (new tab, etc.) — still show success, just without plan data
      setNotFound(true);
      return;
    }

    const stored = sessionStorage.getItem(`plan_${planId}`);
    if (!stored) {
      setNotFound(true);
      return;
    }

    try {
      setPlan(JSON.parse(stored) as Plan);
    } catch {
      setNotFound(true);
    }
  }, [sessionId]);

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-xl font-bold">Payment received.</p>
        <p className="text-muted mt-3 text-sm">
          Your plan wasn&apos;t found in this session — it may have been cleared.
        </p>
        <Link href="/" className="text-accent mt-5 font-mono text-sm underline underline-offset-4">
          Generate a new plan →
        </Link>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-xl">
          <div className="bg-surface h-8 w-2/3 animate-pulse" />
          <div className="bg-surface mt-4 h-4 w-full animate-pulse" />
        </div>
      </main>
    );
  }

  const { comfort_stat } = plan.briefing;
  const { opener, followups, exit, reassurance } = plan.script;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-xl space-y-16 px-6 py-16">
        {/* Header */}
        <div>
          <p className="text-accent font-mono text-xs font-bold tracking-widest uppercase">
            Plan unlocked
          </p>
          <h1 className="font-heading mt-2 text-3xl font-bold">
            {plan.activity} in {plan.city}
          </h1>
        </div>

        {/* Comfort stat — surfaces first, brand rule: big number stops the scroll */}
        <section>
          <div className="text-accent font-heading text-[72px] leading-none font-bold">
            {comfort_stat.percentage}%
          </div>
          <p className="text-muted mt-3 max-w-sm text-base">{comfort_stat.label}</p>
          <p className="mt-2 max-w-sm text-base">{comfort_stat.reassurance}</p>
        </section>

        {/* First-hour script */}
        <section>
          <p className="text-muted mb-6 font-mono text-xs font-bold tracking-widest uppercase">
            Your first-hour script
          </p>
          <div className="space-y-6">
            <div>
              <span className="text-muted font-mono text-xs tracking-widest uppercase">
                Open with
              </span>
              <p className="mt-2 text-lg font-medium">&ldquo;{opener}&rdquo;</p>
            </div>
            {followups.map((line, i) => (
              <div key={i}>
                <span className="text-muted font-mono text-xs tracking-widest uppercase">
                  Follow up
                </span>
                <p className="mt-2 text-base">&ldquo;{line}&rdquo;</p>
              </div>
            ))}
            <div>
              <span className="text-muted font-mono text-xs tracking-widest uppercase">
                Exit if needed
              </span>
              <p className="mt-2 text-base">&ldquo;{exit}&rdquo;</p>
            </div>
          </div>
          <p className="text-muted mt-8 text-sm">{reassurance}</p>
        </section>

        {/* SMS opt-in */}
        <section className="border-border border-t pt-10">
          <SmsOptIn activity={plan.activity} city={plan.city} />
        </section>

        {/* Back to event details */}
        <Link
          href={`/result?id=${plan.id}`}
          className="text-muted hover:text-text block font-mono text-xs underline underline-offset-4"
        >
          ← Back to event details
        </Link>
      </div>
    </main>
  );
}
