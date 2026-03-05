import { ImageResponse } from 'next/og';
import { getPseoCombos } from '../../../../content/pseo/combos';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  return getPseoCombos().map((combo) => ({
    activity: combo.activitySlug,
    city: combo.citySlug,
  }));
}

interface Props {
  params: Promise<{ activity: string; city: string }>;
}

export default async function OpenGraphImage({ params }: Props) {
  const { activity, city } = await params;

  // Humanize slugs for display
  const toLabel = (slug: string) =>
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const activityLabel = toLabel(activity);
  const cityLabel = toLabel(city);

  return new ImageResponse(
    <div
      style={{
        background: '#1A1713',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      <p
        style={{
          color: '#F5A623',
          fontFamily: 'monospace',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: 24,
        }}
      >
        {activityLabel} · {cityLabel}
      </p>
      <h1
        style={{
          color: '#FAF7F2',
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.1,
          margin: 0,
          marginBottom: 32,
        }}
      >
        Show up to your first{' '}
        <span style={{ color: '#F5A623' }}>{activityLabel.toLowerCase()}</span> event ready.
      </h1>
      <p
        style={{
          color: '#9E9693',
          fontSize: 28,
          margin: 0,
        }}
      >
        One real {cityLabel} event · briefing · first-hour script
      </p>
      <p
        style={{
          color: '#F5A623',
          fontFamily: 'monospace',
          fontSize: 20,
          fontWeight: 600,
          margin: 0,
          marginTop: 'auto',
        }}
      >
        GoAnyway
      </p>
    </div>,
    { ...size }
  );
}
