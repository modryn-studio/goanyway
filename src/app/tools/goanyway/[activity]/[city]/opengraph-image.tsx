// Per-page OG image for pSEO routes.
// 1200×630px PNG — large-format Twitter/OG card.
import { ImageResponse } from 'next/og';

import { getPseoCombos } from '@/../content/pseo/combos';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ activity: string; city: string }>;
}

export default async function PseoOgImage({ params }: Props) {
  const { activity, city } = await params;
  const match = getPseoCombos().find(c => c.activitySlug === activity && c.citySlug === city);

  const activityLabel = match?.activityLabel ?? activity;
  const cityLabel = match?.cityLabel ?? city;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A1713',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        {/* Brand label */}
        <div
          style={{
            color: '#F5A623',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 24,
            textTransform: 'uppercase',
          }}
        >
          GOANYWAY
        </div>

        {/* Headline */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: 28,
          }}
        >
          {activityLabel} in {cityLabel}.
        </div>

        {/* Subline */}
        <div style={{ color: '#9B9590', fontSize: 28, lineHeight: 1.4 }}>
          One real event. What to expect. A first-hour script.
        </div>

        {/* Price anchor — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 80,
            color: '#F5A623',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          $9
        </div>
      </div>
    ),
    { ...size },
  );
}
