'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { seasonPath } from '@/lib/leagues';
import { teamInitials } from '@/lib/team-logos';
import type { WnbaPlayoffs, WnbaRound, WnbaSeries, WnbaPlayoffGame, WnbaPlayoffTeam } from '@/lib/wnba/playoffs';
import { useSeason } from '../SeasonProvider';

function TeamLogo({ team, size }: { team: WnbaPlayoffTeam; size: number }) {
  if (!team.logo) {
    return (
      <span
        className="flex-shrink-0 rounded-full bg-gray-200 text-gray-700 font-black flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size / 3 }}
      >
        {teamInitials({ abbrev: team.abbrev })}
      </span>
    );
  }
  return <Image src={team.logo} alt={team.abbrev} width={size} height={size} className="object-contain flex-shrink-0" unoptimized />;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function GameRow({ game, s }: { game: WnbaPlayoffGame; s: WnbaSeries }) {
  const season = useSeason();
  const byId = (id: string) => (id === s.teamA.id ? s.teamA : s.teamB);
  const away = byId(game.awayId);
  const home = byId(game.homeId);
  const isFinal = game.status === 'final';
  const isLive = game.status === 'live';
  return (
    <Link
      href={seasonPath('wnba', season, `/games/${game.id}`)}
      className="block rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors px-3 py-2"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
        <span>{game.gameNumber ? `Game ${game.gameNumber}` : 'Game'}</span>
        <span>
          {isLive ? <span className="text-red-600">LIVE · {game.statusDetail}</span> : isFinal ? 'FINAL' : formatWhen(game.dateUTC)}
        </span>
      </div>
      {[{ team: away, score: game.awayScore, prefix: '' }, { team: home, score: game.homeScore, prefix: '@ ' }].map(({ team, score, prefix }) => (
        <div
          key={team.id}
          className={`flex items-center justify-between text-sm ${isFinal && game.winnerId === team.id ? 'font-bold text-orange-700' : ''}`}
        >
          <span>{prefix}{team.abbrev}</span>
          <span className="tabular-nums">{isFinal || isLive ? score ?? '—' : '—'}</span>
        </div>
      ))}
    </Link>
  );
}

function seriesSummary(s: WnbaSeries): string {
  const lead = s.winsA === s.winsB ? null : s.winsA > s.winsB ? s.teamA : s.teamB;
  const hi = Math.max(s.winsA, s.winsB);
  const lo = Math.min(s.winsA, s.winsB);
  if (s.bestOf === 1) {
    if (!s.completed) return 'Single game';
    return `${lead?.abbrev} wins`;
  }
  if (s.completed) return `${lead?.abbrev} wins ${hi}-${lo}`;
  if (s.winsA + s.winsB === 0) return 'Series not started';
  return lead ? `${lead.abbrev} leads ${hi}-${lo}` : `Tied ${hi}-${lo}`;
}

function SeriesCard({ s }: { s: WnbaSeries }) {
  const [open, setOpen] = useState(false);
  const row = (team: WnbaPlayoffTeam, wins: number) => {
    const won = s.completed && s.winnerId === team.id;
    const leading = !s.completed && wins > (team.id === s.teamA.id ? s.winsB : s.winsA);
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${won ? 'bg-orange-100 border-l-4 border-orange-600' : leading ? 'bg-orange-50' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {team.seed && <span className="text-xs font-bold text-gray-500 w-5 flex-shrink-0">#{team.seed}</span>}
          <TeamLogo team={team} size={28} />
          <span className={`text-sm font-bold truncate ${won ? 'text-orange-700' : 'text-gray-900'}`} title={team.name}>{team.abbrev}</span>
        </div>
        <span className={`text-xl font-black tabular-nums ${won ? 'text-orange-600' : 'text-gray-800'}`}>{wins}</span>
      </div>
    );
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="p-2 space-y-1">
          {row(s.teamA, s.winsA)}
          {row(s.teamB, s.winsB)}
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
          <span className="font-medium">{seriesSummary(s)}{s.bestOf > 1 ? ` · Best of ${s.bestOf}` : ''}</span>
          <span className="text-gray-400">{open ? '▾ Hide games' : '▸ Show games'}</span>
        </div>
      </button>
      {open && (
        <div className="p-2 bg-gray-50 border-t border-gray-100 space-y-2">
          {s.games.map((g) => <GameRow key={g.id} game={g} s={s} />)}
        </div>
      )}
    </div>
  );
}

function TbdCard() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-4 text-center text-sm text-gray-400 font-semibold">
      TBD
    </div>
  );
}

