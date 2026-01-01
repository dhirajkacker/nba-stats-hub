import { Standing } from '@/lib/types';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';

interface StandingsTableProps {
  standings: Standing[];
  conference: 'East' | 'West';
}

export default function StandingsTable({ standings, conference }: StandingsTableProps) {
  const conferenceStandings = standings
    .filter((team) => team.conference === conference)
    .sort((a, b) => a.confRank - b.confRank);

  // Helper function to get the status indicator for each team
  const getTeamStatus = (rank: number) => {
    if (rank <= 6) {
      return {
        type: 'playoff',
        color: 'bg-green-500',
        bgColor: 'bg-green-50',
        label: 'Playoff'
      };
    } else if (rank <= 10) {
      return {
        type: 'playin',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        label: 'Play-In'
      };
    } else {
      return {
        type: 'out',
        color: 'bg-gray-300',
        bgColor: 'bg-white',
        label: 'Out'
      };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-4 py-4">
        <h2 className="text-white font-black text-lg tracking-tight">
          {conference === 'East' ? 'Eastern' : 'Western'} Conference
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                W
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                L
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                PCT
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GB
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conferenceStandings.map((team) => {
              const status = getTeamStatus(team.confRank);
              return (
                <tr key={team.teamId} className={`hover:bg-orange-50 transition-colors group ${status.bgColor}`}>
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-6 ${status.color} rounded-full`}></div>
                      <span>{team.confRank}</span>
                    </div>
                  </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <Link
                    href={`/teams/${team.teamTricode.toLowerCase()}`}
                    className="flex items-center gap-2 group-hover:text-orange-600 transition-colors"
                  >
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(team.teamTricode, 'small')}
                        alt={`${team.teamName} logo`}
                        width={24}
                        height={24}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="font-semibold text-sm">
                      {team.teamTricode}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                  {team.wins}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                  {team.losses}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                  {team.winPct.toFixed(3)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                  {team.gamesBehind === 0 ? '-' : team.gamesBehind.toFixed(1)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Playoff Status</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Playoffs (1-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Play-In (7-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-gray-700 font-medium">Out of Contention (11-15)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
