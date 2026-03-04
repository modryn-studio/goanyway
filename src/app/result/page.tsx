'use client';

// /result — shows the generated plan.
// Event card + briefing are free. Comfort stat + script are behind the $9 PayGate.
// Plan is stored in sessionStorage by PlanForm after the generate API call.

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PayGate from '@/components/pay-gate';
import { analytics } from '@/lib/analytics';
import type { Plan } from '@/lib/types';

// ---------------------------------------------------------------------------
// Email capture — "Email me this plan." framing, not newsletter signup.
// Soft-fails silently if API is unavailable — never blocks the user.
// ---------------------------------------------------------------------------
function EmailCapture({ activity, city }: { activity: string; city: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@') || sending) return;
    setSending(true);
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, activity, city }),
      });
    } catch {
      // soft-fail
    }
    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <div className="border-border border-t py-10">
        <p className="font-mono text-sm text-text">
          Sent. Check your email — your plan is there.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border border-t py-10">
      <p className="font-heading text-xl font-bold">Email me this plan.</p>
      <p className="text-muted mt-2 text-sm">
        No updates. No spam. Just your plan, saved.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="border-border bg-surface text-text placeholder-muted focus:border-accent min-w-0 flex-1 border px-4 py-3 text-sm focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-accent shrink-0 px-6 py-3 font-mono text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send my plan →'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paid content — comfort stat + script
// Comfort stat renders at 64–72px (brand rule: big number stops the scroll).
// ---------------------------------------------------------------------------
function PaidContent({ plan }: { plan: Plan }) {
  const { comfort_stat } = plan.briefing;
  const { opener, followups, exit, reassurance } = plan.script;

  return (
    <div className="space-y-12 py-10">
      {/* Comfort stat — hero element, surfaces first behind the gate */}
      <div>
        <div className="text-accent font-heading text-[72px] font-bold leading-none">
          {comfort_stat.percentage}%
        </div>
        <p className="text-muted mt-3 max-w-sm text-base">{comfort_stat.label}</p>
        <p className="mt-2 max-w-sm text-base">{comfort_stat.reassurance}</p>
      </div>

      {/* First-hour script */}
      <div>
        <p className="text-muted mb-6 font-mono text-xs font-bold uppercase tracking-widest">
          Your first-hour script
        </p>
        <div className="space-y-4">
          <div>
            <span className="text-muted font-mono text-xs uppercase tracking-widest">
              Open with
            </span>
            <p className="mt-1 text-lg font-medium">&ldquo;{opener}&rdquo;</p>
          </div>
          {followups.map((line, i) => (
            <div key={i}>
              <span className="text-muted font-mono text-xs uppercase tracking-widest">
                Follow up
              </span>
              <p className="mt-1 text-base">&ldquo;{line}&rdquo;</p>
            </div>
          ))}
          <div>
            <span className="text-muted font-mono text-xs uppercase tracking-widest">
              Exit if needed
            </span>
            <p className="mt-1 text-base">&ldquo;{exit}&rdquo;</p>
          </div>
        </div>
        <p className="text-muted mt-8 text-sm">{reassurance}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result page
// ---------------------------------------------------------------------------
export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [notFound, setNotFound] = useState(false);

  const id = searchParams.get('id');

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }

    const stored = sessionStorage.getItem(`plan_${id}`);
    if (!stored) {
      setNotFound(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Plan;
      setPlan(parsed);
      // Let the confirm page find this plan via sessionStorage
      sessionStorage.setItem('current_plan_id', id);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-muted font-mono text-sm">Plan not found.</p>
        <Link
          href="/"
          className="text-accent mt-4 font-mono text-sm underline underline-offset-4"
        >
          ← Start over
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
          <div className="bg-surface mt-2 h-4 w-4/5 animate-pulse" />
        </div>
      </main>
    );
  }

  const { event, briefing } = plan;

  // Fire analytics once (plan is already tracked in PlanForm on generate)
  // This fires on result view — useful for drop-off analysis
  useEffect(() => {
    if (plan) analytics.track('result_viewed', { activity: plan.activity, city: plan.city });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-xl px-6 py-16">

        {/* Back nav */}
        <Link
          href="/"
          className="text-muted font-mono text-xs uppercase tracking-widest hover:text-text"
          onClick={() => router.back()}
        >
          ← Back
        </Link>

        {/* Event card */}
        <section className="mt-8">
          <p className="text-muted font-mono text-xs font-bold uppercase tracking-widest">
            Event
          </p>
          <h1 className="font-heading mt-2 text-3xl font-bold">{event.name}</h1>
          <div className="text-muted mt-3 space-y-1 font-mono text-sm">
            <p>{event.date} · {event.time}</p>
            <p>{event.venue}</p>
            <p>{event.address}</p>
          </div>
          {event.url && event.url.startsWith('http') && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent mt-5 inline-block px-6 py-2.5 font-mono text-sm font-bold text-black hover:opacity-90"
            >
              RSVP →
            </a>
          )}
          {event.source === 'fallback' && (
            <p className="text-muted mt-3 font-mono text-xs">
              No live events found — link goes to meetup.com search for {plan.activity} in {plan.city}.
            </p>
          )}
        </section>

        {/* Briefing */}
        <section className="border-border mt-10 border-t pt-10">
          <p className="text-muted font-mono text-xs font-bold uppercase tracking-widest">
            Briefing
          </p>
          <h2 className="font-heading mt-2 text-xl font-bold">{briefing.headline}</h2>
          <ul className="mt-5 space-y-3">
            {briefing.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3 text-base">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2">
            <p className="text-sm">
              <span className="text-muted font-mono text-xs uppercase tracking-widest">
                What to wear:{' '}
              </span>
              {briefing.what_to_wear}
            </p>
            <p className="text-sm">
              <span className="text-muted font-mono text-xs uppercase tracking-widest">
                Vibe:{' '}
              </span>
              {briefing.vibe}
            </p>
          </div>
        </section>

        {/* Email capture — before the PayGate, framed as plan-save */}
        <EmailCapture activity={plan.activity} city={plan.city} />

        {/* PayGate — comfort stat + script behind $9 */}
        <section className="border-border border-t pt-10">
          <div className="mb-8">
            <p className="font-heading text-xl font-bold">
              The part that makes you actually go.
            </p>
            <p className="text-muted mt-2 text-sm">
              Your comfort stat for {plan.activity} groups in {plan.city}.
              Then a word-for-word script for your first hour.
            </p>
          </div>
          <PayGate
            valueProposition={`Your ${plan.activity} comfort stat + first-hour script`}
            price="$9"
            checkoutBody={{
              plan_id: plan.id,
              activity: plan.activity,
              city: plan.city,
              comfort_level: plan.comfort_level,
            }}
          >
            <PaidContent plan={plan} />
          </PayGate>
        </section>

      </div>
    </main>
  );
}
