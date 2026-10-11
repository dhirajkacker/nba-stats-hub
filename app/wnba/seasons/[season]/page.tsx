import { WnbaSeasonHome } from '@/views/WnbaSeasonHome';

export default async function WnbaSeasonPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  return <WnbaSeasonHome season={season} />;
}

export const dynamic = 'force-dynamic';
