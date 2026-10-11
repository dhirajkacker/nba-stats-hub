import type { Metadata } from 'next';
import { LeagueProvider } from '@/components/LeagueProvider';

const title = 'WNBA Stats Hub - Live Scores, Standings & Statistics';
const description = 'Track live WNBA games, standings, playoff brackets, player stats and team pages, with every season since 2010.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['WNBA', 'basketball', 'stats', 'scores', 'standings', 'playoffs', 'player statistics'],
  openGraph: { type: 'website', locale: 'en_US', siteName: 'WNBA Stats Hub', title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function WnbaLayout({ children }: { children: React.ReactNode }) {
  return <LeagueProvider league="wnba">{children}</LeagueProvider>;
}