const minSeed = (s: WnbaSeries) => Math.min(s.teamA.seed ?? 99, s.teamB.seed ?? 99);

// 2022+ bracket order: 1v8 and 4v5 feed one semifinal, 2v7 and 3v6 the other.
const EIGHT_TEAM_POSITION: Record<number, number> = { 1: 0, 8: 0, 4: 1, 5: 1, 2: 2, 7: 2, 3: 3, 6: 3 };
const TOP_HALF = new Set([1, 8, 4, 5]);

function orderRound(round: WnbaRound, format: WnbaPlayoffs['format']): WnbaSeries[] {
  const list = [...round.series];
  if (format === 'eight-team' && round.id === 'R1') {
    return list.sort((a, b) => (EIGHT_TEAM_POSITION[minSeed(a)] ?? 9) - (EIGHT_TEAM_POSITION[minSeed(b)] ?? 9));
  }
  if (format === 'eight-team' && round.id === 'SF') {
    const inTop = (s: WnbaSeries) => (TOP_HALF.has(s.teamA.seed ?? 0) || TOP_HALF.has(s.teamB.seed ?? 0) ? 0 : 1);
    return list.sort((a, b) => inTop(a) - inTop(b));
  }
  return list.sort((a, b) => (a.conference ?? '').localeCompare(b.conference ?? '') || minSeed(a) - minSeed(b));
}

function RoundColumn({ round, format }: { round: WnbaRound; format: WnbaPlayoffs['format'] }) {
  const ordered = orderRound(round, format);
  const missing = Math.max(0, round.expected - ordered.length);
  const byConference = format === 'conference' && round.id !== 'F';
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">{round.name}</h3>
      <div className="flex flex-col justify-around gap-3 flex-1">
        {byConference
          ? (['East', 'West'] as const).map((conf) => {
              const items = ordered.filter((s) => s.conference === conf);
              const perConf = round.expected / 2;
              return (
                <div key={conf} className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">{conf}</span>
                  {items.map((s) => <SeriesCard key={s.key} s={s} />)}
                  {Array.from({ length: Math.max(0, perConf - items.length) }).map((_, i) => <TbdCard key={i} />)}
                </div>
              );
            })
          : (
            <>
              {ordered.map((s) => <SeriesCard key={s.key} s={s} />)}
              {Array.from({ length: missing }).map((_, i) => <TbdCard key={i} />)}
            </>
          )}
      </div>
    </div>
  );
}

const GRID_COLS: Record<number, string> = {
  3: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  4: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6',
};

export default function WnbaPlayoffBracket({ playoffs }: { playoffs: WnbaPlayoffs }) {
  const rounds = playoffs.rounds;
  return (
    <div className="space-y-3">
      {playoffs.format === 'single-elim' && (
        <p className="text-xs text-gray-500">
          Top eight teams league-wide. Rounds one and two are single games; seeds 1–2 had byes to the semifinals and seeds 3–4 to the second round.
        </p>
      )}
      {playoffs.format === 'conference' && (
        <p className="text-xs text-gray-500">Top four teams in each conference.</p>
      )}
      <div className={GRID_COLS[rounds.length] ?? GRID_COLS[3]}>
        {rounds.map((r) => <RoundColumn key={r.id} round={r} format={playoffs.format} />)}
      </div>
    </div>
  );
}
