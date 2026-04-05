import type { Metadata } from 'next';

interface Props {
  params: Promise<{ gameId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameId } = await params;

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return { title: 'Game - NBA Stats Hub' };

    const data = await res.json();
    const competition = data.header?.competitions?.[0];
    if (!competition) return { title: 'Game - NBA Stats Hub' };

    const away = competition.competitors?.find((c: any) => c.homeAway === 'away');
    const home = competition.competitors?.find((c: any) => c.homeAway === 'home');
    if (!away || !home) return { title: 'Game - NBA Stats Hub' };

    const awayName = away.team?.displayName || away.team?.abbreviation || 'Away';
    const homeName = home.team?.displayName || home.team?.abbreviation || 'Home';
    const status = competition.status?.type?.detail || '';
    const score = `${away.score}-${home.score}`;

    const title = `${awayName} vs ${homeName} - NBA Stats Hub`;
    const description = `${awayName} ${score} ${homeName} — ${status}. Box score, stats, and game details.`;

    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return { title: 'Game - NBA Stats Hub' };
  }
}

export default function GameLayout({ children }: Props) {
  return children;
}
