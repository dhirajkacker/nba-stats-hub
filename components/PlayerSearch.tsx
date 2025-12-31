'use client';

import { useState } from 'react';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResult {
  id: string;
  displayName: string;
  jersey?: string;
  position?: {
    abbreviation: string;
  };
  team?: {
    abbreviation: string;
  };
  height?: string;
  weight?: string;
}

interface PlayerSearchProps {
  onSelectForComparison?: (player: SearchResult) => void;
  isPlayerSelected?: (playerId: string) => boolean;
}

export default function PlayerSearch({ onSelectForComparison, isPlayerSelected }: PlayerSearchProps = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search by player name..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-500 mt-4">Searching players...</p>
        </div>
      )}

      {!isLoading && query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-500">Type at least 2 characters to search...</p>
      )}

      {!isLoading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No players found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-2">Try searching with a different name</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-4">Found {results.length} player{results.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((player) => {
              const selected = isPlayerSelected ? isPlayerSelected(player.id) : false;

              return (
              <div
                key={player.id}
                className={`group bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 hover:shadow-lg transition-all relative ${
                  selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                }`}
              >
                <Link href={`/players/${player.id}`} className="block">
                <div className="flex items-center gap-4 mb-4">
                  {player.team?.abbreviation && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(player.team.abbreviation, 'small')}
                        alt={`${player.team.abbreviation} logo`}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                      {player.displayName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {player.jersey && `#${player.jersey} • `}
                      {player.position?.abbreviation || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  {player.team?.abbreviation && (
                    <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full">
                      {player.team.abbreviation}
                    </span>
                  )}
                  {player.height && player.weight && (
                    <div className="text-gray-600 text-xs">
                      {player.height} • {player.weight}
                    </div>
                  )}
                </div>
              </Link>

                {/* Add to Compare button */}
                {onSelectForComparison && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectForComparison(player);
                    }}
                    className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                      selected
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                    }`}
                  >
                    {selected ? '✓ Added to Compare' : '+ Add to Compare'}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
