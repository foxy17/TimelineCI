'use client';

import { DeploymentCycle } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { useLatestCycle } from '@/components/cycles/hooks/use-latest-cycle';
import { LatestCycleServices } from '@/components/cycles/latest-cycle-services';

interface LatestCycleDisplayProps {
  cycle: DeploymentCycle | null;
}

export function LatestCycleDisplay({ cycle }: LatestCycleDisplayProps) {
  const { latestCycleData, loading, getServiceDependencies, getTaskCompletionCount } =
    useLatestCycle(cycle);

  const getCycleStatus = (cycle: DeploymentCycle) => {
    if (cycle.is_active) {
      return { label: 'In Progress', variant: 'default' as const };
    } else if (cycle.completed_at) {
      return { label: 'Completed', variant: 'outline' as const };
    } else {
      return { label: 'Inactive', variant: 'secondary' as const };
    }
  };

  if (!cycle || loading) {
    return null;
  }

  if (!latestCycleData) {
    return null;
  }

  const status = getCycleStatus(latestCycleData.cycle);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              {latestCycleData.cycle.label}
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Started {formatDistanceToNow(new Date(latestCycleData.cycle.created_at))} ago
            </CardDescription>
          </div>
          <Badge
            variant={status.variant}
            className={clsx(
              latestCycleData.cycle.is_active && 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <LatestCycleServices
          services={latestCycleData.services}
          getServiceDependencies={getServiceDependencies}
          getTaskCompletionCount={getTaskCompletionCount}
        />
      </CardContent>
    </Card>
  );
}
