'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { BASE_PATH } from '@/lib/base-path';

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
  const searchParams = useSearchParams();
  const [activity, setActivity] = useState(searchParams.get('activity') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
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
      const res = await fetch(`${BASE_PATH}/api/generate`, {
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

      // GenerateResponse shape: { id: string, plan: Plan }
      const data = (await res.json()) as { id: string; plan: unknown };

      // Store plan in sessionStorage — result page reads it back by ID.
      // No backend store needed: plan travels with the browser session.
      sessionStorage.setItem(`plan_${data.id}`, JSON.stringify(data.plan));

      analytics.planGenerated({
        activity: activity.trim(),
        city: city.trim(),
        comfort_level: comfort,
      });

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
          className="text-muted mb-2 block font-mono text-xs font-bold tracking-widest uppercase"
        >
          Activity
        </label>
        <input
          id="activity"
          type="text"
          value={activity}
          onChange={(e) => {
            trackStart();
            setActivity(e.target.value);
          }}
          placeholder="hiking, book club, pottery class..."
          className="border-border bg-surface text-text placeholder-muted focus:border-accent w-full border px-4 py-3 text-base focus:outline-none"
          required
          autoComplete="off"
        />
      </div>

      {/* City */}
      <div>
        <label
          htmlFor="city"
          className="text-muted mb-2 block font-mono text-xs font-bold tracking-widest uppercase"
        >
          City
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => {
            trackStart();
            setCity(e.target.value);
          }}
          placeholder="Denver, Austin, Chicago..."
          className="border-border bg-surface text-text placeholder-muted focus:border-accent w-full border px-4 py-3 text-base focus:outline-none"
          required
          autoComplete="off"
        />
      </div>

      {/* Comfort level — 5 discrete labeled steps, never a range slider */}
      <div>
        <p className="text-muted mb-3 font-mono text-xs font-bold tracking-widest uppercase">
          How social are you feeling?
        </p>
        <div className="grid grid-cols-5 gap-2">
          {COMFORT_LEVELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                trackStart();
                setComfort(value);
              }}
              aria-pressed={comfort === value}
              className={`flex flex-col items-center gap-1.5 border px-2 py-3 text-center transition-colors ${
                comfort === value
                  ? 'border-accent bg-accent text-black'
                  : 'border-border bg-surface text-text hover:border-accent'
              }`}
            >
              <span className="font-heading text-2xl leading-none font-bold">{value}</span>
              <span className="font-mono text-[10px] leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!activity.trim() || !city.trim() || !comfort || submitting}
        className="bg-accent h-12 w-full font-mono text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Building your plan...' : 'Build my plan →'}
      </button>
    </form>
  );
}
