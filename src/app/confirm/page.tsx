'use client';

// /confirm — post-payment page.
// Validates payment server-side via GET /api/confirm?session_id=...
// Reads plan from sessionStorage using plan_id returned by the API.
// Sets payment_receipt in localStorage so /result's PayGate shows paid state.
// Shows: comfort stat + full script + SMS opt-in.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Plan } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { BASE_PATH } from '@/lib/base-path';

const RECEIPT_KEY = 'payment_receipt';

interface ConfirmMeta {
  paid: boolean;
  plan_id: string | null;
  activity: string | null;
  city: string | null;
  comfort_level: number | null;
}

// ---------------------------------------------------------------------------
// SMS opt-in — schedules a reminder + "did you go?" follow-up.
// Optional: user skips, plan still works without it.
// ---------------------------------------------------------------------------
function SmsOptIn({
  activity,
  city,
  eventDate,
  eventTime,
}: {
  activity: string;
  city: string;
  eventDate?: string;
  eventTime?: string;
}) {
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
        body: JSON.stringify({ phone: phone.trim(), activity, city, eventDate, eventTime }),
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
function ConfirmContent() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meta, setMeta] = useState<ConfirmMeta | null>(null);
  const [status, setStatus] = useState<'loading' | 'paid_no_plan' | 'not_paid' | 'no_session'>(
    'loading'
  );

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('no_session');
      return;
    }

    // Validate payment server-side — prevents fake session_id params bypassing the gate
    fetch(`${BASE_PATH}/api/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: ConfirmMeta) => {
        if (!data.paid) {
          setStatus('not_paid');
          return;
        }

        // Mark as paid in localStorage — unlocks PayGate on /result if user navigates back
        localStorage.setItem(RECEIPT_KEY, new Date().toISOString());
        analytics.paymentComplete();
        setMeta(data);

        // Load plan from sessionStorage using plan_id from Stripe session metadata
        const planId = data.plan_id ?? sessionStorage.getItem('current_plan_id');
        if (!planId) {
          setStatus('paid_no_plan');
          return;
        }

        const stored = sessionStorage.getItem(`plan_${planId}`);
        if (!stored) {
          setStatus('paid_no_plan');
          return;
        }

        try {
          setPlan(JSON.parse(stored) as Plan);
        } catch {
          setStatus('paid_no_plan');
        }
      })
      .catch(() => setStatus('not_paid'));
  }, [sessionId]);

  if (status === 'no_session' || status === 'not_paid') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-xl font-bold">No payment found.</p>
        <p className="text-muted mt-3 text-sm">
          This link isn&apos;t valid or the payment wasn&apos;t completed.
        </p>
        <Link href="/" className="text-accent mt-5 font-mono text-sm underline underline-offset-4">
          Start over →
        </Link>
      </main>
    );
  }

  if (status === 'paid_no_plan') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-xl font-bold">Payment received.</p>
        <p className="text-muted mt-3 text-sm">
          Your plan wasn&apos;t found in this session — it may have been cleared.
          {meta?.activity && meta?.city && (
            <>
              {' '}
              You paid for a {meta.activity} plan in {meta.city}.
            </>
          )}
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
          <SmsOptIn
            activity={plan.activity}
            city={plan.city}
            eventDate={plan.event.date}
            eventTime={plan.event.time}
          />
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

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
