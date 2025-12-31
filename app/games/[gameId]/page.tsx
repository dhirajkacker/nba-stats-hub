'use client';

import { useState, useEffect } from 'react';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface TeamStats {
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
}

interface PlayerStat {
  athlete: {
    displayName: string;
    jersey: string;
    position: { abbreviation: string };
  };
  stats: string[]; // [MIN, FG, 3PT, FT, OREB, DREB, REB, AST, STL, BLK, TO, PF, +/-, PTS]
}

interface BoxScore {
  teams: {
    team: TeamStats;
    statistics: Array<{ name: string; displayValue: string }>;
  }[];
  players: {
    team: TeamStats;
    statistics: Array<{
      name: string;
      athletes: PlayerStat[];
    }>;
  }[];
}

interface GameData {
  header: {
    competitions: Array<{
      competitors: Array<{
        team: TeamStats & { score: string; record: string };
        homeAway: string;
        winner?: boolean;
      }>;
      status: {
        type: {
          completed: boolean;
          detail: string;
          state: string;
        };
        displayClock: string;
        period: number;
      };
      date: string;
    }>;
  };
  boxscore?: BoxScore;
}

export default function GamePage() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/game/${gameId}`);

        if (!response.ok) {
          throw new Error('Game not found');
        }

        const data = await response.json();
        setGameData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    }

    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-500 mt-4">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
        <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-black tracking-tight">Game Not Found</h1>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">{error || 'Game data unavailable'}</p>
            <Link href="/" className="mt-4 inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
              Go Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const competition = gameData.header.competitions[0];
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const status = competition.status;
  const isFinished = status.type.completed;
  const isLive = status.type.state === 'in';

  if (!awayTeam || !homeTeam) {
    return null;
  }

  // Get box score stats columns
  const statColumns = ['MIN', 'FG', '3PT', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'PTS'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Game Details
          </h1>
          <p className="text-orange-200 font-medium">
            {new Date(competition.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Banner */}
        {isLive && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg p-4 mb-8 flex items-center justify-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <span className="text-xl font-black">
              LIVE - Q{status.period} {status.displayClock}
            </span>
          </div>
        )}

        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 mb-8">
          {/* Away Team */}
          <div
            className={`flex items-center justify-between p-8 ${
              awayTeam.winner ? 'bg-gradient-to-r from-orange-50 to-orange-100' : ''
            }`}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="relative w-24 h-24">
                <Image
                  src={getTeamLogoUrl(awayTeam.team.abbreviation, 'medium')}
                  alt={`${awayTeam.team.displayName} logo`}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">
                  {awayTeam.team.displayName}
                </h2>
                <p className="text-lg text-gray-600">
                  {awayTeam.team.abbreviation} • {awayTeam.team.record}
                </p>
              </div>
            </div>
            <div
              className={`text-7xl font-black ${
                awayTeam.winner ? 'text-orange-600' : 'text-gray-800'
              }`}
            >
              {awayTeam.team.score}
            </div>
          </div>

          {/* Divider */}
          <div className="bg-gray-100 py-3 px-8 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-gray-500 font-bold">
              {status.type.detail}
            </span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>

          {/* Home Team */}
          <div
            className={`flex items-center justify-between p-8 ${
              homeTeam.winner ? 'bg-gradient-to-r from-orange-50 to-orange-100' : ''
            }`}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="relative w-24 h-24">
                <Image
                  src={getTeamLogoUrl(homeTeam.team.abbreviation, 'medium')}
                  alt={`${homeTeam.team.displayName} logo`}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">
                  {homeTeam.team.displayName}
                </h2>
                <p className="text-lg text-gray-600">
                  {homeTeam.team.abbreviation} • {homeTeam.team.record}
                </p>
              </div>
            </div>
            <div
              className={`text-7xl font-black ${
                homeTeam.winner ? 'text-orange-600' : 'text-gray-800'
              }`}
            >
              {homeTeam.team.score}
            </div>
          </div>
        </div>

        {/* Box Score */}
        {gameData.boxscore && gameData.boxscore.players && (
          <div className="space-y-8">
            {gameData.boxscore.players.map((teamBox, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <Image
                      src={getTeamLogoUrl(teamBox.team.abbreviation, 'small')}
                      alt={`${teamBox.team.displayName} logo`}
                      width={32}
                      height={32}
                      className="object-contain brightness-0 invert"
                    />
                    {teamBox.team.displayName} Box Score
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-gray-700 sticky left-0 bg-gray-50 min-w-[180px]">
                          Player
                        </th>
                        <th className="text-center py-3 px-2 font-bold text-gray-700">POS</th>
                        {statColumns.map(col => (
                          <th key={col} className="text-center py-3 px-2 font-bold text-gray-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamBox.statistics[0]?.athletes.map((player, playerIdx) => (
                        <tr key={playerIdx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 sticky left-0 bg-white">
                            <div className="flex items-center gap-2">
                              <span className="w-6 text-gray-500 font-semibold">#{player.athlete.jersey}</span>
                              <span className="font-semibold text-gray-900">{player.athlete.displayName}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-600 font-medium">
                            {player.athlete.position?.abbreviation}
                          </td>
                          {player.stats.map((stat, statIdx) => (
                            <td key={statIdx} className="text-center py-3 px-2 text-gray-900 font-medium">
                              {stat}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {!gameData.boxscore && isFinished && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <p className="text-gray-600 text-lg">Box score not yet available for this game</p>
          </div>
        )}
      </main>
    </div>
  );
}
