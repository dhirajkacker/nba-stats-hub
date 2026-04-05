import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA Players - Stats & Leaders | NBA Stats Hub',
  description: 'Browse NBA players, search by name, and view stat leaders in points, rebounds, assists, and more.',
  openGraph: {
    title: 'NBA Players - Stats & Leaders | NBA Stats Hub',
    description: 'Browse NBA players, search by name, and view stat leaders in points, rebounds, assists, and more.',
  },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
