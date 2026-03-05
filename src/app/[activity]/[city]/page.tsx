import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPseoCombos, type PseoCombo } from '../../../../content/pseo/combos';
import { site } from '@/config/site';

interface Props {
  params: Promise<{ activity: string; city: string }>;
}

// Build a lookup map for fast validation
function getComboMap(): Map<string, PseoCombo> {
  const map = new Map<string, PseoCombo>();
  for (const combo of getPseoCombos()) {
    map.set(`${combo.activitySlug}:${combo.citySlug}`, combo);
  }
  return map;
}

export async function generateStaticParams() {
  return getPseoCombos().map((combo) => ({
    activity: combo.activitySlug,
    city: combo.citySlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { activity, city } = await params;
  const combo = getComboMap().get(`${activity}:${city}`);
  if (!combo) return {};

  const title = `${combo.activityLabel} in ${combo.cityLabel} — Show Up Ready`;
  const description = `Find a real upcoming ${combo.activityLabel.toLowerCase()} event in ${combo.cityLabel}. Know what to expect and exactly what to say when you walk in.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${site.url}/${activity}/${city}`,
      siteName: site.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: site.social.twitterHandle,
    },
    alternates: {
      canonical: `${site.url}/${activity}/${city}`,
    },
  };
}

export default async function PseoPage({ params }: Props) {
  const { activity, city } = await params;
  const combo = getComboMap().get(`${activity}:${city}`);
  if (!combo) notFound();

  const activityLower = combo.activityLabel.toLowerCase();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-xl px-6 py-24 md:py-32">
        <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase">
          {combo.activityLabel} · {combo.cityLabel}
        </p>

        <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Find a real {activityLower} event in {combo.cityLabel}.
          <br />
          <span className="text-accent">Show up ready.</span>
        </h1>

        <p className="text-muted mt-6 text-lg leading-relaxed">
          Know what to expect before you walk in. One real upcoming event, a quick briefing on the
          group, and a first-hour script so you&apos;re not standing there wondering what to say.
        </p>

        <Link
          href={`/?activity=${encodeURIComponent(combo.activityLabel)}&city=${encodeURIComponent(combo.cityLabel)}`}
          className="bg-accent text-bg font-heading mt-8 inline-block rounded-lg px-8 py-4 text-base font-bold transition-opacity hover:opacity-90"
        >
          Get my {combo.activityLabel} plan →
        </Link>
      </section>

      {/* What you get */}
      <section className="border-border border-t">
        <div className="mx-auto max-w-xl px-6 py-16">
          <h2 className="font-heading text-2xl font-bold">What you get</h2>
          <ul className="text-muted mt-6 space-y-4 text-base leading-relaxed">
            <li>
              <span className="text-accent font-semibold">A real event.</span> An actual upcoming{' '}
              {activityLower} event in {combo.cityLabel} — not a list of clubs to research later.
            </li>
            <li>
              <span className="text-accent font-semibold">A what-to-expect briefing.</span> Format,
              typical crowd, how the first 15 minutes usually go.
            </li>
            <li>
              <span className="text-accent font-semibold">A first-hour script.</span> Word-for-word
              lines. What to say when you arrive, when someone asks why you&apos;re there, and how
              to exit gracefully.
            </li>
          </ul>

          <Link
            href={`/?activity=${encodeURIComponent(combo.activityLabel)}&city=${encodeURIComponent(combo.cityLabel)}`}
            className="bg-accent text-bg font-heading mt-8 inline-block rounded-lg px-8 py-4 text-base font-bold transition-opacity hover:opacity-90"
          >
            Get my {combo.activityLabel} plan →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border text-muted border-t px-6 py-10 text-center font-mono text-xs">
        <Link href="/" className="hover:text-accent transition-colors">
          GoAnyway
        </Link>{' '}
        · Built by Luke because he&apos;s also bailed on a few Meetups.
      </footer>
    </main>
  );
}
