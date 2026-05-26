import Link from 'next/link';
import { KNOWN_SEASONS, CURRENT_SEASON } from '@/lib/seasons';

export default function SeasonNav({ currentSeason }: { currentSeason: string }) {
  return (
    <nav className="bg-gray-900 text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/seasons/${CURRENT_SEASON}`} className="font-black text-sm tracking-tight">
          🏀 NBA Stats Hub
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {KNOWN_SEASONS.map((s) => {
            const active = s === currentSeason;
            const frozen = s !== CURRENT_SEASON;
            return (
              <Link
                key={s}
                href={`/seasons/${s}`}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (active
                    ? 'bg-orange-500 border-orange-500 text-white font-bold'
                    : 'bg-transparent border-gray-700 text-gray-300 hover:border-orange-400 hover:text-white')
                }
                aria-current={active ? 'page' : undefined}
              >
                {s}
                {frozen && (
                  <span className="ml-1.5 text-[10px] font-semibold opacity-75">FINAL</span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href={`/seasons/${currentSeason}/standings`} className="text-gray-300 hover:text-orange-300">
            Standings
          </Link>
          <Link href={`/seasons/${currentSeason}/players`} className="text-gray-300 hover:text-orange-300">
            Players
          </Link>
          <Link href={`/seasons/${currentSeason}/teams`} className="text-gray-300 hover:text-orange-300">
            Teams
          </Link>
          <Link href="/history" className="text-gray-300 hover:text-orange-300">
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
