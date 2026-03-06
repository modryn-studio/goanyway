import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlanForm from '@/components/plan-form';

export const metadata: Metadata = {
  title: 'Stop Bailing on Your First Social Event',
};

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-xl px-6 py-24 md:py-32">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          You already RSVP&apos;d.
          <br />
          <span className="text-accent">Now get a plan.</span>
        </h1>
        <p className="text-muted mt-6 max-w-xl text-lg">
          Pick your activity. Enter your city. Get one real event, a what-to-expect briefing, and a
          script for your first hour.
        </p>

        <Suspense>
          <PlanForm />
        </Suspense>
      </section>

      {/* Footer */}
      <footer className="border-border text-muted border-t px-6 py-10 text-center font-mono text-xs">
        Built by Luke because he&apos;s also bailed on a few Meetups.
      </footer>
    </main>
  );
}
