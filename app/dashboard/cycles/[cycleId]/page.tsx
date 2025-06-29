import { DeploymentBoard } from '@/components/deployment/deployment-board';

interface CyclePageProps {
  params: Promise<{
    cycleId: string;
  }>;
}

export default async function CyclePage({ params }: CyclePageProps) {
  const { cycleId } = await params;
  return <DeploymentBoard cycleId={cycleId} />;
}