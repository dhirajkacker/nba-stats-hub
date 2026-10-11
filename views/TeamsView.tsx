'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { teamInitials, teamLogoSrc } from '@/lib/team-logos';
import { apiUrl, leagueInfo, seasonPath, teamPath } from '@/lib/leagues';
import { theme } from '@/lib/theme';
import { useLeague } from '@/components/LeagueProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Standing } from '@/lib/types';

export default function TeamsView() {
  const league = useLeague();
  const params = useParams<{ season: string }>();
  const season = params.season;
  const [allTeams, setAllTeams] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch(apiUrl(league, '/api/standings', { season }));
        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }
        const standings = await response.json();

        const teams: Standing[] = [...(standings?.standings || [])];

        teams.sort((a, b) => {
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          return a.losses - b.losses;
        });

        setAllTeams(teams);
      } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeams();
  }, [season, league]);

  return (
    <div className={`min-h-screen ${theme(league).pageBg}`}>
      <header className={theme(league).headerGradient}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={seasonPath(league, season)} className={`${theme(league).headerSubtle} hover:text-white mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight">
            🏀 {leagueInfo(league).label} Team Statistics
          </h1>
          <p className={`${theme(league).headerSubtle} mt-2 font-medium`}>
            Complete statistics for all {allTeams.length} teams - Sorted by record
          </p>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className={theme(league).accentBar}></div>
              <h2 className="text-2xl font-black text-gray-900">All Teams Comparison</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2">Click on any team to view detailed statistics</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${theme(league).spinner}`}></div>
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
                  </tr>
                </thead>
                <tbody>
                  {allTeams.map((team, index) => (
                    <tr
                      key={team.teamId}
                      className="border-b border-gray-200 hover:bg-orange-50 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = teamPath(league, season, { abbrev: team.teamTricode, id: team.teamId })}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-orange-50">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4 sticky left-[60px] bg-white group-hover:bg-orange-50 z-[1]">
                        <Link
                          href={teamPath(league, season, { abbrev: team.teamTricode, id: team.teamId })}
                          className="flex items-center gap-3 min-w-[200px] text-gray-900"
                        >
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {(() => {
                              const logo = teamLogoSrc(league, { abbrev: team.teamTricode, id: team.teamId, logo: team.logo }, 'small');
                              return logo ? (
                                <Image
                                  src={logo}
                                  alt={`${team.teamName} logo`}
                                  width={40}
                                  height={40}
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-700">
                                  {teamInitials({ abbrev: team.teamTricode })}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-orange-600">
                              {team.teamCity} {team.teamName}
                            </p>
                            <p className="text-xs text-gray-500">{team.teamTricode}</p>
                          </div>
                        </Link>
                      </td>

                      <td className="text-center py-3 px-3 font-bold text-gray-900">
                        {team.wins}-{team.losses}
                      </td>
                      <td className="text-center py-3 px-3 text-gray-900">
                        {(team.winPct * 100).toFixed(1)}%
                      </td>
                      <td className="text-center py-3 px-3 text-gray-700">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {team.conference} #{team.confRank}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.homeWins}-{team.homeLosses}
                      </td>
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.awayWins}-{team.awayLosses}
                      </td>
                      <td className="text-center py-3 px-3 text-gray-700">
                        {team.lastTenWins}-{team.lastTenLosses}
                      </td>
                      <td className="text-center py-3 px-3 text-gray-700 font-medium">
                        {team.streak}
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
