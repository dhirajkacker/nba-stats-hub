import Image from 'next/image';
import Link from 'next/link';
import { teamPath } from '@/lib/leagues';
import { teamInitials } from '@/lib/team-logos';
import { leagueGamesBehind } from '@/lib/wnba/standings';
import type { Standing } from '@/lib/types';

function Logo({ team }: { team: Standing }) {
  if (!team.logo) {
    return (
      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[9px] font-black flex items-center justify-center flex-shrink-0">
        {teamInitials({ abbrev: team.teamTricode })}
      </span>
    );
  }
  return (
    <div className="relative w-6 h-6 flex-shrink-0">
      <Image src={team.logo} alt={`${team.teamName} logo`} width={24} height={24} className="object-contain" unoptimized />
    </div>
  );
}

function Table({
  title, rows, season, madePlayoffs, rankOf, gbOf, showConference,
}: {
  title: string;
  rows: Standing[];
  season: string;
  madePlayoffs: (t: Standing) => boolean;
  rankOf: (t: Standing) => number;
  gbOf: (t: Standing) => number;
  showConference: boolean;
}) {
  const th = 'px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider';
  const td = 'px-2 py-2 whitespace-nowrap text-center text-sm';
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-orange-700 px-4 py-4">
        <h2 className="text-white font-black text-lg tracking-tight">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className={`${th} text-left`}>#</th>
              <th className={`${th} text-left`}>Team</th>
              <th className={`${th} text-center`}>W</th>
              <th className={`${th} text-center`}>L</th>
              <th className={`${th} text-center`}>PCT</th>
              <th className={`${th} text-center`}>GB</th>
              {showConference && <th className={`${th} text-center hidden sm:table-cell`}>Conf</th>}
              <th className={`${th} text-center hidden md:table-cell`}>Home</th>
              <th className={`${th} text-center hidden md:table-cell`}>Away</th>
              <th className={`${th} text-center hidden lg:table-cell`}>L10</th>
              <th className={`${th} text-center hidden lg:table-cell`}>Strk</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((team) => {
              const inPlayoffs = madePlayoffs(team);
              const gb = gbOf(team);
              return (
                <tr key={team.teamId} className={`hover:bg-orange-50 transition-colors group ${inPlayoffs ? 'bg-green-50' : 'bg-white'}`}>
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-6 ${inPlayoffs ? 'bg-green-500' : 'bg-gray-300'} rounded-full`}></div>
                      <span>{rankOf(team)}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <Link
                      href={teamPath('wnba', season, { id: team.teamId })}
                      className="flex items-center gap-2 text-gray-900 group-hover:text-orange-700 transition-colors"
                      title={`${team.teamCity} ${team.teamName}`}
                    >
                      <Logo team={team} />
                      <span className="font-semibold text-sm">{team.teamTricode}</span>
                      <span className="text-xs text-gray-500 hidden sm:inline">{team.teamName}</span>
                      {inPlayoffs && team.playoffSeed && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 rounded px-1">#{team.playoffSeed}</span>
                      )}
                    </Link>
                  </td>
                  <td className={`${td} text-gray-900`}>{team.wins}</td>
                  <td className={`${td} text-gray-900`}>{team.losses}</td>
                  <td className={`${td} text-gray-900`}>{team.winPct.toFixed(3)}</td>
                  <td className={`${td} text-gray-500`}>{gb === 0 ? '-' : gb.toFixed(1)}</td>
                  {showConference && <td className={`${td} text-gray-500 hidden sm:table-cell`}>{team.conference}</td>}
                  <td className={`${td} text-gray-500 hidden md:table-cell`}>{team.homeWins}-{team.homeLosses}</td>
                  <td className={`${td} text-gray-500 hidden md:table-cell`}>{team.awayWins}-{team.awayLosses}</td>
                  <td className={`${td} text-gray-500 hidden lg:table-cell`}>{team.lastTenWins}-{team.lastTenLosses}</td>
                  <td className={`${td} text-gray-500 hidden lg:table-cell`}>{team.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * WNBA standings. From 2016 playoff seeding is league-wide, so there's one
 * table ranked across the league with the top eight seeds marked. Before
 * 2016 the top four in each conference made the playoffs, so there are two
 * conference tables. Playoff status follows ESPN's official seed, which
 * already applies the tiebreakers.
 */
export default function WnbaStandings({ standings, season, seeding }: {
  standings: Standing[];
  season: string;
  seeding: 'league' | 'conference';
}) {
  const legend = (
    <div className="flex flex-wrap gap-4 text-xs mt-3">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-gray-700 font-medium">
          {seeding === 'league' ? 'Playoffs (top 8 seeds)' : 'Playoffs (top 4 per conference)'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        <span className="text-gray-700 font-medium">Missed playoffs</span>
      </div>
    </div>
  );

  if (seeding === 'league') {
    const rows = [...standings].sort((a, b) => (a.leagueRank ?? 0) - (b.leagueRank ?? 0));
    const gb = leagueGamesBehind(standings);
    return (
      <div>
        <Table
          title="League Standings"
          rows={rows}
          season={season}
          madePlayoffs={(t) => !!t.playoffSeed && t.playoffSeed <= 8}
          rankOf={(t) => t.leagueRank ?? 0}
          gbOf={(t) => gb.get(t.teamId) ?? 0}
          showConference
        />
        {legend}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['East', 'West'] as const).map((conf) => (
          <Table
            key={conf}
            title={`${conf === 'East' ? 'Eastern' : 'Western'} Conference`}
            rows={standings.filter((t) => t.conference === conf).sort((a, b) => a.confRank - b.confRank)}
            season={season}
            madePlayoffs={(t) => !!t.playoffSeed && t.playoffSeed <= 4}
            rankOf={(t) => t.confRank}
            gbOf={(t) => t.gamesBehind}
            showConference={false}
          />
        ))}
      </div>
      {legend}
    </div>
  );
}
