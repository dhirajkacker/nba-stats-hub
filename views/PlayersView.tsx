'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PlayerSearch from '@/components/PlayerSearch';
import { PlayerInfo } from '@/lib/player-data';
import { teamLogoSrc } from '@/lib/team-logos';
import Image from 'next/image';
import { apiUrl, isLiveSeason, leagueInfo, seasonPath, teamPath } from '@/lib/leagues';
import { theme } from '@/lib/theme';
import { useLeague } from '@/components/LeagueProvider';

type SortColumn = 'ppg' | 'rpg' | 'apg' | 'fgPct';

const sortLabels: Record<SortColumn, string> = {
  ppg: 'points per game',
  rpg: 'rebounds per game',
  apg: 'assists per game',
  fgPct: 'field goal percentage',
};

// Leaders table rows can carry the ESPN team id and logo (WNBA needs both).
type LeaderRow = PlayerInfo & { teamId?: string; teamLogo?: string | null };

export default function PlayersView() {
  const league = useLeague();
  const params = useParams<{ season: string }>();
  const season = params.season;
  const [topPlayers, setTopPlayers] = useState<LeaderRow[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [sortBy, setSortBy] = useState<SortColumn>('ppg');

  useEffect(() => {
    async function loadTopPlayers() {
      try {
        console.log('Fetching top 30 scorers from ESPN API...');

        const response = await fetch(apiUrl(league, '/api/player-stats-leaders', { limit: 30, season }));
        if (!response.ok) {
          throw new Error('Failed to fetch player stats leaders');
        }

        const leaders = await response.json();

        const playersWithStats: LeaderRow[] = leaders.map((player: any) => ({
          id: parseInt(player.id),
          name: player.displayName,
          teamTricode: player.team?.abbreviation || leagueInfo(league).label,
          teamId: player.team?.id,
          teamLogo: player.team?.logo,
          position: player.position?.abbreviation || 'N/A',
          jerseyNumber: player.jersey || '0',
          height: player.height || 'N/A',
          weight: player.weight || '0',
          ppg: player.stats?.ppg || 0,
          rpg: player.stats?.rpg || 0,
          apg: player.stats?.apg || 0,
          fgPct: player.stats?.fgPct || 0,
        }));

        console.log(`Loaded ${playersWithStats.length} top players`);
        setTopPlayers(playersWithStats);
      } catch (error) {
        console.error('Error loading top players:', error);
        setTopPlayers([]);
      } finally {
        setIsLoadingPlayers(false);
      }
    }

    loadTopPlayers();
  }, [season, league]);

  const sortedPlayers = [...topPlayers].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return bVal - aVal;
  });

  return (
    <div className={`min-h-screen ${theme(league).pageBg}`}>
      <header className={theme(league).headerGradient}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={seasonPath(league, season)} className={`${theme(league).headerSubtle} hover:text-white mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight">
            {leagueInfo(league).label} Player Leaders
          </h1>
          <p className={`${theme(league).headerSubtle} mt-2 font-medium`}>
            {season} season leaders by {sortLabels[sortBy]}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={theme(league).accentBar}></div>
            <h2 className="text-2xl font-black text-gray-900">Search Players</h2>
          </div>
          <PlayerSearch />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={theme(league).accentBar}></div>
              <h2 className="text-2xl font-black text-gray-900">{season} Season Leaders</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              {isLiveSeason(league, season)
                ? 'Real-time stats from ESPN • Updated daily'
                : 'Final regular-season stats from ESPN'}
            </p>
          </div>

          {isLoadingPlayers ? (
            <div className="text-center py-16">
              <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${theme(league).spinner}`}></div>
              <p className="text-gray-500 mt-4">Loading top scorers...</p>
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">
                {isLiveSeason(league, season)
                  ? `Leaders will appear once the ${season} regular season tips off.`
                  : 'No player data available'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">
                      Rank
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">
                      Player
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">
                      Team
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wide">
                      Pos
                    </th>
                    <th
                      onClick={() => setSortBy('ppg')}
                      className={`text-center py-4 px-4 font-bold text-sm uppercase tracking-wide cursor-pointer hover:bg-blue-100 transition-colors ${
                        sortBy === 'ppg' ? 'bg-blue-200 text-blue-900' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      PPG {sortBy === 'ppg' && '▼'}
                    </th>
                    <th
                      onClick={() => setSortBy('rpg')}
                      className={`text-center py-4 px-4 font-bold text-sm uppercase tracking-wide cursor-pointer hover:bg-green-100 transition-colors ${
                        sortBy === 'rpg' ? 'bg-green-200 text-green-900' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      RPG {sortBy === 'rpg' && '▼'}
                    </th>
                    <th
                      onClick={() => setSortBy('apg')}
                      className={`text-center py-4 px-4 font-bold text-sm uppercase tracking-wide cursor-pointer hover:bg-purple-100 transition-colors ${
                        sortBy === 'apg' ? 'bg-purple-200 text-purple-900' : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      APG {sortBy === 'apg' && '▼'}
                    </th>
                    <th
                      onClick={() => setSortBy('fgPct')}
                      className={`text-center py-4 px-4 font-bold text-sm uppercase tracking-wide cursor-pointer hover:bg-orange-100 transition-colors ${
                        sortBy === 'fgPct' ? 'bg-orange-200 text-orange-900' : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      FG% {sortBy === 'fgPct' && '▼'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPlayers.map((player, index) => (
                    <tr
                      key={player.id}
                      className="hover:bg-orange-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-800' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Link href={seasonPath(league, season, `/players/${player.id}`)} className="text-gray-900 hover:text-orange-600 transition-colors">
                          <div className="font-bold text-gray-900">{player.name}</div>
                          <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={teamPath(league, season, { abbrev: player.teamTricode, id: player.teamId })}
                          className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          {(() => {
                            const logo = teamLogoSrc(league, { abbrev: player.teamTricode, id: player.teamId, logo: player.teamLogo }, 'small');
                            return logo ? (
                              <div className="relative w-8 h-8">
                                <Image
                                  src={logo}
                                  alt={`${player.teamTricode} logo`}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            ) : null;
                          })()}
                          <span className="font-semibold text-gray-700 text-sm hover:text-orange-600">{player.teamTricode}</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {player.position}
                        </span>
                      </td>

                      <td className={`py-4 px-4 text-center ${sortBy === 'ppg' ? 'bg-blue-100' : 'bg-blue-50'}`}>
                        <span className={`font-black text-blue-900 ${sortBy === 'ppg' ? 'text-lg' : ''}`}>
                          {player.ppg !== undefined ? player.ppg.toFixed(1) : '-'}
                        </span>
                      </td>

                      <td className={`py-4 px-4 text-center ${sortBy === 'rpg' ? 'bg-green-100' : 'bg-green-50'}`}>
                        <span className={`font-black text-green-900 ${sortBy === 'rpg' ? 'text-lg' : ''}`}>
                          {player.rpg !== undefined ? player.rpg.toFixed(1) : '-'}
                        </span>
                      </td>

                      <td className={`py-4 px-4 text-center ${sortBy === 'apg' ? 'bg-purple-100' : 'bg-purple-50'}`}>
                        <span className={`font-black text-purple-900 ${sortBy === 'apg' ? 'text-lg' : ''}`}>
                          {player.apg !== undefined ? player.apg.toFixed(1) : '-'}
                        </span>
                      </td>

                      <td className={`py-4 px-4 text-center ${sortBy === 'fgPct' ? 'bg-orange-100' : 'bg-orange-50'}`}>
                        <span className={`font-black text-orange-900 ${sortBy === 'fgPct' ? 'text-lg' : ''}`}>
                          {player.fgPct !== undefined ? `${player.fgPct.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
