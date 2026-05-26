import { redirect } from 'next/navigation';
import { CURRENT_SEASON } from '@/lib/seasons';

export default function RootPage() {
  redirect(`/seasons/${CURRENT_SEASON}`);
}
