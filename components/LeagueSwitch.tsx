'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEAGUE_IDS, leagueFromPath, leagueInfo, seasonPath, switchLeagueHref } from '@/lib/leagues';

// Top-of-page NBA | WNBA switch, rendered on every page from the root layout.
export default function LeagueSwitch() {
  const pathname = usePathname() ?? '/';
  const active = leagueFromPath(pathname);
  return (
    <div className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-center gap-10">
        {LEAGUE_IDS.map((id) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={isActive ? seasonPath(id, leagueInfo(id).landingSeason) : switchLeagueHref(pathname, id)}
              data-league-switch={id}
              aria-current={isActive ? 'page' : undefined}
              className={
                'text-sm font-black tracking-[0.2em] px-3 py-1 border-b-2 transition-colors ' +
                (isActive ? 'border-orange-500 text-white' : 'border-transparent text-gray-400 hover:text-white')
              }
            >
              {leagueInfo(id).label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
