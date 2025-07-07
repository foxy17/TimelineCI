'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import analytics only when needed
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })),
  { ssr: false }
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })),
  { ssr: false }
);

export function ConditionalAnalytics() {
  const pathname = usePathname();

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
