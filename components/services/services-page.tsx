'use client';

import { useState, useEffect } from 'react';
import { supabase, TenantService, CycleServiceWithState, DeploymentCycle } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateServiceModal } from '@/components/services/create-service-modal';
import { CycleDependencyModal } from '@/components/services/cycle-dependency-modal';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, GitBranch, Link as LinkIcon, Calendar, Users, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ServicesPage() {
  const [tenantServices, setTenantServices] = useState<TenantService[]>([]);
  const [cycleServices, setCycleServices] = useState<CycleServiceWithState[]>([]);
  const [availableServices, setAvailableServices] = useState<TenantService[]>([]);
  const [cycles, setCycles] = useState<DeploymentCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<TenantService | CycleServiceWithState | null>(null);
  const [serviceToRemove, setServiceToRemove] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      loadCycleData();
    }
  }, [selectedCycleId]);

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
      
      // Auto-select the most recent cycle
      if (cyclesRes.data && cyclesRes.data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(cyclesRes.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

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

  const handleServiceCreated = () => {
    loadData();
    setCreateModalOpen(false);
  };

  const handleDependenciesUpdated = () => {
    loadCycleData();
    setDependencyModalOpen(false);
    setSelectedService(null);
  };

  const handleAddServiceToCycle = async (serviceId: string) => {
    if (!selectedCycleId) return;

    try {
      const { error } = await supabase.rpc('add_service_to_cycle', {
        p_cycle_id: selectedCycleId,
        p_service_id: serviceId,
      });

      if (error) throw error;

      toast.success('Service added to cycle!');
      loadData();
      loadCycleData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add service to cycle');
    }
  };

  const handleRemoveServiceFromCycle = async () => {
    if (!selectedCycleId || !serviceToRemove) return;

    try {
      const { error } = await supabase.rpc('remove_service_from_cycle', {
        p_cycle_id: selectedCycleId,
        p_service_id: serviceToRemove,
      });

      if (error) throw error;

      toast.success('Service removed from cycle!');
      loadData();
      loadCycleData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove service from cycle');
    } finally {
      setServiceToRemove(null);
    }
  };

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600 mt-1">
            Manage your service pool and deployment cycles
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Tabs defaultValue="pool" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pool" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Service Pool
            <Badge variant="secondary">{tenantServices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cycle Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pool" className="space-y-6">
          {tenantServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No services in pool
                </h3>
                <p className="text-slate-600 text-center mb-4">
                  Create your first service to start building your deployment pool
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenantServices.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline">
                        {service.in_cycles} cycle{service.in_cycles !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {service.description && (
                      <CardDescription>{service.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span>Created {new Date(service.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedService(service);
                          setDependencyModalOpen(true);
                        }}
                        disabled={!selectedCycleId}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          {cycles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No deployment cycles
                </h3>
                <p className="text-slate-600 text-center mb-4">
                  Create a deployment cycle to start managing service deployments
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cycle Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Select Deployment Cycle
                  </CardTitle>
                  <CardDescription>
                    Choose which services participate in each deployment cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a deployment cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycles.map(cycle => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            {cycle.label} {cycle.is_active ? '(Active)' : '(Inactive)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCycle && (
                      <div className="flex gap-2">
                        <Badge variant={selectedCycle.is_active ? "default" : "outline"}>
                          {selectedCycle.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          Created {new Date(selectedCycle.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedCycleId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Services in Cycle */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Services in Cycle
                        <Badge variant="secondary">{cycleServices.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Services participating in this deployment cycle
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {cycleServices.length === 0 ? (
                        <p className="text-slate-600 text-center py-4">
                          No services in this cycle yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {cycleServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{service.name}</span>
                                  <Badge 
                                    variant={
                                      service.deployment_state === 'deployed' ? 'default' :
                                      service.deployment_state === 'failed' ? 'destructive' :
                                      service.deployment_state === 'triggered' ? 'secondary' :
                                      'outline'
                                    }
                                  >
                                    {service.deployment_state.replace('_', ' ')}
                                  </Badge>
                                </div>
                                {service.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedService(service);
                                    setDependencyModalOpen(true);
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setServiceToRemove(service.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Available Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Available Services
                        <Badge variant="secondary">{availableServices.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Services that can be added to this cycle
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {availableServices.length === 0 ? (
                        <p className="text-slate-600 text-center py-4">
                          All services are already in this cycle
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {availableServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <span className="font-medium">{service.name}</span>
                                {service.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddServiceToCycle(service.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleServiceCreated}
      />

      {selectedService && (
        <CycleDependencyModal
          open={dependencyModalOpen}
          onOpenChange={setDependencyModalOpen}
          service={selectedService}
          cycleId={selectedCycleId}
          onSuccess={handleDependenciesUpdated}
        />
      )}

      <AlertDialog open={!!serviceToRemove} onOpenChange={() => setServiceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service from Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this service from the deployment cycle? 
              This will also remove any dependencies involving this service in this cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveServiceFromCycle}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}