import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy — How GoAnyway Handles Your Data',
  description: 'GoAnyway collects activity inputs, email if you save your plan, and phone for SMS. Stripe handles payment. Your data is not sold or shared for advertising.',
  openGraph: {
    title: 'Privacy Policy — How GoAnyway Handles Your Data',
    url: `${site.url}/privacy`,
    siteName: site.name,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-xl space-y-10">
        <div>
          <Link
            href="/"
            className="text-muted hover:text-text font-mono text-xs tracking-widest uppercase"
          >
            ← Back
          </Link>
          <h1 className="font-heading mt-6 text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted mt-2 font-mono text-xs">Last updated: June 2025</p>
        </div>

        <section className="space-y-4 text-base">
          <h2 className="font-heading text-lg font-bold">What we collect</h2>
          <p>
            When you use GoAnyway, we collect the information you provide: your activity type, city,
            and comfort level (to generate your plan), your email address (if you choose to save
            your plan), your phone number (if you opt in to SMS reminders), and payment information
            processed by Stripe.
          </p>
          <p>
            We do not store your card number. Stripe handles payment processing and they have their
            own privacy policy at stripe.com.
          </p>
        </section>

        <section className="space-y-4 text-base">
          <h2 className="font-heading text-lg font-bold">How we use it</h2>
          <p>
            Your activity, city, and comfort level are sent to OpenAI and Anthropic to generate your
            event plan and script. These inputs are not linked to your identity in those systems.
          </p>
          <p>
            Your email is added to our list via Resend and used to deliver your plan and occasional
            follow-up messages. You can opt out at any time using the unsubscribe link in any email.
          </p>
          <p>
            Your phone number is registered with Telnyx to send one reminder before the event and
            one follow-up message after. Two messages total. Reply STOP at any time.
          </p>
        </section>

        <section className="space-y-4 text-base">
          <h2 className="font-heading text-lg font-bold">Who we share data with</h2>
          <ul className="space-y-2">
            <li>
              <span className="font-medium">Stripe</span> — payment processing
            </li>
            <li>
              <span className="font-medium">Resend</span> — email delivery
            </li>
            <li>
              <span className="font-medium">Telnyx</span> — SMS delivery
            </li>
            <li>
              <span className="font-medium">OpenAI</span> — plan generation
            </li>
            <li>
              <span className="font-medium">Anthropic</span> — event search and copy
            </li>
          </ul>
          <p>We do not sell your data. We do not share it for advertising purposes.</p>
        </section>

        <section className="space-y-4 text-base">
          <h2 className="font-heading text-lg font-bold">Analytics</h2>
          <p>
            We use Google Analytics 4 to understand how people use the tool — page views, button
            clicks, form completions. No personally identifiable information is sent to GA4.
          </p>
        </section>

        <section className="space-y-4 text-base">
          <h2 className="font-heading text-lg font-bold">Contact</h2>
          <p>
            Questions? Email{' '}
            <a
              href="mailto:luke@modrynstudio.com"
              className="text-accent underline underline-offset-4"
            >
              luke@modrynstudio.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
