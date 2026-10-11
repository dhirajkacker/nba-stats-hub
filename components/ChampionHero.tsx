import Image from 'next/image';
import { teamColor, teamInitials, teamLogoSrc } from '@/lib/team-logos';
import { leagueInfo, type LeagueId } from '@/lib/leagues';
import type { SeasonMeta } from '@/lib/season-context';

export default function ChampionHero({ meta, league }: { meta: SeasonMeta; league: LeagueId }) {
  if (!meta.champion) return null;

  const { champion, runnerUp, finalsScore, finalsMVP, season } = meta;
  const championRef = { abbrev: champion.tricode, id: champion.teamId, logo: champion.logo };
  const champColor = teamColor(league, championRef);
  const logo = teamLogoSrc(league, championRef, 'medium');

  return (
    <div
      className="rounded-2xl shadow-xl overflow-hidden mb-8 text-white"
      style={{
        background: `linear-gradient(135deg, ${champColor} 0%, #1a1a1a 100%)`,
      }}
    >
      <div className="px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="bg-white rounded-2xl p-3 shadow-2xl flex-shrink-0">
          {logo ? (
            <Image
              src={logo}
              alt={`${champion.name} logo`}
              width={120}
              height={120}
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="w-[120px] h-[120px] flex items-center justify-center text-3xl font-black text-gray-700">
              {teamInitials(championRef)}
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
            🏆 {season} {leagueInfo(league).label} Champion
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
            {champion.city} {champion.name}
          </h2>
          {runnerUp && finalsScore && (
            <p className="mt-3 text-lg text-white/85">
              defeated{' '}
              <span className="font-bold text-white">
                {runnerUp.city} {runnerUp.name}
              </span>{' '}
              <span className="font-bold">{finalsScore}</span>
            </p>
          )}
          {finalsMVP && (
            <p className="mt-2 text-sm text-white/80">
              <span className="uppercase tracking-wider font-bold text-white/60">
                Finals MVP
              </span>{' '}
              · {finalsMVP}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
