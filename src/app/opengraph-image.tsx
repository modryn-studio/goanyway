import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
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
        GoAnyway
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
        Stop bailing.{' '}
        <span style={{ color: '#F5A623' }}>Show up.</span>
      </h1>
      <p
        style={{
          color: '#9E9693',
          fontSize: 28,
          margin: 0,
        }}
      >
        One real event. A what-to-expect briefing. A first-hour script.
      </p>
    </div>,
    { ...size }
  );
}