'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSearch from '@/components/PlayerSearch';
import { PlayerInfo } from '@/lib/player-data';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';

export default function PlayersPage() {
  const [topPlayers, setTopPlayers] = useState<PlayerInfo[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Fetch real-time player data from ESPN API
  // ESPN only provides: PPG, RPG, APG, FG% (no MPG, 3PT%, FT%)
  useEffect(() => {
    async function loadTopPlayers() {
      try {
        console.log('Fetching top 30 scorers from ESPN API...');

        const response = await fetch('/api/player-stats-leaders?limit=30');
        if (!response.ok) {
          throw new Error('Failed to fetch player stats leaders');
        }

        const leaders = await response.json();

        // Convert ESPN stats leaders to PlayerInfo format
        const playersWithStats: PlayerInfo[] = leaders.map((player: any) => ({
          id: parseInt(player.id),
          name: player.displayName,
          teamTricode: player.team?.abbreviation || 'NBA',
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight">
            🏀 Top NBA Scorers
          </h1>
          <p className="text-orange-200 mt-2 font-medium">
            Current season leaders by points per game
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">Search Players</h2>
          </div>
          <PlayerSearch />
        </div>

        {/* Top Players Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900">2025-26 Season Leaders</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Real-time stats from ESPN • Updated daily
            </p>
          </div>

          {isLoadingPlayers ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-gray-500 mt-4">Loading top scorers...</p>
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No player data available</p>
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
                    <th className="text-center py-4 px-4 font-bold text-blue-700 text-sm uppercase tracking-wide bg-blue-50">
                      PPG
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-green-700 text-sm uppercase tracking-wide bg-green-50">
                      RPG
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-purple-700 text-sm uppercase tracking-wide bg-purple-50">
                      APG
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-orange-700 text-sm uppercase tracking-wide bg-orange-50">
                      FG%
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topPlayers.map((player, index) => (
                    <tr
                      key={player.id}
                      className="hover:bg-orange-50 transition-colors"
                    >
                      {/* Rank */}
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

                      {/* Player Name */}
                      <td className="py-4 px-4">
                        <Link href={`/players/${player.id}`} className="hover:text-orange-600 transition-colors">
                          <div className="font-bold text-gray-900">{player.name}</div>
                          <div className="text-xs text-gray-500">#{player.jerseyNumber}</div>
                        </Link>
                      </td>

                      {/* Team Logo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative w-8 h-8">
                            <Image
                              src={getTeamLogoUrl(player.teamTricode, 'small')}
                              alt={`${player.teamTricode} logo`}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </div>
                          <span className="font-semibold text-gray-700 text-sm">{player.teamTricode}</span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {player.position}
                        </span>
                      </td>

                      {/* PPG */}
                      <td className="py-4 px-4 text-center bg-blue-50">
                        <span className="font-black text-blue-900 text-lg">
                          {player.ppg !== undefined ? player.ppg.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* RPG */}
                      <td className="py-4 px-4 text-center bg-green-50">
                        <span className="font-bold text-green-900">
                          {player.rpg !== undefined ? player.rpg.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* APG */}
                      <td className="py-4 px-4 text-center bg-purple-50">
                        <span className="font-bold text-purple-900">
                          {player.apg !== undefined ? player.apg.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* FG% */}
                      <td className="py-4 px-4 text-center bg-orange-50">
                        <span className="font-bold text-orange-900">
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
