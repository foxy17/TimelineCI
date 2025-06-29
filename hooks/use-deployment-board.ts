import { useState, useEffect, useCallback } from 'react';
import { supabase, DeploymentView, DeploymentState, Microservice, MicroserviceDep } from '@/lib/supabase';
import { toast } from 'sonner';

interface DependencyError {
  serviceName: string;
  unmetDeps: { service_name: string; service_id: string }[];
}

interface UseDeploymentBoardReturn {
  deployments: DeploymentView[];
  services: Microservice[];
  dependencies: MicroserviceDep[];
  loading: boolean;
  cycleLabel: string;
  dependencyError: DependencyError | null;
  isRealTimeConnected: boolean;
  handleStateChange: (
    serviceId: string,
    action: 'ready' | 'start' | 'deployed' | 'failed' | 'reset_not_ready' | 'reset_ready' | 'reset_triggered'
  ) => Promise<void>;
  refreshData: () => Promise<void>;
  clearDependencyError: () => void;
  getServiceDependencies: (serviceId: string) => Array<{
    id: string;
    cycle_id: string;
    service_id: string;
    depends_on_service_id: string;
    created_at: string;
    serviceName: string;
    isDeployed: boolean;
  }>;
}

export function useDeploymentBoard(cycleId: string): UseDeploymentBoardReturn {
  const [deployments, setDeployments] = useState<DeploymentView[]>([]);
  const [services, setServices] = useState<Microservice[]>([]);
  const [dependencies, setDependencies] = useState<MicroserviceDep[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleLabel, setCycleLabel] = useState('');
  const [dependencyError, setDependencyError] = useState<DependencyError | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  const loadData = useCallback(async () => {
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
  }, [cycleId]);

  const setupRealtimeSubscriptions = useCallback(() => {
    const channel = supabase
      .channel(`deployment-updates-${cycleId}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'microservice_deps',
          filter: `cycle_id=eq.${cycleId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealTimeConnected(true);
          toast.success('Real-time updates connected');
        } else if (status === 'CHANNEL_ERROR') {
          setIsRealTimeConnected(false);
          toast.error('Real-time updates unavailable');
        } else if (status === 'CLOSED') {
          setIsRealTimeConnected(false);
        }
      });

    return () => {
      setIsRealTimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, [cycleId, loadData]);

  const handleStateChange = useCallback(async (
    serviceId: string,
    action: 'ready' | 'start' | 'deployed' | 'failed' | 'reset_not_ready' | 'reset_ready' | 'reset_triggered'
  ) => {
    // Optimistic update mapping
    const optimisticStateMap = {
      ready: 'ready' as const,
      start: 'triggered' as const,
      deployed: 'deployed' as const,
      failed: 'failed' as const,
      reset_not_ready: 'not_ready' as const,
      reset_ready: 'ready' as const,
      reset_triggered: 'triggered' as const,
    };

    const newState = optimisticStateMap[action];
    
    // Optimistically update the deployments state
    setDeployments(prev => prev.map(d => 
      d.service_id === serviceId 
        ? { 
            ...d, 
            state: newState,
            updated_at: new Date().toISOString(),
            ...(action === 'start' && { started_at: new Date().toISOString() }),
            ...((['deployed', 'failed'].includes(action)) && { finished_at: new Date().toISOString() })
          }
        : d
    ));

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
        case 'reset_not_ready':
          ({ error } = await supabase.rpc('reset_service_to_not_ready', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
        case 'reset_ready':
          ({ error } = await supabase.rpc('set_service_ready_flexible', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
        case 'reset_triggered':
          ({ error } = await supabase.rpc('reset_service_to_triggered', {
            p_cycle_id: cycleId,
            p_service_id: serviceId,
          }));
          break;
      }

      if (error) {
        // Revert optimistic update on error
        loadData();
        
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
      
      // If real-time is not connected, manually refresh after a short delay
      if (!isRealTimeConnected) {
        setTimeout(() => {
          loadData();
        }, 1000);
      }
      
    } catch (error: any) {
      // Revert optimistic update on error
      loadData();
      toast.error(error.message || 'Failed to update state');
    }
  }, [cycleId, deployments, isRealTimeConnected, loadData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await loadData();
    toast.success('Data refreshed');
  }, [loadData]);

  const clearDependencyError = useCallback(() => {
    setDependencyError(null);
  }, []);

  const getServiceDependencies = useCallback((serviceId: string) => {
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
  }, [dependencies, services, deployments]);

  useEffect(() => {
    loadData();
    const cleanup = setupRealtimeSubscriptions();

    return () => {
      cleanup();
    };
  }, [loadData, setupRealtimeSubscriptions]);

  return {
    deployments,
    services,
    dependencies,
    loading,
    cycleLabel,
    dependencyError,
    isRealTimeConnected,
    handleStateChange,
    refreshData,
    clearDependencyError,
    getServiceDependencies,
  };
} 