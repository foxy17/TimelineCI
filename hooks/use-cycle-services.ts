import { useState, useEffect } from 'react';
import { supabase, TenantService, CycleServiceWithState } from '@/lib/supabase';
import { toast } from 'sonner';

export function useCycleServices(selectedCycleId: string) {
  const [cycleServices, setCycleServices] = useState<CycleServiceWithState[]>([]);
  const [availableServices, setAvailableServices] = useState<TenantService[]>([]);

  const loadCycleData = async () => {
    if (!selectedCycleId) return;

    try {
      const [cycleServicesRes, availableServicesRes] = await Promise.all([
        supabase.rpc('get_cycle_services', { p_cycle_id: selectedCycleId }),
        supabase.rpc('get_available_services_for_cycle', { p_cycle_id: selectedCycleId }),
      ]);

      if (cycleServicesRes.error) throw cycleServicesRes.error;
      if (availableServicesRes.error) throw availableServicesRes.error;

      setCycleServices(cycleServicesRes.data || []);
      setAvailableServices(availableServicesRes.data || []);
    } catch (error) {
      toast.error('Failed to load cycle services');
    }
  };

  useEffect(() => {
    if (selectedCycleId) {
      loadCycleData();
    }
  }, [selectedCycleId]);

  return {
    cycleServices,
    availableServices,
    refetch: loadCycleData,
  };
} 