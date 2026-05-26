import type { NextConfig } from "next";
import { CURRENT_SEASON } from "./lib/seasons";

const nextConfig: NextConfig = {
  // Allow LAN hosts to hit the dev server without the Next.js cross-origin warning.
  allowedDevOrigins: ['192.168.0.101'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/combiner/i/**',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/**',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/headshots/**',
      },
    ],
  },
  async redirects() {
    // Old top-level URLs map to the current season. Using permanent: false (307)
    // so when CURRENT_SEASON advances, browsers don't have a cached 301 pinning
    // them to the previous season.
    const base = `/seasons/${CURRENT_SEASON}`;
    return [
      { source: '/teams',             destination: `${base}/teams`,             permanent: false },
      { source: '/teams/:teamId',     destination: `${base}/teams/:teamId`,     permanent: false },
      { source: '/players',           destination: `${base}/players`,           permanent: false },
      { source: '/players/:playerId', destination: `${base}/players/:playerId`, permanent: false },
      { source: '/standings',         destination: `${base}/standings`,         permanent: false },
      { source: '/games/:gameId',     destination: `${base}/games/:gameId`,     permanent: false },
    ];
  },
};

export default nextConfig;
