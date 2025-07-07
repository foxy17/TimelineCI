import { Navigation } from '@/components/layout/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  );
}
