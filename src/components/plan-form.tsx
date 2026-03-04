'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';

// 5 discrete labeled steps.
// Level 1 must feel dignified — "Observe" is present, not shameful.
// Labels set the emotional tone before the user sees any output.
const COMFORT_LEVELS = [
  { value: 1, label: 'Observe' },
  { value: 2, label: 'Say hi' },
  { value: 3, label: 'One opener' },
  { value: 4, label: 'Meet a few' },
  { value: 5, label: "Let's go" },
] as const;

export default function PlanForm() {
  const router = useRouter();
  const [activity, setActivity] = useState('');
  const [city, setCity] = useState('');
  const [comfort, setComfort] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasTrackedStart = useRef(false);

  // Fire form_started on first interaction — tracks intent, not just pageview
  function trackStart() {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    analytics.formStarted();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activity.trim() || !city.trim() || !comfort || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: activity.trim(),
          city: city.trim(),
          comfort_level: comfort,
        }),
      });

      if (!res.ok) {
        setError('Something went wrong. Try again.');
        return;
      }

      const data = await res.json();
      analytics.planGenerated({ activity: activity.trim(), city: city.trim(), comfort_level: comfort });

      // TODO: /api/generate returns { id } — result page fetches plan by ID
      router.push(`/result?id=${data.id}`);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 w-full max-w-xl space-y-6">
      {/* Activity */}
      <div>
        <label
          htmlFor="activity"
          className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-muted"
        >
          Activity
        </label>
        <input
          id="activity"
          type="text"
          value={activity}
          onChange={(e) => { trackStart(); setActivity(e.target.value); }}
          placeholder="hiking, book club, pottery class..."
          className="w-full border border-border bg-surface px-4 py-3 text-base text-text placeholder-muted focus:border-accent focus:outline-none"
          required
          autoComplete="off"
        />
      </div>

      {/* City */}
      <div>
        <label
          htmlFor="city"
          className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-muted"
        >
          City
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => { trackStart(); setCity(e.target.value); }}
          placeholder="Denver, Austin, Chicago..."
          className="w-full border border-border bg-surface px-4 py-3 text-base text-text placeholder-muted focus:border-accent focus:outline-none"
          required
          autoComplete="off"
        />
      </div>

      {/* Comfort level — 5 discrete labeled steps, never a range slider */}
      <div>
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted">
          How social are you feeling?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {COMFORT_LEVELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => { trackStart(); setComfort(value); }}
              aria-pressed={comfort === value}
              className={`flex flex-col items-center gap-1.5 border px-2 py-3 text-center transition-colors ${
                comfort === value
                  ? 'border-accent bg-accent text-black'
                  : 'border-border bg-surface text-text hover:border-accent'
              }`}
            >
              <span className="font-heading text-2xl font-bold leading-none">{value}</span>
              <span className="font-mono text-[10px] leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!activity.trim() || !city.trim() || !comfort || submitting}
        className="h-12 w-full bg-accent font-mono text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Building your plan...' : 'Build my plan →'}
      </button>
    </form>
  );
}
