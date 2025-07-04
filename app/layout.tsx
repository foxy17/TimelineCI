import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://timeline-ci.vercel.app/' // Replace with your actual domain
      : 'http://localhost:3000'
  ),
  title: 'TimelineCI - Deployment Dashboard',
  description: 'Coordinate deployments with dependency-aware orchestration',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TimelineCI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'TimelineCI',
    title: 'TimelineCI - Deployment Dashboard',
    description: 'Coordinate deployments with dependency-aware orchestration',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TimelineCI - Deployment Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TimelineCI - Deployment Dashboard',
    description: 'Coordinate deployments with dependency-aware orchestration',
    images: ['/twitter.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
