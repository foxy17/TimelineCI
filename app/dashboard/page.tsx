import { CyclesPage } from '@/components/cycles/cycles-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deployment Cycles – Timelin-CI',
  description: 'Manage deployment cycles and coordinate releases.',
};

export default function DashboardPage() {
  return <CyclesPage />;
}
