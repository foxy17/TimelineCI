import { HistoryPage } from '@/components/history/history-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deployment History – TimelineCI',
  description: 'View a timeline of past deployments and track deployment activities.',
};

export default function HistoryRoute() {
  return <HistoryPage />;
}
