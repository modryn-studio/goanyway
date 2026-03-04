import EmailSignup from '@/components/email-signup';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          You already RSVP&apos;d.
          <br />
          <span className="text-[var(--color-accent)]">Now get a plan.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
          Pick your activity. Enter your city. Get one real event, a what-to-expect briefing, and a
          script for your first hour.
        </p>

        {/* TODO: wire input form — activity, city, comfort level 1–5 */}
        <div className="mt-10">
          <button className="h-12 rounded-none bg-[var(--color-accent)] px-8 font-mono text-sm font-bold text-white hover:opacity-90">
            Build my plan →
          </button>
        </div>
      </section>

      {/* Email signup */}
      <EmailSignup />

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 text-center font-mono text-xs text-[var(--color-muted)]">
        Built by Luke because he&apos;s also bailed on a few Meetups.
      </footer>
    </main>
  );
}
