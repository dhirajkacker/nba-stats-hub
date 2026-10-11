'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { LeagueId } from '@/lib/leagues';

// No default value on purpose. A client component rendered outside a provider
// throws instead of silently assuming the NBA.
const LeagueCtx = createContext<LeagueId | null>(null);

export function useLeague(): LeagueId {
  const league = useContext(LeagueCtx);
  if (!league) {
    throw new Error('useLeague() called outside <LeagueProvider>');
  }
  return league;
}

export function LeagueProvider({ league, children }: { league: LeagueId; children: ReactNode }) {
  return <LeagueCtx.Provider value={league}>{children}</LeagueCtx.Provider>;
}
