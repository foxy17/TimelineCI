import { CyclesPage } from '@/components/cycles/cycles-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deployment Cycles – TimelineCI',
  description: 'Manage deployment cycles and coordinate releases.',
};

export default function DashboardPage() {
  return <CyclesPage />;
}
