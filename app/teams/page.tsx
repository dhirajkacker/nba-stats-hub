'use client';

import { useState, useEffect } from 'react';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { Standing } from '@/lib/types';

interface TeamWithStats extends Standing {
  // Advanced stats - these would typically come from an API
  ppg?: number;
  oppPpg?: number;
  fgPct?: number;
  fg3Pct?: number;
  ftPct?: number;
  rpg?: number;
  apg?: number;
  spg?: number;
  bpg?: number;
  topg?: number;
  offRating?: number;
  defRating?: number;
  netRating?: number;
  pace?: number;
}

export default function TeamsPage() {
  const [allTeams, setAllTeams] = useState<TeamWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }
        const standings = await response.json();

        // Add mock advanced stats - in production, fetch from real API
        const teamsWithStats: TeamWithStats[] = (standings?.standings || []).map((team: Standing) => ({
          ...team,
          // These are placeholder values - replace with real API data
          ppg: 110 + Math.random() * 15,
          oppPpg: 105 + Math.random() * 15,
          fgPct: 45 + Math.random() * 10,
          fg3Pct: 35 + Math.random() * 8,
          ftPct: 75 + Math.random() * 10,
          rpg: 42 + Math.random() * 8,
          apg: 23 + Math.random() * 7,
          spg: 7 + Math.random() * 3,
          bpg: 4 + Math.random() * 2,
          topg: 12 + Math.random() * 3,
          offRating: 108 + Math.random() * 12,
          defRating: 108 + Math.random() * 12,
          netRating: -3 + Math.random() * 8,
          pace: 96 + Math.random() * 8,
        }));

        // Sort by record (wins descending, then losses ascending)
        teamsWithStats.sort((a, b) => {
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          return a.losses - b.losses;
        });

        setAllTeams(teamsWithStats);
      } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeams();
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
            📊 NBA Team Statistics
          </h1>
          <p className="text-orange-200 mt-2 font-medium">
            Complete statistics for all {allTeams.length} teams - Sorted by record
          </p>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Teams Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900">All Teams Comparison</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2">Click on any team to view detailed statistics</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-gray-500 mt-4">Loading teams...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">Rank</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 sticky left-[60px] bg-gray-100 z-10">Team</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Record</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Win%</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Conf</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Home</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Away</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">L10</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Streak</th>
                    <th className="text-center py-3 px-3 font-bold text-green-700 bg-green-50">PPG</th>
                    <th className="text-center py-3 px-3 font-bold text-red-700 bg-red-50">Opp PPG</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">FG%</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">3PT%</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">FT%</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">RPG</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">APG</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">SPG</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">BPG</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">TOV</th>
                    <th className="text-center py-3 px-3 font-bold text-purple-700 bg-purple-50">OffRtg</th>
                    <th className="text-center py-3 px-3 font-bold text-blue-700 bg-blue-50">DefRtg</th>
                    <th className="text-center py-3 px-3 font-bold text-orange-700 bg-orange-50">NetRtg</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeams.map((team, index) => (
                    <tr
                      key={team.teamId}
                      className="border-b border-gray-200 hover:bg-orange-50 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/teams/${team.teamTricode.toLowerCase()}`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-orange-50">
                        {index + 1}
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4 sticky left-[60px] bg-white group-hover:bg-orange-50 z-[1]">
                        <Link
                          href={`/teams/${team.teamTricode.toLowerCase()}`}
                          className="flex items-center gap-3 min-w-[200px]"
                        >
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <Image
                              src={getTeamLogoUrl(team.teamTricode, 'small')}
                              alt={`${team.teamName} logo`}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-orange-600">
                              {team.teamCity} {team.teamName}
                            </p>
                            <p className="text-xs text-gray-500">{team.teamTricode}</p>
                          </div>
                        </Link>
                      </td>

                      {/* Record */}
                      <td className="text-center py-3 px-3 font-bold text-gray-900">
                        {team.wins}-{team.losses}
                      </td>

                      {/* Win% */}
                      <td className="text-center py-3 px-3 text-gray-900">
                        {(team.winPct * 100).toFixed(1)}%
                      </td>

                      {/* Conference */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {team.conference} #{team.confRank}
                        </span>
                      </td>

                      {/* Home */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.homeWins}-{team.homeLosses}
                      </td>

                      {/* Away */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.awayWins}-{team.awayLosses}
                      </td>

                      {/* Last 10 */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.lastTenWins}-{team.lastTenLosses}
                      </td>

                      {/* Streak */}
                      <td className="text-center py-3 px-3 text-gray-700 font-medium">
                        {team.streak}
                      </td>

                      {/* PPG */}
                      <td className="text-center py-3 px-3 font-bold text-green-700 bg-green-50">
                        {team.ppg?.toFixed(1) || '-'}
                      </td>

                      {/* Opp PPG */}
                      <td className="text-center py-3 px-3 font-bold text-red-700 bg-red-50">
                        {team.oppPpg?.toFixed(1) || '-'}
                      </td>

                      {/* FG% */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.fgPct?.toFixed(1) || '-'}%
                      </td>

                      {/* 3PT% */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.fg3Pct?.toFixed(1) || '-'}%
                      </td>

                      {/* FT% */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.ftPct?.toFixed(1) || '-'}%
                      </td>

                      {/* RPG */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.rpg?.toFixed(1) || '-'}
                      </td>

                      {/* APG */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.apg?.toFixed(1) || '-'}
                      </td>

                      {/* SPG */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.spg?.toFixed(1) || '-'}
                      </td>

                      {/* BPG */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.bpg?.toFixed(1) || '-'}
                      </td>

                      {/* TOV */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.topg?.toFixed(1) || '-'}
                      </td>

                      {/* Off Rating */}
                      <td className="text-center py-3 px-3 font-bold text-purple-700 bg-purple-50">
                        {team.offRating?.toFixed(1) || '-'}
                      </td>

                      {/* Def Rating */}
                      <td className="text-center py-3 px-3 font-bold text-blue-700 bg-blue-50">
                        {team.defRating?.toFixed(1) || '-'}
                      </td>

                      {/* Net Rating */}
                      <td className="text-center py-3 px-3 font-bold text-orange-700 bg-orange-50">
                        {team.netRating?.toFixed(1) || '-'}
                      </td>

                      {/* Pace */}
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.pace?.toFixed(1) || '-'}
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

export const dynamic = 'force-dynamic';
