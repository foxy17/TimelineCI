import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DeploymentCycle, DeploymentView, MicroserviceDep } from '@/lib/supabase';

interface LatestCycleData {
  cycle: DeploymentCycle;
  services: DeploymentView[];
  dependencies: MicroserviceDep[];
}

interface UseLatestCycleReturn {
  latestCycleData: LatestCycleData | null;
  loading: boolean;
  getServiceDependencies: (serviceId: string) => Array<{
    serviceName: string;
    isDeployed: boolean;
  }>;
  getTaskCompletionCount: (service: DeploymentView) => {
    completed: number;
    total: number;
  };
}

export function useLatestCycle(cycle: DeploymentCycle | null): UseLatestCycleReturn {
  const [latestCycleData, setLatestCycleData] = useState<LatestCycleData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLatestCycleData = useCallback(async (cycle: DeploymentCycle) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: services, error: servicesError } = await supabase
        .from('v_deployments')
        .select('*')
        .eq('cycle_id', cycle.id)
        .order('service_name');

      if (servicesError) throw servicesError;

      // Load dependencies for the cycle
      const { data: dependencies, error: depsError } = await supabase
        .from('microservice_deps')
        .select('*')
        .eq('cycle_id', cycle.id);

      if (depsError) throw depsError;

      setLatestCycleData({
        cycle,
        services: services || [],
        dependencies: dependencies || [],
      });
    } catch (error) {
      console.error('Failed to load latest cycle data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceDependencies = useCallback((serviceId: string) => {
    if (!latestCycleData) return [];
    
    return latestCycleData.dependencies
      .filter(dep => dep.service_id === serviceId)
      .map(dep => {
        const dependencyService = latestCycleData.services.find(s => s.service_id === dep.depends_on_service_id);
        return {
          serviceName: dependencyService?.service_name || 'Unknown Service',
          isDeployed: dependencyService?.state === 'deployed'
        };
      });
  }, [latestCycleData]);

  const getTaskCompletionCount = useCallback((service: DeploymentView) => {
    if (!service.tasks || service.tasks.length === 0) return { completed: 0, total: 0 };
    
    const completed = service.tasks.filter(task => task.completed).length;
    return { completed, total: service.tasks.length };
  }, []);

  useEffect(() => {
    if (cycle) {
      loadLatestCycleData(cycle);
    } else {
      setLatestCycleData(null);
    }
  }, [cycle, loadLatestCycleData]);

  return {
    latestCycleData,
    loading,
    getServiceDependencies,
    getTaskCompletionCount,
  };
} 