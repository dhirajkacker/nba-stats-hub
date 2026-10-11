import { playersMetadata } from '@/views/sectionMetadata';

export const metadata = playersMetadata('wnba');

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
