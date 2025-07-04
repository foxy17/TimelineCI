import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DeploymentCycle } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseCyclesReturn {
  cycles: DeploymentCycle[];
  loading: boolean;
  activeCycle: DeploymentCycle | null;
  latestCycle: DeploymentCycle | null;
  loadCycles: () => Promise<void>;
  handleActivateCycle: (cycleId: string) => Promise<void>;
  handleCompleteCycle: () => Promise<void>;
}

export function useCycles(): UseCyclesReturn {
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCycles = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('deployment_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      toast.error('Failed to load deployment cycles');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleActivateCycle = useCallback(async (cycleId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('activate_cycle', {
        p_cycle_id: cycleId,
      });

      if (error) throw error;

      toast.success('Cycle activated successfully!');
      await loadCycles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate cycle');
    }
  }, [loadCycles]);

  const handleCompleteCycle = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('complete_active_cycle');

      if (error) throw error;

      toast.success('Cycle completed successfully!');
      await loadCycles();
    } catch (error: any) {
      if (error.message === 'NO_ACTIVE_CYCLE') {
        toast.error('No active cycle to complete');
      } else {
        toast.error(error.message || 'Failed to complete cycle');
      }
    }
  }, [loadCycles]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const activeCycle = cycles.find(c => c.is_active) || null;
  const latestCycle = cycles.length > 0 ? cycles[0] : null;

  return {
    cycles,
    loading,
    activeCycle,
    latestCycle,
    loadCycles,
    handleActivateCycle,
    handleCompleteCycle,
  };
} 