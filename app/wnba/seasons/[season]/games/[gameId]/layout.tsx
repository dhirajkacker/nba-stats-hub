import { gameMetadata, type GameParams } from '@/views/gameMetadata';

export const generateMetadata = ({ params }: { params: GameParams }) => gameMetadata('wnba', params);

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
