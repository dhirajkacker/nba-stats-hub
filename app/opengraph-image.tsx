import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'NBA Stats Hub - Basketball Statistics & Live Scores';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d1810 50%, #1a1a1a 100%)',
        }}
      >
        {/* Basketball Icon */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 20,
          }}
        >
          🏀
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: 20,
            letterSpacing: '-0.02em',
          }}
        >
          NBA Stats Hub
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#ffa366',
            marginBottom: 40,
            fontWeight: 600,
          }}
        >
          Real-time Scores, Standings & Statistics
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 25,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            📊 Live Scores
          </div>
          <div
            style={{
              backgroundColor: '#f7931e',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 25,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            📈 Team Stats
          </div>
          <div
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 25,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            ⭐ Player Stats
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: '#999',
          }}
        >
          nba-stats-hub.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
