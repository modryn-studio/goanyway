// /result  server component shell.
// Client content is in result-content.tsx (uses useSearchParams + useRouter).
// Metadata export requires this file to be a server component.

import type { Metadata } from 'next';
import { site } from '@/config/site';
import ResultContentWrapper from './result-content';

export const metadata: Metadata = {
  title: 'Your Plan',
  description: 'Your event, briefing, and first-hour script for showing up and staying.',
  openGraph: {
    title: 'Your GoAnyway Plan',
    description: 'Your event, briefing, and first-hour script for showing up and staying.',
    url: `${site.url}/result`,
    siteName: site.name,
  },
};

export default function ResultPage() {
  return <ResultContentWrapper />;
}
