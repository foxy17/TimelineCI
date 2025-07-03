import { useState, useEffect } from 'react';
import { supabase, TenantService, DeploymentCycle } from '@/lib/supabase';
import { toast } from 'sonner';

export function useServicesData() {
  const [tenantServices, setTenantServices] = useState<TenantService[]>([]);
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tenantServicesRes, cyclesRes] = await Promise.all([
        supabase.rpc('get_tenant_services'),
        supabase.from('deployment_cycles').select('*').order('created_at', { ascending: false }),
      ]);

      if (tenantServicesRes.error) throw tenantServicesRes.error;
      if (cyclesRes.error) throw cyclesRes.error;

      setTenantServices(tenantServicesRes.data || []);
      setCycles(cyclesRes.data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    tenantServices,
    cycles,
    loading,
    refetch: loadData,
  };
} 