'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { CURRENT_SEASON } from '@/lib/seasons';

const SeasonCtx = createContext<string>(CURRENT_SEASON);

export function useSeason(): string {
  return useContext(SeasonCtx);
}

export function SeasonProvider({
  season,
  children,
}: {
  season: string;
  children: ReactNode;
}) {
  return <SeasonCtx.Provider value={season}>{children}</SeasonCtx.Provider>;
}
