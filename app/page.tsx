import { redirect } from 'next/navigation';
import { seasonPath } from '@/lib/leagues';
import { CURRENT_SEASON } from '@/lib/seasons';

export default function RootPage() {
  redirect(seasonPath('nba', CURRENT_SEASON));
}
