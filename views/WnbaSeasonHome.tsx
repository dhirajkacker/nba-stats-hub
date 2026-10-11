import Link from 'next/link';
import LiveScores from '@/components/LiveScores';
import ClientDate from '@/components/ClientDate';
import ChampionHero from '@/components/ChampionHero';
import PreseasonNotice, { seasonNotStarted } from '@/components/PreseasonNotice';
import WnbaPlayoffBracket from '@/components/wnba/WnbaPlayoffBracket';
import WnbaStandings from '@/components/wnba/WnbaStandings';
import { isLiveSeason, seasonPath } from '@/lib/leagues';
import { seasonLabel } from '@/lib/seasons';
import { theme } from '@/lib/theme';
import { getWnbaSeasonMeta, getWnbaSeasonPlayoffs, getWnbaSeasonStandings } from '@/lib/wnba/season-context';
import { wnbaSeasonFacts } from '@/lib/wnba/seasons';
import type { WnbaPlayoffs } from '@/lib/wnba/playoffs';

/** The next scheduled playoff game, for the live season's "next game" card. */
function nextPlayoffGame(playoffs: WnbaPlayoffs | null) {
  if (!playoffs) return null;
  const upcoming = playoffs.rounds
    .flatMap((r) => r.series.flatMap((s) => s.games.map((g) => ({ g, s, round: r.name }))))
    .filter(({ g }) => g.status !== 'final')
    .sort((a, b) => a.g.dateUTC.localeCompare(b.g.dateUTC));
  return upcoming[0] ?? null;
}

export async function WnbaSeasonHome({ season }: { season: string }) {
  const t = theme('wnba');
  const live = isLiveSeason('wnba', season);
  const [standings, playoffs, meta] = await Promise.all([
    getWnbaSeasonStandings(season),
    getWnbaSeasonPlayoffs(season),
    getWnbaSeasonMeta(season),
  ]);
  const facts = wnbaSeasonFacts(season);
  const hasPlayoffGames = !!playoffs?.rounds.some((r) => r.series.length > 0);
  const next = live ? nextPlayoffGame(playoffs) : null;

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      <header className={t.headerGradient}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">🏀 WNBA {seasonLabel(season)}</h1>
              <ClientDate />
            </div>
            <Link
              href={seasonPath('wnba', season, '/players')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-400 transition-colors"
            >
              <p className={`text-xs ${t.headerSubtle} uppercase tracking-wide`}>Browse</p>
              <p className="text-sm font-bold">Player Stats →</p>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {meta.champion && <ChampionHero meta={meta} league="wnba" />}

        {live && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={t.accentBar}></div>
              <h2 className="text-3xl font-black text-gray-900">WNBA Games</h2>
            </div>
            {next && (
              <Link
                href={seasonPath('wnba', season, `/games/${next.g.id}`)}
                className="block mb-6 rounded-xl border border-orange-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-orange-700">Next game · {next.round}{next.g.gameNumber ? ` · Game ${next.g.gameNumber}` : ''}</p>
                <p className="text-lg font-black text-gray-900 mt-1">
                  {(next.g.awayId === next.s.teamA.id ? next.s.teamA : next.s.teamB).name} @ {(next.g.homeId === next.s.teamA.id ? next.s.teamA : next.s.teamB).name}
                </p>
                <p className="text-sm text-gray-600">{next.g.statusDetail}</p>
              </Link>
            )}
            <LiveScores />
          </div>
        )}

        {hasPlayoffGames && playoffs && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={t.accentBar}></div>
              <h2 className="text-3xl font-black text-gray-900">Playoff Bracket</h2>
            </div>
            <WnbaPlayoffBracket playoffs={playoffs} />
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={t.accentBar}></div>
            <h2 className="text-3xl font-black text-gray-900">Regular Season Standings</h2>
          </div>
          {standings && standings.standings.length > 0 ? (
            <>
              {live && seasonNotStarted(standings.standings) && <PreseasonNotice season={season} />}
              <WnbaStandings standings={standings.standings} season={season} seeding={facts?.seeding ?? 'league'} />
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-center">Standings data unavailable</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
