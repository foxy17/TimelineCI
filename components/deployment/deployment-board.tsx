'use client';

import { DeploymentView, DeploymentState } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeploymentCard } from '@/components/deployment/deployment-card';
import { DependencyErrorModal } from '@/components/deployment/dependency-error-modal';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDeploymentBoard } from '@/hooks/use-deployment-board';

interface DeploymentBoardProps {
  cycleId: string;
}

const stateConfig = {
  not_ready: {
    label: 'Not Ready',
    color: 'bg-slate-100 border-slate-200',
    badge: 'secondary',
  },
  ready: {
    label: 'Ready',
    color: 'bg-blue-50 border-blue-200',
    badge: 'default',
  },
  triggered: {
    label: 'In Progress',
    color: 'bg-yellow-50 border-yellow-200',
    badge: 'default',
  },
  deployed: {
    label: 'Deployed',
    color: 'bg-green-50 border-green-200',
    badge: 'default',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-50 border-red-200',
    badge: 'destructive',
  },
} as const;

export function DeploymentBoard({ cycleId }: DeploymentBoardProps) {
  const {
    deployments,
    loading,
    cycleLabel,
    dependencyError,
    isRealTimeConnected,
    handleStateChange,
    refreshData,
    clearDependencyError,
    getServiceDependencies,
  } = useDeploymentBoard(cycleId);

  if (loading) {
    return <div className="text-center py-8">Loading deployment board...</div>;
  }

  const groupedDeployments = Object.entries(stateConfig).reduce((acc, [state]) => {
    acc[state as DeploymentState] = deployments.filter(d => d.state === state);
    return acc;
  }, {} as Record<DeploymentState, DeploymentView[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cycles
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{cycleLabel}</h1>
          <p className="text-slate-600">Deployment Board - Cycle-Specific Dependencies</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-slate-600">
              {isRealTimeConnected ? 'Real-time connected' : 'Real-time disconnected'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {Object.entries(stateConfig).map(([state, config]) => (
          <Card key={state} className={`${config.color} min-h-[600px]`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {config.label}
                <Badge 
                  variant={config.badge as any}
                  className={state === 'deployed' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                >
                  {groupedDeployments[state as DeploymentState]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedDeployments[state as DeploymentState]?.map((deployment) => (
                <DeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  dependencies={getServiceDependencies(deployment.service_id)}
                  onStateChange={(action) => handleStateChange(deployment.service_id, action)}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <DependencyErrorModal
        open={!!dependencyError}
        onOpenChange={clearDependencyError}
        serviceName={dependencyError?.serviceName || ''}
        unmetDependencies={dependencyError?.unmetDeps || []}
      />
    </div>
  );
}