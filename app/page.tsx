import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const InlineLoader = () => (
  <svg
    className="h-8 w-8 animate-spin text-indigo-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

// Import components that are above the fold (no lazy loading)
import { LandingHero } from '@/components/landing/hero';
import { LandingFooter } from '@/components/landing/footer';

// Lazy load header component
const LandingHeader = dynamic(
  () => import('@/components/landing/header').then(mod => ({ default: mod.LandingHeader })),
  {
    loading: () => (
      <div className="w-full h-16 flex justify-center items-center">
        <InlineLoader />
      </div>
    ),
  }
);

// Lazy load components below the fold for better performance
const LandingDashboardPreview = dynamic(
  () =>
    import('@/components/landing/dashboard-preview').then(mod => ({
      default: mod.LandingDashboardPreview,
    })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-16 flex justify-center items-center">
        <InlineLoader />
      </div>
    ),
  }
);

const LandingFeatures = dynamic(
  () => import('@/components/landing/features').then(mod => ({ default: mod.LandingFeatures })),
  {
    loading: () => (
      <div className="w-full py-16 md:py-24 lg:py-32 flex justify-center items-center">
        <InlineLoader />
      </div>
    ),
  }
);

const LandingBenefits = dynamic(
  () => import('@/components/landing/benefits').then(mod => ({ default: mod.LandingBenefits })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
        <InlineLoader />
      </div>
    ),
  }
);

const LandingCTA = dynamic(
  () => import('@/components/landing/cta').then(mod => ({ default: mod.LandingCTA })),
  {
    loading: () => (
      <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
        <InlineLoader />
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense
        fallback={
          <div className="w-full h-16 flex justify-center items-center">
            <InlineLoader />
          </div>
        }
      >
        <LandingHeader />
      </Suspense>

      <main className="flex-1">
        <LandingHero />

        <Suspense
          fallback={
            <div className="w-full py-12 md:py-16 flex justify-center items-center">
              <InlineLoader />
            </div>
          }
        >
          <LandingDashboardPreview />
        </Suspense>

        <Suspense
          fallback={
            <div className="w-full py-16 md:py-24 lg:py-32 flex justify-center items-center">
              <InlineLoader />
            </div>
          }
        >
          <LandingFeatures />
        </Suspense>

        <Suspense
          fallback={
            <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
              <InlineLoader />
            </div>
          }
        >
          <LandingBenefits />
        </Suspense>

        <Suspense
          fallback={
            <div className="w-full py-12 md:py-24 lg:py-32 flex justify-center items-center">
              <InlineLoader />
            </div>
          }
        >
          <LandingCTA />
        </Suspense>
      </main>

      <LandingFooter />
    </div>
  );
}
