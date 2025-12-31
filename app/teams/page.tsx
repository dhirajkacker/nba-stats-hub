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
  const [selectedTeams, setSelectedTeams] = useState<TeamWithStats[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }
        const standings = await response.json();
        const teams = standings?.standings?.sort((a: Standing, b: Standing) =>
          a.teamCity.localeCompare(b.teamCity)
        ) || [];

        // Add mock advanced stats - in production, fetch from API
        const teamsWithStats: TeamWithStats[] = teams.map((team: Standing) => ({
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

        setAllTeams(teamsWithStats);
      } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeams();
  }, []);

  const toggleTeamSelection = (team: TeamWithStats) => {
    if (selectedTeams.find(t => t.teamId === team.teamId)) {
      setSelectedTeams(selectedTeams.filter(t => t.teamId !== team.teamId));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const isTeamSelected = (teamId: number) => {
    return selectedTeams.some(t => t.teamId === teamId);
  };

  const clearSelection = () => {
    setSelectedTeams([]);
    setShowComparison(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight">
            📊 NBA Teams
          </h1>
          <p className="text-orange-200 mt-2 font-medium">
            View and compare detailed statistics for all {allTeams.length} teams
          </p>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${selectedTeams.length > 0 ? 'pb-32' : ''}`}>
        {/* Comparison Bar - Fixed at bottom when teams selected */}
        {selectedTeams.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-red-600 shadow-2xl border-t-4 border-orange-400 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-lg">
                    {selectedTeams.length} Team{selectedTeams.length !== 1 ? 's' : ''} Selected
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTeams.slice(0, 3).map((team) => (
                      <span key={team.teamId} className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                        {team.teamTricode}
                      </span>
                    ))}
                    {selectedTeams.length > 3 && (
                      <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                        +{selectedTeams.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-all shadow-md"
                  >
                    {showComparison ? 'Hide' : 'Compare Stats'}
                  </button>
                  <button
                    onClick={clearSelection}
                    className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-all shadow-md"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {showComparison && selectedTeams.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <h2 className="text-3xl font-black text-gray-900">Team Comparison</h2>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-700 bg-gray-50 sticky left-0">Stat</th>
                    {selectedTeams.map((team) => (
                      <th key={team.teamId} className="text-center py-3 px-4 min-w-[140px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative w-12 h-12">
                            <Image
                              src={getTeamLogoUrl(team.teamTricode, 'small')}
                              alt={`${team.teamName} logo`}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{team.teamCity}</p>
                            <p className="text-xs text-gray-600">{team.teamTricode}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Record & Standing */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-blue-900 sticky left-0 bg-blue-50">Record</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-blue-900">
                        {team.wins}-{team.losses}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Win %</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {(team.winPct * 100).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Conf Rank</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        #{team.confRank} ({team.conference})
                      </td>
                    ))}
                  </tr>

                  {/* Offensive Stats */}
                  <tr className="bg-green-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-green-900 sticky left-0 bg-green-50">PPG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-green-900">
                        {team.ppg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Opp PPG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.oppPpg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-orange-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-orange-900 sticky left-0 bg-orange-50">FG%</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-orange-900">
                        {team.fgPct?.toFixed(1) || 'N/A'}%
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-yellow-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-yellow-900 sticky left-0 bg-yellow-50">3PT%</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-yellow-900">
                        {team.fg3Pct?.toFixed(1) || 'N/A'}%
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-indigo-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-indigo-900 sticky left-0 bg-indigo-50">FT%</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-indigo-900">
                        {team.ftPct?.toFixed(1) || 'N/A'}%
                      </td>
                    ))}
                  </tr>

                  {/* Other Stats */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">RPG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.rpg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">APG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.apg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">SPG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.spg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">BPG</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.bpg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">TOV/G</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.topg?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Advanced Stats */}
                  <tr className="bg-purple-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-purple-900 sticky left-0 bg-purple-50">Off Rating</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-purple-900">
                        {team.offRating?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-red-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-red-900 sticky left-0 bg-red-50">Def Rating</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-red-900">
                        {team.defRating?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-teal-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-teal-900 sticky left-0 bg-teal-50">Net Rating</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 font-bold text-teal-900">
                        {team.netRating?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Pace</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.pace?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Home/Away Records */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Home Record</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.homeWins}-{team.homeLosses}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Away Record</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.awayWins}-{team.awayLosses}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Last 10</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.lastTenWins}-{team.lastTenLosses}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Streak</td>
                    {selectedTeams.map((team) => (
                      <td key={team.teamId} className="text-center py-2 px-4 text-gray-900">
                        {team.streak}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900">All Teams</h2>
            </div>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200">
              ✓ Click checkboxes to compare teams
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-gray-500 mt-4">Loading teams...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allTeams.map((team) => (
                <div
                  key={team.teamId}
                  className={`group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 transition-all duration-300 border-2 hover:shadow-2xl hover:-translate-y-1 relative ${
                    isTeamSelected(team.teamId) ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-500'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={isTeamSelected(team.teamId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTeamSelection(team);
                      }}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                    />
                  </div>

                  <Link href={`/teams/${team.teamTricode.toLowerCase()}`} className="block">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 mb-4">
                        <Image
                          src={getTeamLogoUrl(team.teamTricode, 'medium')}
                          alt={`${team.teamName} logo`}
                          width={96}
                          height={96}
                          className="object-contain"
                        />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {team.teamCity}
                      </h3>
                      <p className="text-lg font-semibold text-gray-700 mb-3">
                        {team.teamName}
                      </p>
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <div className="bg-gray-100 px-3 py-1 rounded-full">
                          <span className="font-bold text-gray-900">{team.wins}-{team.losses}</span>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">{team.conference}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        #{team.confRank} in Conference
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
