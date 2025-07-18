import { DeploymentBoard } from '@/components/deployment/deployment-board';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}): Promise<Metadata> {
  const { cycleId } = await params;
  return {
    title: `Deployment Board – Cycle ${cycleId} – Timelin-CI`,
    description: 'Monitor deployments and manage dependencies for this cycle.',
  };
}

interface CyclePageProps {
  params: Promise<{
    cycleId: string;
  }>;
}

export default async function CyclePage({ params }: CyclePageProps) {
  const { cycleId } = await params;
  return <DeploymentBoard cycleId={cycleId} />;
}
