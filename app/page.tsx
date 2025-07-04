import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import components that are above the fold (no lazy loading)
import { LandingHeader } from '@/components/landing/header';
import { LandingHero } from '@/components/landing/hero';
import { LandingFooter } from '@/components/landing/footer';

// Lazy load components below the fold for better performance
const LandingDashboardPreview = dynamic(
  () => import('@/components/landing/dashboard-preview').then(mod => ({ default: mod.LandingDashboardPreview })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }
);

const LandingFeatures = dynamic(
  () => import('@/components/landing/features').then(mod => ({ default: mod.LandingFeatures })),
  {
    loading: () => (
      <div className="w-full py-16 md:py-24 lg:py-32 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }
);

const LandingBenefits = dynamic(
  () => import('@/components/landing/benefits').then(mod => ({ default: mod.LandingBenefits })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }
);

const LandingCTA = dynamic(
  () => import('@/components/landing/cta').then(mod => ({ default: mod.LandingCTA })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }
);

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      
      <main className="flex-1 w-full overflow-x-hidden">
        <LandingHero />
        
        <Suspense fallback={
          <div className="w-full py-12 md:py-16 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <LandingDashboardPreview />
        </Suspense>
        
        <Suspense fallback={
          <div className="w-full py-16 md:py-24 lg:py-32 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <LandingFeatures />
        </Suspense>
        
        <Suspense fallback={
          <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <LandingBenefits />
        </Suspense>
        
        <Suspense fallback={
          <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }>
          <LandingCTA />
        </Suspense>
      </main>

      <LandingFooter />
    </div>
  );
}
