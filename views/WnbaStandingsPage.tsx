import Link from 'next/link';
import WnbaStandings from '@/components/wnba/WnbaStandings';
import { isLiveSeason, seasonPath } from '@/lib/leagues';
import { seasonLabel } from '@/lib/seasons';
import { theme } from '@/lib/theme';
import { getWnbaSeasonStandings } from '@/lib/wnba/season-context';
import { wnbaSeasonFacts } from '@/lib/wnba/seasons';

export async function WnbaStandingsPage({ season }: { season: string }) {
  const t = theme('wnba');
  const standings = await getWnbaSeasonStandings(season);
  const facts = wnbaSeasonFacts(season);
  const heading = `${seasonLabel(season)} - ${isLiveSeason('wnba', season) ? 'Current Standings' : 'Final Standings'}`;
  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      <header className={t.headerGradient}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={seasonPath('wnba', season)} className={`${t.headerSubtle} hover:text-white mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-black tracking-tight mb-2">🏆 WNBA Standings</h1>
          <p className={`${t.headerSubtle} font-medium`}>{heading}</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {standings && standings.standings.length > 0 ? (
          <WnbaStandings standings={standings.standings} season={season} seeding={facts?.seeding ?? 'league'} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-center">Standings data unavailable</p>
          </div>
        )}
      </main>
    </div>
  );
}
