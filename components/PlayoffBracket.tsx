'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayoffSeries, PlayoffRound, PlayoffGame } from '@/lib/playoffs-api';
import { getTeamLogoUrl } from '@/lib/team-logos';

interface Props {
  series: PlayoffSeries[];
}

const ROUND_ORDER: PlayoffRound[] = ['1st Round', 'Conference Semis', 'Conference Finals', 'NBA Finals'];

function formatGameDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatGameTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function GameRow({ game, teamAAbbrev }: { game: PlayoffGame; teamAAbbrev: string }) {
  const aIsAway = game.away.abbrev === teamAAbbrev;
  const teamA = aIsAway ? game.away : game.home;
  const teamB = aIsAway ? game.home : game.away;

  const isFinal = game.status === 'final';
  const isLive = game.status === 'live';
  const aWon = isFinal && teamA.score > teamB.score;
  const bWon = isFinal && teamB.score > teamA.score;

  return (
    <Link
      href={`/games/${game.id}`}
      className="block rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors px-3 py-2"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
        <span>Game {game.gameNumber ?? '?'}</span>
        <span>
          {isLive ? <span className="text-red-600">LIVE · {game.statusDetail}</span>
            : isFinal ? 'FINAL'
            : `${formatGameDate(game.dateUTC)} · ${formatGameTime(game.dateUTC)}`}
        </span>
      </div>
      <div className="space-y-0.5">
        <div className={`flex items-center justify-between text-sm ${aWon ? 'font-bold text-orange-700' : ''}`}>
          <span>{teamA.abbrev}</span>
          <span className="tabular-nums">{isFinal || isLive ? teamA.score : '—'}</span>
        </div>
        <div className={`flex items-center justify-between text-sm ${bWon ? 'font-bold text-orange-700' : ''}`}>
          <span>{teamB.abbrev}</span>
          <span className="tabular-nums">{isFinal || isLive ? teamB.score : '—'}</span>
        </div>
      </div>
    </Link>
  );
}

function SeriesCard({ s }: { s: PlayoffSeries }) {
  const [open, setOpen] = useState(false);
  const aLeads = s.winsA > s.winsB;
  const bLeads = s.winsB > s.winsA;
  const aWon = s.completed && s.winsA === 4;
  const bWon = s.completed && s.winsB === 4;

  const teamRow = (team: typeof s.teamA, wins: number, isWinner: boolean, isLeading: boolean) => (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${isWinner ? 'bg-orange-100 border-l-4 border-orange-500' : isLeading ? 'bg-orange-50' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        {team.seed && <span className="text-xs font-bold text-gray-500 w-5 flex-shrink-0">#{team.seed}</span>}
        <Image
          src={getTeamLogoUrl(team.abbrev, 'small')}
          alt={team.abbrev}
          width={28}
          height={28}
          className="object-contain flex-shrink-0"
          unoptimized
        />
        <span className={`text-sm font-bold truncate ${isWinner ? 'text-orange-700' : 'text-gray-900'}`}>{team.abbrev}</span>
      </div>
      <span className={`text-xl font-black tabular-nums ${isWinner ? 'text-orange-600' : 'text-gray-800'}`}>
        {wins}
      </span>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="p-2 space-y-1">
          {teamRow(s.teamA, s.winsA, aWon, aLeads && !s.completed)}
          {teamRow(s.teamB, s.winsB, bWon, bLeads && !s.completed)}
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
          <span className="font-medium">{s.summary || 'Series not started'}</span>
          <span className="text-gray-400">{open ? '▾ Hide games' : '▸ Show games'}</span>
        </div>
      </button>
      {open && (
        <div className="p-2 bg-gray-50 border-t border-gray-100 space-y-2">
          {s.games.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">No games scheduled yet</p>
          ) : (
            s.games.map((g) => <GameRow key={g.id} game={g} teamAAbbrev={s.teamA.abbrev} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayoffBracket({ series }: Props) {
  if (series.length === 0) return null;

  // Group by round for rendering
  const byRound = new Map<PlayoffRound, PlayoffSeries[]>();
  for (const s of series) {
    const list = byRound.get(s.round) ?? [];
    list.push(s);
    byRound.set(s.round, list);
  }

  return (
    <div className="space-y-6">
      {ROUND_ORDER.map((round) => {
        const list = byRound.get(round);
        if (!list || list.length === 0) return null;

        // Split by conference for East/West on the sides of Finals
        const east = list.filter((s) => s.conference === 'East');
        const west = list.filter((s) => s.conference === 'West');
        const finals = list.filter((s) => s.conference === 'Finals');

        return (
          <div key={round}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">{round}</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-l from-gray-200 to-transparent" />
            </div>
            {round === 'NBA Finals' ? (
              <div className="max-w-md mx-auto">
                {finals.map((s) => <SeriesCard key={s.key} s={s} />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">East</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {east.map((s) => <SeriesCard key={s.key} s={s} />)}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">West</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {west.map((s) => <SeriesCard key={s.key} s={s} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
