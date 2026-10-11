import { redirect } from 'next/navigation';
import { leagueInfo, seasonPath } from '@/lib/leagues';

export default function WnbaRootPage() {
  redirect(seasonPath('wnba', leagueInfo('wnba').landingSeason));
}
