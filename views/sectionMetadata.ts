// Metadata for section layouts. NBA strings are the site's originals.

import type { Metadata } from 'next';
import type { LeagueId } from '@/lib/leagues';

function meta(title: string, description: string): Metadata {
  return { title, description, openGraph: { title, description } };
}

export function playersMetadata(league: LeagueId): Metadata {
  return league === 'nba'
    ? meta(
        'NBA Players - Stats & Leaders | NBA Stats Hub',
        'Browse NBA players, search by name, and view stat leaders in points, rebounds, assists, and more.',
      )
    : meta(
        'WNBA Players - Stats & Leaders | WNBA Stats Hub',
        'Browse WNBA players, search by name, and view stat leaders in points, rebounds, assists, and more.',
      );
}

export function teamsMetadata(league: LeagueId): Metadata {
  return league === 'nba'
    ? meta(
        'NBA Teams - Rosters & Stats | NBA Stats Hub',
        'All 30 NBA teams — standings, rosters, stats, and recent game results at a glance.',
      )
    : meta(
        'WNBA Teams - Rosters & Stats | WNBA Stats Hub',
        'Every WNBA team — standings, rosters, stats, and recent game results at a glance.',
      );
}
