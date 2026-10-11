import { teamsMetadata } from '@/views/sectionMetadata';

export const metadata = teamsMetadata('wnba');

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
