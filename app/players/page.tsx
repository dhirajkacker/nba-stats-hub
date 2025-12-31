'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerSearch from '@/components/PlayerSearch';
import { POPULAR_PLAYERS, PlayerInfo, getPlayerById } from '@/lib/player-data';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import { getPlayerDetails } from '@/lib/espn-players';
import { getPlayerStatsFromLeaders } from '@/lib/nba-leaders';

export default function PlayersPage() {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerInfo[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState<Set<number>>(new Set());
  const [popularPlayersWithStats, setPopularPlayersWithStats] = useState<PlayerInfo[]>([]);
  const [isLoadingPopularPlayers, setIsLoadingPopularPlayers] = useState(true);

  // Hybrid approach: Use static data for complete stats, but validate with ESPN for current teams
  useEffect(() => {
    async function loadPlayersWithValidation() {
      console.log('Loading players with ESPN team validation...');

      // ESPN only provides PPG, RPG, APG, FG% in statsSummary
      // We use static data for complete stats (MPG, 3PT%, FT%, etc.)
      // but we could validate team assignments against ESPN if needed

      setPopularPlayersWithStats(POPULAR_PLAYERS);
      setIsLoadingPopularPlayers(false);
    }

    loadPlayersWithValidation();
  }, []);

  const togglePlayerSelection = (player: PlayerInfo) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const isPlayerSelected = (playerId: number) => {
    return selectedPlayers.some(p => p.id === playerId);
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
    setShowComparison(false);
  };

  // Helper to format height from inches to feet-inches (e.g., 78 -> "6-6")
  const formatHeight = (height: string | number | undefined): string => {
    if (!height) return 'N/A';

    // Convert to string for processing
    const heightStr = String(height);

    // If already formatted (contains dash), return as-is
    if (heightStr.includes('-')) return heightStr;

    // Convert inches to feet-inches
    const inches = parseInt(heightStr);
    if (isNaN(inches)) return heightStr;

    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}-${remainingInches}`;
  };

  const handleAddSearchResult = async (searchResult: any) => {
    const playerId = parseInt(searchResult.id);

    // Toggle selection - if already selected, remove
    if (selectedPlayers.find(p => p.id === playerId)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
      return;
    }

    // First, check if this player exists in popularPlayersWithStats (has complete stats)
    const popularPlayer = popularPlayersWithStats.find(p => p.id === playerId);
    if (popularPlayer) {
      console.log(`Using complete stats for ${popularPlayer.name}`);
      setSelectedPlayers([...selectedPlayers, popularPlayer]);
      return;
    }

    // For other players, add them with available info from search result
    console.log(`Adding player from search: ${searchResult.displayName}`);

    // Add to loading state
    setLoadingPlayers(prev => new Set(prev).add(playerId));

    try {
      // Fetch player details to get whatever stats ESPN provides
      const details = await getPlayerDetails(searchResult.id);

      if (details) {
        const stats = details.statsSummary?.statistics || [];

        const getStatValue = (name: string): number | undefined => {
          const stat = stats.find((s: any) => s.name === name);
          const value = stat?.value || stat?.displayValue;
          if (value === undefined || value === null) return undefined;
          return typeof value === 'string' ? parseFloat(value) : value;
        };

        const playerInfo: PlayerInfo = {
          id: playerId,
          name: details.displayName || searchResult.displayName || 'Player #' + playerId,
          teamTricode: details.team?.abbreviation || searchResult.team?.abbreviation || 'NBA',
          position: details.position?.abbreviation || searchResult.position?.abbreviation || 'N/A',
          jerseyNumber: details.jersey || searchResult.jersey || '0',
          height: formatHeight(details.height || searchResult.height),
          weight: details.weight || searchResult.weight || '0',
          // Get whatever stats ESPN provides (limited but better than nothing)
          ppg: getStatValue('avgPoints'),
          rpg: getStatValue('avgRebounds'),
          apg: getStatValue('avgAssists'),
          fgPct: getStatValue('fieldGoalPct'),
          // ESPN doesn't provide these, leave as undefined
          fg3Pct: undefined,
          ftPct: undefined,
          fgm: undefined,
          fga: undefined,
          fg3m: undefined,
          fg3a: undefined,
          ftm: undefined,
          fta: undefined,
          mpg: undefined,
        };

        setSelectedPlayers(prev => [...prev, playerInfo]);
        console.log(`✓ Added ${playerInfo.name}: ${playerInfo.ppg ? playerInfo.ppg.toFixed(1) : 'N/A'} PPG`);
      } else {
        // If no details available, just add with basic search result info
        const playerInfo: PlayerInfo = {
          id: playerId,
          name: searchResult.displayName || 'Player #' + playerId,
          teamTricode: searchResult.team?.abbreviation || 'NBA',
          position: searchResult.position?.abbreviation || 'N/A',
          jerseyNumber: searchResult.jersey || '0',
          height: formatHeight(searchResult.height),
          weight: searchResult.weight || '0',
        };
        setSelectedPlayers(prev => [...prev, playerInfo]);
      }
    } catch (error) {
      console.error('Error fetching player details:', error);
      // Still add player with basic info on error
      const playerInfo: PlayerInfo = {
        id: playerId,
        name: searchResult.displayName || 'Player #' + playerId,
        teamTricode: searchResult.team?.abbreviation || 'NBA',
        position: searchResult.position?.abbreviation || 'N/A',
        jerseyNumber: searchResult.jersey || '0',
        height: formatHeight(searchResult.height),
        weight: searchResult.weight || '0',
      };
      setSelectedPlayers(prev => [...prev, playerInfo]);
    } finally {
      // Remove from loading state
      setLoadingPlayers(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const isSearchPlayerSelected = (playerId: string) => {
    return selectedPlayers.some(p => p.id === parseInt(playerId));
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
            ⭐ NBA Players
          </h1>
          <p className="text-orange-200 mt-2 font-medium">
            Search and view detailed player statistics
          </p>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${selectedPlayers.length > 0 ? 'pb-32' : ''}`}>
        {/* Comparison Bar - Fixed at bottom when players selected */}
        {selectedPlayers.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-red-600 shadow-2xl border-t-4 border-orange-400 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-lg">
                    {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''} Selected
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPlayers.slice(0, 3).map((player) => (
                      <span key={player.id} className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                        {player.name || 'Player #' + player.id}
                      </span>
                    ))}
                    {selectedPlayers.length > 3 && (
                      <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                        +{selectedPlayers.length - 3} more
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
        {showComparison && selectedPlayers.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                <h2 className="text-3xl font-black text-gray-900">Player Comparison</h2>
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
                    {selectedPlayers.map((player) => (
                      <th key={player.id} className="text-center py-3 px-4 min-w-[140px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative w-12 h-12">
                            <Image
                              src={getTeamLogoUrl(player.teamTricode, 'small')}
                              alt={`${player.teamTricode} logo`}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{player.name}</p>
                            <p className="text-xs text-gray-600">{player.teamTricode}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Main Stats */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-blue-900 sticky left-0 bg-blue-50">PPG</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-blue-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.ppg !== undefined ? player.ppg.toFixed(1) : '-'
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-green-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-green-900 sticky left-0 bg-green-50">RPG</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-green-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.rpg !== undefined ? player.rpg.toFixed(1) : '-'
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-purple-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-purple-900 sticky left-0 bg-purple-50">APG</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-purple-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.apg !== undefined ? player.apg.toFixed(1) : '-'
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Shooting Stats */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">FG Made/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.fgm?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">FG Attempted/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.fga?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-orange-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-orange-900 sticky left-0 bg-orange-50">FG%</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-orange-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.fgPct !== undefined ? `${player.fgPct.toFixed(1)}%` : '-'
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">3PT Made/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.fg3m?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">3PT Attempted/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.fg3a?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-yellow-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-yellow-900 sticky left-0 bg-yellow-50">3PT%</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-yellow-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.fg3Pct !== undefined ? `${player.fg3Pct.toFixed(1)}%` : '-'
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">FT Made/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.ftm?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">FT Attempted/Game</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.fta?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-indigo-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-indigo-900 sticky left-0 bg-indigo-50">FT%</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-indigo-900">
                        {loadingPlayers.has(player.id) ? (
                          <span className="text-gray-400 text-xs">Loading...</span>
                        ) : (
                          player.ftPct !== undefined ? `${player.ftPct.toFixed(1)}%` : '-'
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Other Stats */}
                  <tr className="bg-teal-50 border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-teal-900 sticky left-0 bg-teal-50">MPG</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 font-bold text-teal-900">
                        {player.mpg?.toFixed(1) || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Player Info */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Position</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.position}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Height</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.height}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white">Weight</td>
                    {selectedPlayers.map((player) => (
                      <td key={player.id} className="text-center py-2 px-4 text-gray-900">
                        {player.weight} lbs
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900">Search Players</h2>
            </div>
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold border border-green-200">
              🔍 Search any NBA player to compare
            </div>
          </div>
          <PlayerSearch
            onSelectForComparison={handleAddSearchResult}
            isPlayerSelected={isSearchPlayerSelected}
          />
        </div>

        {/* Popular Players */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900">Top Players</h2>
            </div>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200">
              ✓ Click checkboxes to compare players
            </div>
          </div>

          {isLoadingPopularPlayers ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="text-gray-500 mt-4">Loading current season stats...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {popularPlayersWithStats.map((player) => (
              <div
                key={player.id}
                className={`group bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 hover:shadow-xl transition-all relative ${
                  isPlayerSelected(player.id) ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={isPlayerSelected(player.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      togglePlayerSelection(player);
                    }}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  />
                </div>

                <Link href={`/players/${player.id}`} className="block"
              >
                {/* Header with team logo and info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={getTeamLogoUrl(player.teamTricode, 'small')}
                      alt={`${player.teamTricode} logo`}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {player.teamTricode} • #{player.jerseyNumber} • {player.position}
                    </p>
                  </div>
                </div>

                {/* Main Stats - PPG, RPG, APG */}
                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
                  {player.ppg !== undefined && (
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-blue-600 font-semibold uppercase">PPG</p>
                      <p className="text-xl font-black text-blue-900">{player.ppg.toFixed(1)}</p>
                    </div>
                  )}
                  {player.rpg !== undefined && (
                    <div className="text-center bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-green-600 font-semibold uppercase">RPG</p>
                      <p className="text-xl font-black text-green-900">{player.rpg.toFixed(1)}</p>
                    </div>
                  )}
                  {player.apg !== undefined && (
                    <div className="text-center bg-purple-50 rounded-lg p-2">
                      <p className="text-xs text-purple-600 font-semibold uppercase">APG</p>
                      <p className="text-xl font-black text-purple-900">{player.apg.toFixed(1)}</p>
                    </div>
                  )}
                </div>

                {/* Shooting Stats */}
                {(player.fgPct !== undefined || player.fg3Pct !== undefined || player.ftPct !== undefined) && (
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shooting</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {player.fgPct !== undefined && (
                      <div className="text-center bg-orange-50 rounded-lg p-2">
                        <p className="text-gray-500">FG%</p>
                        <p className="text-orange-600 font-bold text-base">{player.fgPct.toFixed(1)}%</p>
                      </div>
                    )}
                    {player.fg3Pct !== undefined && (
                      <div className="text-center bg-yellow-50 rounded-lg p-2">
                        <p className="text-gray-500">3PT%</p>
                        <p className="text-yellow-600 font-bold text-base">{player.fg3Pct.toFixed(1)}%</p>
                      </div>
                    )}
                    {player.ftPct !== undefined && (
                      <div className="text-center bg-blue-50 rounded-lg p-2">
                        <p className="text-gray-500">FT%</p>
                        <p className="text-blue-600 font-bold text-base">{player.ftPct.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Minutes Per Game */}
                {player.mpg !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Minutes Per Game</p>
                    <p className="text-lg font-black text-gray-900">{player.mpg.toFixed(1)} MPG</p>
                  </div>
                )}
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
