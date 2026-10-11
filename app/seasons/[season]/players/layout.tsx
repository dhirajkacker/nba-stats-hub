import { playersMetadata } from '@/views/sectionMetadata';

export const metadata = playersMetadata('nba');

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
