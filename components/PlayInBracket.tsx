import Image from 'next/image';
import Link from 'next/link';
import { PlayInData, PlayInGame, Conference } from '@/lib/playoffs-api';
import { getTeamLogoUrl } from '@/lib/team-logos';

interface Props {
  data: PlayInData;
  seeds?: Record<string, number>;
}

// Normalize tricode aliases across ESPN short forms and NBA.com long forms
const TRICODE_ALIASES: Record<string, string[]> = {
  NYK: ['NY'], NY: ['NYK'],
  GSW: ['GS'], GS: ['GSW'],
  SAS: ['SA'], SA: ['SAS'],
  NOP: ['NO'], NO: ['NOP'],
  WAS: ['WSH'], WSH: ['WAS'],
  UTA: ['UTAH'], UTAH: ['UTA'],
};

function lookupSeed(seeds: Record<string, number> | undefined, abbrev: string): number | undefined {
  if (!seeds) return undefined;
  if (seeds[abbrev] != null) return seeds[abbrev];
  for (const alias of TRICODE_ALIASES[abbrev] ?? []) {
    if (seeds[alias] != null) return seeds[alias];
  }
  return undefined;
}

const SLOT_LABEL: Record<string, string> = {
  '7v8': '7th Place Game',
  '9v10': '9th/10th Place Game',
  '8seed': '8th Seed Game',
};

const ANNOTATION: Record<string, { winner: string; loser: string }> = {
  '7v8': { winner: 'Winner → #7 seed', loser: 'Loser → 8th seed game' },
  '9v10': { winner: 'Winner → 8th seed game', loser: 'Loser eliminated' },
  '8seed': { winner: 'Winner → #8 seed', loser: 'Loser eliminated' },
};

function formatGameTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function GameBox({ game, slot, seeds }: { game: PlayInGame | undefined; slot: '7v8' | '9v10' | '8seed'; seeds?: Record<string, number> }) {
  const annotation = ANNOTATION[slot];

  if (!game) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {SLOT_LABEL[slot]}
        </p>
        <p className="text-sm text-gray-400 mt-2">TBD</p>
      </div>
    );
  }

  const isFinal = game.status === 'final';
  const isLive = game.status === 'live';
  const awayWon = isFinal && game.away.score > game.home.score;
  const homeWon = isFinal && game.home.score > game.away.score;
  const awaySeed = lookupSeed(seeds, game.away.abbrev);
  const homeSeed = lookupSeed(seeds, game.home.abbrev);

  const teamRow = (team: PlayInGame['away'], seed: number | undefined, won: boolean) => (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${won ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        {seed != null && <span className="text-xs font-bold text-gray-500 w-5">#{seed}</span>}
        <Image
          src={getTeamLogoUrl(team.abbrev, 'small')}
          alt={team.abbrev}
          width={28}
          height={28}
          className="object-contain flex-shrink-0"
          unoptimized
        />
        <span className={`text-sm font-bold truncate ${won ? 'text-orange-700' : 'text-gray-900'}`}>{team.abbrev}</span>
      </div>
      <span className={`text-lg font-black tabular-nums ${won ? 'text-orange-600' : 'text-gray-800'}`}>
        {isFinal || isLive ? team.score : ''}
      </span>
    </div>
  );

  const statusLabel = isLive
    ? <span className="text-red-600 font-bold">LIVE · {game.statusDetail}</span>
    : isFinal
      ? <span className="text-gray-500 font-semibold">FINAL</span>
      : <span className="text-gray-500">{formatGameTime(game.dateUTC)}</span>;

  return (
    <Link
      href={`/games/${game.id}`}
      className="block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
          {SLOT_LABEL[slot]}
        </p>
        <p className="text-[10px]">{statusLabel}</p>
      </div>
      <div className="p-2 space-y-1">
        {teamRow(game.away, awaySeed, awayWon)}
        {teamRow(game.home, homeSeed, homeWon)}
      </div>
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex justify-between text-[10px] text-gray-500 font-medium">
        <span>{annotation.winner}</span>
        <span>{annotation.loser}</span>
      </div>
    </Link>
  );
}

function ConferenceColumn({ label, games, seeds }: { label: Conference; games: PlayInData['east'] | PlayInData['west']; seeds?: Record<string, number> }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-black text-gray-900 tracking-tight">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${label === 'East' ? 'bg-blue-500' : 'bg-red-500'}`} />
        {label}
      </h3>
      <GameBox game={games['7v8']} slot="7v8" seeds={seeds} />
      <GameBox game={games['9v10']} slot="9v10" seeds={seeds} />
      <GameBox game={games['8seed']} slot="8seed" seeds={seeds} />
    </div>
  );
}

export default function PlayInBracket({ data, seeds }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ConferenceColumn label="East" games={data.east} seeds={seeds} />
      <ConferenceColumn label="West" games={data.west} seeds={seeds} />
    </div>
  );
}
