import type { Metadata } from 'next';
import { espnUrls, leagueInfo, type LeagueId } from '@/lib/leagues';

export type GameParams = Promise<{ season: string; gameId: string }>;

export async function gameMetadata(league: LeagueId, params: GameParams): Promise<Metadata> {
  const { gameId } = await params;
  const site = leagueInfo(league).siteName;
  const fallback = { title: `Game - ${site}` };

  try {
    const res = await fetch(
      `${espnUrls(league).site}/summary?event=${gameId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return fallback;

    const data = await res.json();
    const competition = data.header?.competitions?.[0];
    if (!competition) return fallback;

    const away = competition.competitors?.find((c: any) => c.homeAway === 'away');
    const home = competition.competitors?.find((c: any) => c.homeAway === 'home');
    if (!away || !home) return fallback;

    const awayName = away.team?.displayName || away.team?.abbreviation || 'Away';
    const homeName = home.team?.displayName || home.team?.abbreviation || 'Home';
    const status = competition.status?.type?.detail || '';
    const score = `${away.score}-${home.score}`;

    const title = `${awayName} vs ${homeName} - ${site}`;
    const description = `${awayName} ${score} ${homeName} — ${status}. Box score, stats, and game details.`;

    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return fallback;
  }
}
