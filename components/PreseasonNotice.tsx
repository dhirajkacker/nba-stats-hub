import type { Standing } from '@/lib/types';

// True when no team has played a regular-season game yet, i.e. the window
// between the season rollover and opening night.
export function seasonNotStarted(standings: Standing[] | undefined | null): boolean {
  return !!standings && standings.length > 0 && standings.every((t) => t.wins + t.losses === 0);
}

export default function PreseasonNotice({ season }: { season: string }) {
  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
      The {season} regular season hasn&apos;t started yet. Every team is 0-0 until opening night.
    </div>
  );
}
