// pSEO page — activity + city combo.
// Target: activity-first user (Type 2) who searches "hiking clubs Denver for adults."
// RULE: Never mention loneliness, making friends, or feeling isolated.
// Speak to the activity and the plan — not the need underneath it.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { site } from '@/config/site';
import { getPseoCombos } from '@/../content/pseo/combos';

interface Props {
  params: Promise<{ activity: string; city: string }>;
}

export async function generateStaticParams() {
  return getPseoCombos().map(({ activitySlug, citySlug }) => ({
    activity: activitySlug,
    city: citySlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { activity, city } = await params;
  const match = getPseoCombos().find(c => c.activitySlug === activity && c.citySlug === city);
  if (!match) return {};

  const { activityLabel, cityLabel } = match;
  const title = `${activityLabel} Groups in ${cityLabel} — Find Your First Event`;
  const description = `Find a real upcoming ${activityLabel.toLowerCase()} event in ${cityLabel}. Know what to expect before you walk in. Get a word-for-word first-hour script.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${site.url}/tools/goanyway/${activity}/${city}`,
      siteName: site.name,
      images: [
        {
          url: `${site.url}/tools/goanyway/${activity}/${city}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${activityLabel} groups in ${cityLabel}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PseoPage({ params }: Props) {
  const { activity, city } = await params;
  const match = getPseoCombos().find(c => c.activitySlug === activity && c.citySlug === city);
  if (!match) notFound();

  const { activityLabel, cityLabel } = match;
  const activityLower = activityLabel.toLowerCase();

  return (
    <main className="mx-auto max-w-xl px-6 py-24 md:py-32">
      {/* H1 — keyword in first sentence */}
      <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {activityLabel} groups in {cityLabel}.
        <br />
        <span className="text-accent">Show up ready.</span>
      </h1>

      <p className="text-muted mt-6 text-lg">
        There are plenty of {activityLower} groups in {cityLabel}. Finding the right one, knowing
        the format, knowing what to say when you walk in — that part takes longer. GoAnyway cuts
        it down to one real upcoming event and a word-for-word plan for your first hour.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="font-heading text-xl font-semibold">What you get</h2>
        <ul className="text-muted space-y-3 text-base">
          <li>
            <span className="text-accent font-mono">→</span>{' '}
            One real {activityLower} event in {cityLabel} happening soon — not a directory, one
            event
          </li>
          <li>
            <span className="text-accent font-mono">→</span>{' '}
            Group format, typical size, experience level — no surprises when you arrive
          </li>
          <li>
            <span className="text-accent font-mono">→</span>{' '}
            A first-hour script: what to say, when to say it, how to exit cleanly if you need to
          </li>
        </ul>
      </section>

      <Link
        href={`/?activity=${encodeURIComponent(activityLabel)}&city=${encodeURIComponent(cityLabel)}`}
        className="bg-accent text-bg mt-10 inline-block px-8 py-4 font-mono text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90"
      >
        Get my {activityLabel} plan →
      </Link>

      <p className="text-muted mt-4 text-sm">One-time $9. No account required.</p>
    </main>
  );
}
