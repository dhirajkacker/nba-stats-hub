import { TeamPageView, teamPageMetadata, type TeamPageParams } from '@/views/TeamPageView';

export const generateMetadata = ({ params }: { params: TeamPageParams }) => teamPageMetadata('wnba', params);

export default function TeamPage({ params }: { params: TeamPageParams }) {
  return <TeamPageView league="wnba" params={params} />;
}

export const dynamic = 'force-dynamic';
