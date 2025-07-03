import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useServiceOperations() {
  const [serviceToRemove, setServiceToRemove] = useState<string | null>(null);

  const addServiceToCycle = async (cycleId: string, serviceId: string) => {
    if (!cycleId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('add_service_to_cycle', {
        p_cycle_id: cycleId,
        p_service_id: serviceId,
      });

      if (error) throw error;

      toast.success('Service added to cycle!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to add service to cycle');
      return false;
    }
  };

  const removeServiceFromCycle = async (cycleId: string, serviceId: string) => {
    if (!cycleId || !serviceId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('remove_service_from_cycle', {
        p_cycle_id: cycleId,
        p_service_id: serviceId,
      });

      if (error) throw error;

      toast.success('Service removed from cycle!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove service from cycle');
      return false;
    }
  };

  const confirmRemoveService = async (cycleId: string) => {
    if (!serviceToRemove) return false;

    const success = await removeServiceFromCycle(cycleId, serviceToRemove);
    setServiceToRemove(null);
    return success;
  };

  return {
    serviceToRemove,
    setServiceToRemove,
    addServiceToCycle,
    removeServiceFromCycle,
    confirmRemoveService,
  };
}
