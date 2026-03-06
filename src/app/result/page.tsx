// /result  server component shell.
// Client content is in result-content.tsx (uses useSearchParams + useRouter).
// Metadata export requires this file to be a server component.

import type { Metadata } from 'next';
import { site } from '@/config/site';
import ResultContentWrapper from './result-content';

export const metadata: Metadata = {
  title: 'Your GoAnyway Plan — Event, Briefing, and Script',
  description: 'Your GoAnyway plan: a real event near you and a what-to-expect briefing. The comfort stat shows how many people arrive alone. Your script unlocks for $9.',
  openGraph: {
    title: 'Your GoAnyway Plan — Event, Briefing, and Script',
    description: 'Your GoAnyway plan: a real event near you and a what-to-expect briefing. The comfort stat shows how many people arrive alone. Your script unlocks for $9.',
    url: `${site.url}/result`,
    siteName: site.name,
  },
};

export default function ResultPage() {
  return <ResultContentWrapper />;
}
