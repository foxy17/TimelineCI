import { ServicesPage } from '@/components/services/services-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services – Timelin-CI',
  description: 'Manage your service pool and assign services to deployment cycles.',
};

export default function ServicesRoute() {
  return <ServicesPage />;
}
