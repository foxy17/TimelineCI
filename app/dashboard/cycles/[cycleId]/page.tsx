import { DeploymentBoard } from '@/components/deployment/deployment-board';

interface CyclePageProps {
  params: {
    cycleId: string;
  };
}

export default function CyclePage({ params }: CyclePageProps) {
  return <DeploymentBoard cycleId={params.cycleId} />;
}