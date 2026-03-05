// /confirm  server component shell.
// Client content is in confirm-content.tsx (uses useSearchParams + localStorage/sessionStorage).
// Metadata export requires this file to be a server component.

import type { Metadata } from 'next';
import { site } from '@/config/site';
import ConfirmContentWrapper from './confirm-content';

export const metadata: Metadata = {
  title: 'Plan Unlocked',
  description: 'Your comfort stat and first-hour script. Payment confirmed.',
  openGraph: {
    title: 'Your GoAnyway Plan  Unlocked',
    description: 'Your comfort stat and first-hour script. Payment confirmed.',
    url: `${site.url}/confirm`,
    siteName: site.name,
  },
};

export default function ConfirmPage() {
  return <ConfirmContentWrapper />;
}
