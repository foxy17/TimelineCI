'use client';

import { useState, useEffect } from 'react';
import { supabase, DeploymentView, DeploymentState, Microservice, MicroserviceDep } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeploymentCard } from '@/components/deployment/deployment-card';
import { DependencyErrorModal } from '@/components/deployment/dependency-error-modal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [deployments, setDeployments] = useState<DeploymentView[]>([]);
  const [services, setServices] = useState<Microservice[]>([]);
  const [dependencies, setDependencies] = useState<MicroserviceDep[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleLabel, setCycleLabel] = useState('');
  const [dependencyError, setDependencyError] = useState<{
    serviceName: string;
    unmetDeps: { service_name: string; service_id: string }[];
  } | null>(null);

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();

    return () => {
      supabase.removeAllChannels();
    };
  }, [cycleId]);

  const loadData = async () => {
    try {
      // Load deployments
      const { data: deploymentsData, error: deploymentsError } = await supabase
        .from('v_deployments')
        .select('*')
        .eq('cycle_id', cycleId);

      if (deploymentsError) throw deploymentsError;

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('microservices')
        .select('*');

      if (servicesError) throw servicesError;

      // Load cycle-specific dependencies
      const { data: depsData, error: depsError } = await supabase
        .from('microservice_deps')
        .select('*')
        .eq('cycle_id', cycleId);

      if (depsError) throw depsError;

      setDeployments(deploymentsData || []);
      setServices(servicesData || []);
      setDependencies(depsData || []);
      
      if (deploymentsData && deploymentsData.length > 0) {
        setCycleLabel(deploymentsData[0].cycle_label);
      }
    } catch (error) {
      toast.error('Failed to load deployment data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('deployment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_deployments',
          filter: `cycle_id=eq.${cycleId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStateChange = async (
    serviceId: string,
    action: 'ready' | 'start' | 'deployed' | 'failed'
  ) => {
    try {
      let error;

      switch (action) {
        case 'ready':
          ({ error } = await supabase.rpc('set_service_ready', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
        case 'start':
          ({ error } = await supabase.rpc('start_deployment', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
        case 'deployed':
          ({ error } = await supabase.rpc('mark_deployed', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
        case 'failed':
          ({ error } = await supabase.rpc('mark_failed', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
      }

      if (error) {
        if (error.message === 'DEPENDENCIES_NOT_DEPLOYED') {
          // Get unmet dependencies for this cycle
          const { data: unmetDeps } = await supabase.rpc('get_unmet_dependencies', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          });

          const serviceName = deployments.find(d => d.service_id === serviceId)?.service_name || 'Unknown';
          setDependencyError({
            serviceName,
            unmetDeps: unmetDeps || [],
          });
          return;
        }
        throw error;
      }

      toast.success('State updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update state');
    }
  };

  const getServiceDependencies = (serviceId: string) => {
    return dependencies
      .filter(dep => dep.service_id === serviceId)
      .map(dep => {
        const depService = services.find(s => s.id === dep.depends_on_service_id);
        const depDeployment = deployments.find(d => d.service_id === dep.depends_on_service_id);
        return {
          ...dep,
          serviceName: depService?.name || 'Unknown',
          isDeployed: depDeployment?.state === 'deployed',
        };
      });
  };

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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{cycleLabel}</h1>
          <p className="text-slate-600">Deployment Board - Cycle-Specific Dependencies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {Object.entries(stateConfig).map(([state, config]) => (
          <Card key={state} className={`${config.color} min-h-[600px]`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {config.label}
                <Badge variant={config.badge as any}>
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
        onOpenChange={() => setDependencyError(null)}
        serviceName={dependencyError?.serviceName || ''}
        unmetDependencies={dependencyError?.unmetDeps || []}
      />
    </div>
  );
}