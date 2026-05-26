import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA Teams - Rosters & Stats | NBA Stats Hub',
  description: 'All 30 NBA teams — standings, rosters, stats, and recent game results at a glance.',
  openGraph: {
    title: 'NBA Teams - Rosters & Stats | NBA Stats Hub',
    description: 'All 30 NBA teams — standings, rosters, stats, and recent game results at a glance.',
  },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
