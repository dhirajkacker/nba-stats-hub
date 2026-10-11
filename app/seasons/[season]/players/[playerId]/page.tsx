import { PlayerPageView, playerPageMetadata, type PlayerPageParams } from '@/views/PlayerPageView';

export const generateMetadata = ({ params }: { params: PlayerPageParams }) => playerPageMetadata('nba', params);

export default function PlayerPage({ params }: { params: PlayerPageParams }) {
  return <PlayerPageView league="nba" params={params} />;
}

export const dynamic = 'force-dynamic';
