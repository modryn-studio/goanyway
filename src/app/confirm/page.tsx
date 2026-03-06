// /confirm — server component shell.
// Client content is in confirm-content.tsx (uses useSearchParams + localStorage/sessionStorage).
// Metadata export requires this file to be a server component.

import type { Metadata } from 'next';
import { site } from '@/config/site';
import ConfirmContentWrapper from './confirm-content';

export const metadata: Metadata = {
  title: 'Your GoAnyway Plan — Comfort Stat Unlocked',
  description: 'Your GoAnyway plan is ready. See your comfort stat, a what-to-expect briefing, and your word-for-word script for the first hour. Your plan is confirmed.',
  openGraph: {
    title: 'Your GoAnyway Plan — Comfort Stat Unlocked',
    description: 'Your GoAnyway plan is ready. See your comfort stat, a what-to-expect briefing, and your word-for-word script for the first hour. Your plan is confirmed.',
    url: `${site.url}/confirm`,
    siteName: site.name,
  },
};

export default function ConfirmPage() {
  return <ConfirmContentWrapper />;
}
