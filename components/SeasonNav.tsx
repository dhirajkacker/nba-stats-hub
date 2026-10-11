import Link from 'next/link';
import { leagueHref, leagueInfo, seasonPath, type LeagueId } from '@/lib/leagues';

export default function SeasonNav({ league, currentSeason }: { league: LeagueId; currentSeason: string }) {
  const info = leagueInfo(league);
  return (
    <nav className="bg-gray-900 text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={seasonPath(league, info.landingSeason)} className="font-black text-sm tracking-tight">
          🏀 {info.siteName}
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {info.knownSeasons.map((s) => {
            const active = s === currentSeason;
            const frozen = s !== info.liveSeason;
            return (
              <Link
                key={s}
                href={seasonPath(league, s)}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (active
                    ? 'bg-orange-500 border-orange-500 text-white font-bold'
                    : 'bg-transparent border-gray-700 text-gray-300 hover:border-orange-400 hover:text-white')
                }
                aria-current={active ? 'page' : undefined}
              >
                {s}
                {frozen && (
                  <span className="ml-1.5 text-[10px] font-semibold opacity-75">FINAL</span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href={seasonPath(league, currentSeason, '/standings')} className="text-gray-300 hover:text-orange-300">
            Standings
          </Link>
          <Link href={seasonPath(league, currentSeason, '/players')} className="text-gray-300 hover:text-orange-300">
            Players
          </Link>
          <Link href={seasonPath(league, currentSeason, '/teams')} className="text-gray-300 hover:text-orange-300">
            Teams
          </Link>
          <Link href={leagueHref(league, '/history')} className="text-gray-300 hover:text-orange-300">
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
