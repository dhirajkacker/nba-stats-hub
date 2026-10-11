import { PlayerPageView, playerPageMetadata, type PlayerPageParams } from '@/views/PlayerPageView';

export const generateMetadata = ({ params }: { params: PlayerPageParams }) => playerPageMetadata('wnba', params);

export default function PlayerPage({ params }: { params: PlayerPageParams }) {
  return <PlayerPageView league="wnba" params={params} />;
}

export const dynamic = 'force-dynamic';
