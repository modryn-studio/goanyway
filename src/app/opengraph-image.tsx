import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logoData = await readFile(
    join(process.cwd(), 'public/brand/logomark.png'),
    'base64'
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="GoAnyway"
          height={52}
          style={{ marginBottom: 32, objectFit: 'contain' }}
        />
        <h1
          style={{
            color: '#FAF7F2',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 24,
          }}
        >
          Stop bailing.{' '}
          <span style={{ color: '#F5A623' }}>Show up.</span>
        </h1>
        <p
          style={{
            color: '#9E9693',
            fontSize: 28,
            margin: 0,
            marginBottom: 48,
          }}
        >
          One real event. A what-to-expect briefing. A first-hour script.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#F5A623',
            color: '#1A1713',
            fontSize: 22,
            fontWeight: 700,
            padding: '14px 28px',
            borderRadius: 8,
          }}
        >
          Get your plan for $9 
        </div>
      </div>
    ),
    { ...size }
  );
}
